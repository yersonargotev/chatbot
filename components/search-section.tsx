'use client'

import type { SearchResults as TypeSearchResults } from '@/lib/types'
import { StreamableValue, useStreamableValue } from 'ai/rsc'
import { SearchResults } from './search-results'
import { SearchResultsImageSection } from './search-results-image'
import { SearchSkeleton } from './search-skeleton'
import { Section } from './section'
import { ToolBadge } from './tool-badge'

export type SearchSectionProps = {
  result?: StreamableValue<string>
}

export function SearchSection({ result }: SearchSectionProps) {
  const [data, error, pending] = useStreamableValue(result)
  const results: TypeSearchResults = data ? JSON.parse(data) : undefined
  return (
    <div>
      {!pending && data ? (
        <>
          <Section size="sm" className="pt-2 pb-0">
            <ToolBadge tool="search">{`${results.query}`}</ToolBadge>
          </Section>
          {results.images && results.images.length > 0 && (
            <Section title="Imagenes">
              <SearchResultsImageSection
                images={results.images}
                query={results.query}
              />
            </Section>
          )}
          <Section title="Resultados">
            <SearchResults results={results.results} />
          </Section>
        </>
      ) : (
        <Section className="pt-2 pb-0">
          <SearchSkeleton />
        </Section>
      )}
    </div>
  )
}
