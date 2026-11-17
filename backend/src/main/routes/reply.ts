import type { Context } from 'elysia'
import type { HttpResponse } from '@/controllers/http-response'

type ReplyParams = {
  set: Context['set']
  response: HttpResponse
}

export function reply({ set, response }: ReplyParams): unknown {
  set.status = response.statusCode

  return response.body
}
