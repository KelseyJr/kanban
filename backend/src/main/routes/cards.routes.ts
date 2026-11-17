import { type AnyElysia, Elysia } from 'elysia'
import { CreateCardController } from '@/controllers/create-card/create-card.controller'
import { DeleteCardController } from '@/controllers/delete-card/delete-card.controller'
import { ListCardsController } from '@/controllers/list-cards/list-cards.controller'
import { MoveCardController } from '@/controllers/move-card/move-card.controller'
import { UpdateCardController } from '@/controllers/update-card/update-card.controller'
import { DrizzleCardsRepository } from '@/providers/drizzle/cards/cards.repository'
import type { Database } from '@/providers/drizzle/drizzle.client'
import { CreateCardUseCase } from '@/use-cases/create-card/create-card.use-case'
import { DeleteCardUseCase } from '@/use-cases/delete-card/delete-card.use-case'
import { ListCardsUseCase } from '@/use-cases/list-cards/list-cards.use-case'
import { MoveCardUseCase } from '@/use-cases/move-card/move-card.use-case'
import { UpdateCardUseCase } from '@/use-cases/update-card/update-card.use-case'
import { reply } from './reply'

type CreateCardsRoutesParams = {
  database: Database
}

type CardsControllers = {
  listCardsController: ListCardsController
  createCardController: CreateCardController
  updateCardController: UpdateCardController
  deleteCardController: DeleteCardController
  moveCardController: MoveCardController
}

function buildCardsControllers({ database }: CreateCardsRoutesParams): CardsControllers {
  const cardsRepository = new DrizzleCardsRepository({ database })

  return {
    listCardsController: new ListCardsController({ listCardsUseCase: new ListCardsUseCase({ cardsRepository }) }),
    createCardController: new CreateCardController({ createCardUseCase: new CreateCardUseCase({ cardsRepository }) }),
    updateCardController: new UpdateCardController({ updateCardUseCase: new UpdateCardUseCase({ cardsRepository }) }),
    deleteCardController: new DeleteCardController({ deleteCardUseCase: new DeleteCardUseCase({ cardsRepository }) }),
    moveCardController: new MoveCardController({ moveCardUseCase: new MoveCardUseCase({ cardsRepository }) }),
  }
}

export function createCardsRoutes({ database }: CreateCardsRoutesParams): AnyElysia {
  const controllers = buildCardsControllers({ database })

  return new Elysia({ prefix: '/projects/:projectId/cards' })
    .get('/', async ({ set, params }) => reply({ set, response: await controllers.listCardsController.handle({ params }) }))
    .post('/', async ({ set, params, body }) =>
      reply({ set, response: await controllers.createCardController.handle({ params, body }) }),
    )
    .patch('/:cardId', async ({ set, params, body }) =>
      reply({ set, response: await controllers.updateCardController.handle({ params, body }) }),
    )
    .delete('/:cardId', async ({ set, params }) => reply({ set, response: await controllers.deleteCardController.handle({ params }) }))
    .post('/:cardId/move', async ({ set, params, body }) =>
      reply({ set, response: await controllers.moveCardController.handle({ params, body }) }),
    )
}
