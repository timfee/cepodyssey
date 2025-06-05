import { setupServer } from 'msw/node'
import { googleHandlers } from './handlers/google'
import { microsoftHandlers } from './handlers/microsoft'

export const server = setupServer(
  ...googleHandlers,
  ...microsoftHandlers
)
