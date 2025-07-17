class RateLimiter {
  private queue: (() => Promise<any>)[] = []
  private processing = false
  private delay: number

  constructor(delayMs: number = 200) {
    this.delay = delayMs
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      if (!this.processing) {
        this.process()
      }
    })
  }

  private async process() {
    this.processing = true

    while (this.queue.length > 0) {
      const fn = this.queue.shift()
      if (fn) {
        await fn()
        // Solo esperar si hay más items en la cola
        if (this.queue.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, this.delay))
        }
      }
    }

    this.processing = false
  }
}

// Crear una instancia global para el build
export const buildRateLimiter = new RateLimiter(300) // 300ms entre requests
