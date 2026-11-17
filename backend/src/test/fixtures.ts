import type { Card } from '@/domain/card/card.entity'
import type { CardsRepository } from '@/domain/card/cards.repository'
import type { Project } from '@/domain/project/project.entity'
import type { ProjectsRepository } from '@/domain/project/projects.repository'
import { mock } from 'bun:test'

const FIXED_DATE = new Date('2026-11-16T12:00:00.000Z')

type BuildProjectParams = {
  overrides?: Partial<Project>
}

export function buildProject({ overrides = {} }: BuildProjectParams = {}): Project {
  return { id: 'project-1', name: 'kanban', createdAt: FIXED_DATE, updatedAt: FIXED_DATE, ...overrides }
}

type BuildCardParams = {
  overrides?: Partial<Card>
}

export function buildCard({ overrides = {} }: BuildCardParams = {}): Card {
  return {
    id: 'card-1',
    projectId: 'project-1',
    stage: 'backlog',
    position: 0,
    title: 'Card',
    description: '',
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  }
}

type BuildProjectsRepositoryParams = {
  overrides?: Partial<ProjectsRepository>
}

export function buildProjectsRepository({ overrides = {} }: BuildProjectsRepositoryParams = {}): ProjectsRepository {
  return {
    list: mock(async () => ({ projects: [] })),
    findById: mock(async () => ({ project: null })),
    create: mock(async () => ({ project: buildProject() })),
    rename: mock(async () => ({ project: null })),
    remove: mock(async () => ({ project: null })),
    ...overrides,
  }
}

type BuildCardsRepositoryParams = {
  overrides?: Partial<CardsRepository>
}

export function buildCardsRepository({ overrides = {} }: BuildCardsRepositoryParams = {}): CardsRepository {
  return {
    list: mock(async () => ({ cards: [] })),
    create: mock(async () => ({ card: buildCard() })),
    update: mock(async () => ({ card: null })),
    remove: mock(async () => ({ card: null })),
    move: mock(async () => ({ card: null })),
    ...overrides,
  }
}
