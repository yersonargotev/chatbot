import 'server-only'

import {
  StreamableValue,
  createAI,
  createStreamableUI,
  createStreamableValue,
  getAIState,
  getMutableAIState
} from 'ai/rsc'

import { BotMessage } from '@/components/stocks'

import { saveChat } from '@/app/actions'
import { auth } from '@/auth'
import { UserMessage } from '@/components/stocks/message'
import { Spinner } from '@/components/ui/spinner'
import { Chat } from '@/lib/types'
import { nanoid } from '@/lib/utils'
import { CoreMessage } from 'ai'
import { inquire, querySuggestor, researcher, taskManager } from './agents'
import { writer } from './agents/writer'

async function submitUserMessage(content: string, skip?: boolean) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()
  const uiStream = createStreamableUI()
  const isGenerating = createStreamableValue(true)
  const isCollapsed = createStreamableValue(false)

  const messages: Message[] = aiState.get().messages
  const useSpecificAPI = process.env.USE_SPECIFIC_API_FOR_WRITER === 'true'
  const maxMessages = useSpecificAPI ? 5 : 10
  // Limit the number of messages to the maximum
  messages.splice(0, Math.max(messages.length - maxMessages, 0))

  // Get the user input from the form data
  const userInput = skip ? `{"action": "skip"}` : content

  // Add the user message to the state
  if (content) {
    const message: Message = { id: nanoid(), role: 'user', content: userInput }
    messages.push(message)
    aiState.update({
      ...aiState.get(),
      messages
    })
  }

  async function processEvents() {
    let action: any = { object: { next: 'proceed' } }
    // If the user skips the task, we proceed to the search
    if (!skip) action = (await taskManager(messages as CoreMessage[])) ?? action

    if (action.object.next === 'inquire') {
      // Generate inquiry
      const inquiry = await inquire(uiStream, messages as CoreMessage[])

      uiStream.done()
      isGenerating.done()
      isCollapsed.done(false)
      aiState.done({
        ...aiState.get(),
        messages: [
          ...aiState.get().messages,
          {
            id: nanoid(),
            role: 'assistant',
            content: `inquiry: ${inquiry?.question}`
          }
        ]
      })
      return
    }

    // Set the collapsed state to true
    isCollapsed.done(true)

    //  Generate the answer
    let answer = ''
    let toolOutputs = []
    let errorOccurred = false
    const streamText:
      | undefined
      | ReturnType<typeof createStreamableValue<string>> =
      createStreamableValue<string>('')
    uiStream.update(<Spinner />)

    // If useSpecificAPI is enabled, only function calls will be made
    // If not using a tool, this model generates the answer
    while (
      useSpecificAPI
        ? toolOutputs.length === 0 && answer.length === 0
        : answer.length === 0
    ) {
      // Search the web and generate the answer
      const { fullResponse, hasError, toolResponses } = await researcher(
        uiStream,
        streamText,
        messages as CoreMessage[],
        useSpecificAPI
      )
      answer = fullResponse
      toolOutputs = toolResponses
      errorOccurred = hasError
    }

    // If useSpecificAPI is enabled, generate the answer using the specific model
    if (useSpecificAPI && answer.length === 0) {
      // modify the messages to be used by the specific model
      const modifiedMessages = messages.map(msg =>
        msg.role === 'tool'
          ? {
              ...msg,
              id: nanoid(),
              role: 'assistant',
              content: JSON.stringify(msg.content)
            }
          : msg
      ) as Message[]

      answer = await writer(
        uiStream,
        streamText,
        modifiedMessages as CoreMessage[]
      )
    } else {
      streamText.done()
    }

    if (!errorOccurred) {
      // Generate related queries
      await querySuggestor(uiStream, messages as CoreMessage[])
    }

    isGenerating.done(false)
    uiStream.done()
    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        { id: nanoid(), role: 'assistant', content: answer }
      ]
    })
  }

  processEvents()

  return {
    id: nanoid(),
    isCollapsed: isCollapsed.value,
    isGenerating: isGenerating.value,
    display: uiStream.value
  }
}

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
  content: string
  id: string
  name?: string
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  isGenerating?: StreamableValue<boolean>
  isCollapsed?: StreamableValue<boolean>
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState()

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state, done }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`
      const title = messages[0].content.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'user' ? (
          <UserMessage>{message.content}</UserMessage>
        ) : (
          <BotMessage content={message.content} />
        )
    }))
}
