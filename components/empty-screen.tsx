import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

const exampleMessages = [
  {
    heading: '¿Qué es programación orientada a objetos?',
    message: '¿Qué es programación orientada a objetos?'
  },
  {
    heading: '¿Qué es una clase es programación orientada a objetos?',
    message: '¿Qué es una clase es programación orientada a objetos?'
  },
  {
    heading: '¿Qué es un objeto es programación orientada a objetos?',
    message: '¿Qué es un objeto es programación orientada a objetos?'
  },
  {
    heading: '¿Cuál es la diferencia entre una clase y un objeto?',
    message: '¿Cuál es la diferencia entre una clase y un objeto?'
  }
]

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">
          Asistente de aprendizaje de programación orientada a objetos
        </h1>
        <p className="leading-normal text-muted-foreground">
          Chatbot con Inteligencia Artificial para responder preguntas sobre programación.
        </p>
      </div>
    </div>
  )
}
