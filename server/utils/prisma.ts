import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const globalPrisma = globalThis as typeof globalThis & {
  dailyBoostPrisma?: PrismaClient
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is required to access DailyBoost persistence')
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString })
  })
}

export function usePrisma(): PrismaClient {
  globalPrisma.dailyBoostPrisma ??= createPrismaClient()
  return globalPrisma.dailyBoostPrisma
}

export async function disconnectPrisma(): Promise<void> {
  if (!globalPrisma.dailyBoostPrisma) {
    return
  }

  await globalPrisma.dailyBoostPrisma.$disconnect()
  delete globalPrisma.dailyBoostPrisma
}
