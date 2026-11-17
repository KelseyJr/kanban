import { beforeEach, describe, expect, it } from 'bun:test'
import { eq } from 'drizzle-orm'
import { ProjectNameAlreadyExistsError } from '@/domain/project/project.errors'
import { resetDatabase, testDatabase } from '@/test/setup-database'
import { cards } from '../schema'
import { DrizzleProjectsRepository } from './projects.repository'

const projectsRepository = new DrizzleProjectsRepository({ database: testDatabase })

beforeEach(resetDatabase)

describe('DrizzleProjectsRepository', () => {
  it('lists projects in case-insensitive alphabetical order', async () => {
    await projectsRepository.create({ name: 'site' })
    await projectsRepository.create({ name: 'Api' })
    await projectsRepository.create({ name: 'kanban' })

    const { projects } = await projectsRepository.list()

    expect(projects.map((project) => project.name)).toEqual(['Api', 'kanban', 'site'])
  })

  it('finds a project by id and returns null for an unknown id', async () => {
    const { project: created } = await projectsRepository.create({ name: 'kanban' })

    const { project } = await projectsRepository.findById({ projectId: created.id })
    const { project: missing } = await projectsRepository.findById({ projectId: crypto.randomUUID() })

    expect(project).toEqual(created)
    expect(missing).toBeNull()
  })

  it('rejects a name already used with another capitalization', async () => {
    await projectsRepository.create({ name: 'Kanban' })

    const creation = projectsRepository.create({ name: 'kanban' })

    await expect(creation).rejects.toBeInstanceOf(ProjectNameAlreadyExistsError)
  })

  it('renames a project changing only its capitalization', async () => {
    const { project: created } = await projectsRepository.create({ name: 'kanban' })

    const { project } = await projectsRepository.rename({ projectId: created.id, name: 'Kanban' })

    expect(project?.name).toBe('Kanban')
  })

  it('rejects renaming to the name of another project', async () => {
    await projectsRepository.create({ name: 'kanban' })
    const { project: site } = await projectsRepository.create({ name: 'site' })

    const rename = projectsRepository.rename({ projectId: site.id, name: 'KANBAN' })

    await expect(rename).rejects.toBeInstanceOf(ProjectNameAlreadyExistsError)
  })

  it('returns null when renaming or removing a project that does not exist', async () => {
    const projectId = crypto.randomUUID()

    const { project: renamed } = await projectsRepository.rename({ projectId, name: 'x' })
    const { project: removed } = await projectsRepository.remove({ projectId })

    expect(renamed).toBeNull()
    expect(removed).toBeNull()
  })

  it('removes a project together with its cards', async () => {
    const { project } = await projectsRepository.create({ name: 'site' })
    await testDatabase.insert(cards).values([
      { projectId: project.id, stage: 'backlog', position: 0, title: 'A' },
      { projectId: project.id, stage: 'apply', position: 0, title: 'B' },
    ])

    const { project: removed } = await projectsRepository.remove({ projectId: project.id })

    const remainingCards = await testDatabase.select().from(cards).where(eq(cards.projectId, project.id))
    expect(removed?.id).toBe(project.id)
    expect(remainingCards).toEqual([])
  })
})
