import type { HabitEntryPutInput } from '~~/shared/schemas/habits'

export interface PendingEntryMutation {
  id: string
  kind: 'PUT_HABIT_ENTRY'
  habitId: string
  date: string
  input: HabitEntryPutInput
  createdAt: string
  attempts: number
  lastError: string | null
}

const databaseName = 'dailyboost-sync'
const storeName = 'mutations'

export function entryMutationId(habitId: string, date: string): string {
  return `entry:${habitId}:${date}`
}

export function coalesceEntryMutations(mutations: PendingEntryMutation[]): PendingEntryMutation[] {
  const latest = new Map<string, PendingEntryMutation>()
  for (const mutation of mutations) latest.set(mutation.id, mutation)
  return [...latest.values()].sort((left, right) => left.createdAt.localeCompare(right.createdAt))
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase()
  return await new Promise<T>((resolve, reject) => {
    const tx = database.transaction(storeName, mode)
    const request = run(tx.objectStore(storeName))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => database.close()
    tx.onerror = () => {
      database.close()
      reject(tx.error)
    }
    tx.onabort = () => {
      database.close()
      reject(tx.error)
    }
  })
}

export async function putPendingEntry(habitId: string, date: string, input: HabitEntryPutInput): Promise<PendingEntryMutation> {
  const id = entryMutationId(habitId, date)
  const current = await getPendingEntry(id)
  const mutation: PendingEntryMutation = {
    id,
    kind: 'PUT_HABIT_ENTRY',
    habitId,
    date,
    input,
    createdAt: current?.createdAt ?? new Date().toISOString(),
    attempts: current?.attempts ?? 0,
    lastError: null
  }
  await transaction('readwrite', store => store.put(mutation))
  return mutation
}

export async function getPendingEntry(id: string): Promise<PendingEntryMutation | undefined> {
  return await transaction<PendingEntryMutation | undefined>('readonly', store => store.get(id))
}

export async function listPendingEntries(): Promise<PendingEntryMutation[]> {
  return coalesceEntryMutations(await transaction<PendingEntryMutation[]>('readonly', store => store.getAll()))
}

export async function removePendingEntry(id: string): Promise<void> {
  await transaction('readwrite', store => store.delete(id))
}

export async function recordPendingFailure(mutation: PendingEntryMutation, message: string): Promise<void> {
  await transaction('readwrite', store => store.put({ ...mutation, attempts: mutation.attempts + 1, lastError: message }))
}
