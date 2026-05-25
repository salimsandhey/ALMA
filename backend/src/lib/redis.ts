import { Redis } from '@upstash/redis'

class InMemoryRedis {
  private store = new Map<string, { value: any; expiresAt?: number }>()

  private cleanExpired() {
    const now = Date.now()
    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.store.delete(key)
      }
    }
  }

  async get(key: string): Promise<string | null> {
    this.cleanExpired()
    const item = this.store.get(key)
    if (!item) return null
    return String(item.value)
  }

  async incr(key: string): Promise<number> {
    this.cleanExpired()
    const item = this.store.get(key)
    let currentVal = 0
    let expiresAt: number | undefined

    if (item) {
      currentVal = parseInt(item.value, 10) || 0
      expiresAt = item.expiresAt
    }

    const newVal = currentVal + 1
    this.store.set(key, { value: newVal, expiresAt })
    return newVal
  }

  async expire(key: string, seconds: number): Promise<void> {
    this.cleanExpired()
    const item = this.store.get(key)
    if (item) {
      item.expiresAt = Date.now() + seconds * 1000
      this.store.set(key, item)
    }
  }
}

const hasRedisConfig =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_URL.trim().length > 0 &&
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  process.env.UPSTASH_REDIS_REST_TOKEN.trim().length > 0

export const redis = hasRedisConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : (new InMemoryRedis() as any)
