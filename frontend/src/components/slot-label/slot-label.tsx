import type { ReactElement } from 'react'

type SlotLabelProps = {
  id: string
  name: string
  count: number
  headingLevel: 'h1' | 'h2'
}

export function SlotLabel({ id, name, count, headingLevel: Heading }: SlotLabelProps): ReactElement {
  return (
    <div className="my-3.5 flex items-center justify-between rounded-[3px] border-2 border-ink bg-postal px-2.5 py-1.5">
      <Heading id={id} className="text-[15px] font-bold tracking-[0.08em] uppercase [font-stretch:80%]">
        {name}
      </Heading>
      <span className="min-w-7 rounded-[2px] bg-ink px-1.5 text-center text-[15px] font-extrabold text-postal">
        <span className="sr-only">Quantidade: </span>
        {count}
      </span>
    </div>
  )
}
