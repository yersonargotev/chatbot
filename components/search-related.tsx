'use client'

import { AI } from '@/lib/chat/actions'
import { PartialRelated } from '@/lib/schema/related'
import { useActions, useStreamableValue, useUIState } from 'ai/rsc'
import { ArrowRight } from 'lucide-react'
import { nanoid } from 'nanoid'
import React from 'react'
import { UserMessage } from './stocks/message'
import { Button } from './ui/button'

export interface SearchRelatedProps {
  relatedQueries: PartialRelated
}

export const SearchRelated: React.FC<SearchRelatedProps> = ({
  relatedQueries
}) => {
  const { submitUserMessage } = useActions()
  const [, setMessages] = useUIState<typeof AI>()
  const [data, error, pending] =
    useStreamableValue<PartialRelated>(relatedQueries)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget as HTMLFormElement)

    // // Get the submitter of the form
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLInputElement
    let query = ''
    if (submitter) {
      formData.append(submitter.name, submitter.value)
      query = submitter.value
    }

    const userMessage = {
      id: nanoid(),
      component: <UserMessage>{query}</UserMessage>
    }
    const content = formData.get('related_query') as string

    const responseMessage = await submitUserMessage(content)
    setMessages(currentMessages => [
      ...currentMessages,
      userMessage,
      responseMessage
    ])
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap">
      {data?.items
        ?.filter(item => item?.query !== '')
        .map((item, index) => (
          <div className="flex items-start w-full" key={index}>
            <ArrowRight className="size-4 mr-2 mt-1 shrink-0 text-accent-foreground/50" />
            <Button
              variant="link"
              className="flex-1 justify-start px-0 py-1 h-fit font-semibold text-accent-foreground/50 whitespace-normal text-left"
              type="submit"
              name={'related_query'}
              value={item?.query}
            >
              {item?.query}
            </Button>
          </div>
        ))}
    </form>
  )
}

export default SearchRelated
