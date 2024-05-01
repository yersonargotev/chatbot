'use client'

import type { AI } from '@/lib/chat/actions'
import { useActions, useUIState } from 'ai/rsc'
import { ArrowRight } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useState } from 'react'
import { UserMessage } from './stocks/message'
import { Button } from './ui/button'
import { Input } from './ui/input'

export function FollowupPanel() {
  const [input, setInput] = useState('')
  const { submitUserMessage } = useActions()
  const [, setMessages] = useUIState<typeof AI>()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget as HTMLFormElement)
    const content = formData.get('input') as string

    const userMessage = {
      id: nanoid(),
      isGenerating: false,
      component: <UserMessage>{input}</UserMessage>
    }

    const responseMessage = await submitUserMessage(content)
    setMessages(currentMessages => [
      ...currentMessages,
      userMessage,
      responseMessage
    ])

    setInput('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-center space-x-1"
    >
      <Input
        type="text"
        name="input"
        placeholder="Haz otra pregunta..."
        value={input}
        className="pr-14 h-12"
        onChange={e => setInput(e.target.value)}
      />
      <Button
        type="submit"
        size={'icon'}
        disabled={input.length === 0}
        variant={'ghost'}
        className="absolute right-1"
      >
        <ArrowRight size={20} />
      </Button>
    </form>
  )
}
