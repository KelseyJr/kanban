import type { Card } from '@/types/card'
import type { Project } from '@/types/project'

const TIMESTAMP = '2026-11-16T12:00:00.000Z'

type BuildProjectParams = Partial<Project>

export function buildProject(overrides: BuildProjectParams = {}): Project {
  return { id: 'project-1', name: 'kanban', createdAt: TIMESTAMP, updatedAt: TIMESTAMP, ...overrides }
}

type BuildCardParams = Partial<Card>

export function buildCard(overrides: BuildCardParams = {}): Card {
  return {
    id: 'card-1',
    projectId: 'project-1',
    stage: 'backlog',
    position: 0,
    title: 'Card',
    description: '',
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  }
}
