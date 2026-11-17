export const CARD_STAGE = {
  backlog: 'backlog',
  explore: 'explore',
  propose: 'propose',
  apply: 'apply',
  archive: 'archive',
} as const

export type CardStage = (typeof CARD_STAGE)[keyof typeof CARD_STAGE]

export const ORDERED_CARD_STAGES = [
  CARD_STAGE.backlog,
  CARD_STAGE.explore,
  CARD_STAGE.propose,
  CARD_STAGE.apply,
  CARD_STAGE.archive,
] as const satisfies readonly CardStage[]

export type Card = {
  id: string
  projectId: string
  stage: CardStage
  position: number
  title: string
  description: string
  createdAt: Date
  updatedAt: Date
}
