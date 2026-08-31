import { ApplicationError } from '../domain/errors'

export function toHttpError(error: unknown): Error {
  if (error instanceof ApplicationError) {
    return createError({
      statusCode: error.statusCode,
      statusMessage: error.message
    })
  }

  if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
    return createError({
      statusCode: 409,
      statusMessage: 'Конфликт уникальности данных'
    })
  }

  console.error('Unhandled server error', error)
  return createError({ statusCode: 500, statusMessage: 'Внутренняя ошибка сервера' })
}
