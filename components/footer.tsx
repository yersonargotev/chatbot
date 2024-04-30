import React from 'react'

import { ExternalLink } from '@/components/external-link'
import { cn } from '@/lib/utils'

export function FooterText({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'px-2 text-center text-xs leading-normal text-muted-foreground',
        className
      )}
      {...props}
    >
      {' '}
      <ExternalLink href="https://github.com/vercel/ai-chatbot.git">
        Open source AI chatbot
      </ExternalLink>
    </p>
  )
}
