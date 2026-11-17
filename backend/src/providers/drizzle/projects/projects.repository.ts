import { eq, sql } from 'drizzle-orm'
import { ProjectNameAlreadyExistsError } from '@/domain/project/project.errors'
import type { Project } from '@/domain/project/project.entity'
import type {
  CreateProjectParams,
  CreateProjectResult,
  FindProjectByIdParams,
  FindProjectByIdResult,
  ListProjectsResult,
  ProjectsRepository,
  RemoveProjectParams,
  RemoveProjectResult,
  RenameProjectParams,
  RenameProjectResult,
} from '@/domain/project/projects.repository'
import type { Database } from '../drizzle.client'
import { isUniqueViolation } from '../postgres-errors'
import { projects } from '../schema'

type DrizzleProjectsRepositoryDependencies = {
  database: Database
}

type SaveWithUniqueNameParams = {
  name: string
  write: () => Promise<Project[]>
}

type SaveWithUniqueNameResult = {
  project: Project | null
}

export class DrizzleProjectsRepository implements ProjectsRepository {
  private readonly database: Database

  constructor({ database }: DrizzleProjectsRepositoryDependencies) {
    this.database = database
  }

  async list(): Promise<ListProjectsResult> {
    const rows = await this.database.select().from(projects).orderBy(sql`lower(${projects.name})`)

    return { projects: rows }
  }

  async findById({ projectId }: FindProjectByIdParams): Promise<FindProjectByIdResult> {
    const [project] = await this.database.select().from(projects).where(eq(projects.id, projectId))

    return { project: project ?? null }
  }

  async create({ name }: CreateProjectParams): Promise<CreateProjectResult> {
    const { project } = await this.saveWithUniqueName({
      name,
      write: () => this.database.insert(projects).values({ name }).returning(),
    })
    if (!project) throw new Error(`Project ${name} was not returned after the insert`)

    return { project }
  }

  async rename({ projectId, name }: RenameProjectParams): Promise<RenameProjectResult> {
    return this.saveWithUniqueName({
      name,
      write: () => this.database.update(projects).set({ name }).where(eq(projects.id, projectId)).returning(),
    })
  }

  async remove({ projectId }: RemoveProjectParams): Promise<RemoveProjectResult> {
    const [project] = await this.database.delete(projects).where(eq(projects.id, projectId)).returning()

    return { project: project ?? null }
  }

  private async saveWithUniqueName({ name, write }: SaveWithUniqueNameParams): Promise<SaveWithUniqueNameResult> {
    try {
      const [project] = await write()

      return { project: project ?? null }
    } catch (error: unknown) {
      if (isUniqueViolation({ error })) throw new ProjectNameAlreadyExistsError({ name, cause: error })
      throw error
    }
  }
}
