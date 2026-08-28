import { disconnectPrisma } from '../utils/prisma'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('close', disconnectPrisma)
})
