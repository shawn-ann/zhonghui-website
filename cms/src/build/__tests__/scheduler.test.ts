import { describe, expect, it, vi } from 'vitest'

vi.mock('../manager', () => ({
  startBuild: vi.fn(),
  getBuildStatus: vi.fn(),
}))

const { createRebuildScheduler } = await import('../scheduler')

const status = (value: string) => ({ status: value }) as any

describe('rebuild scheduler', () => {
  it('debounces a burst of changes into one build', async () => {
    const startBuild = vi.fn(async () => ({ started: true, status: status('building') }))
    const getBuildStatus = vi.fn(async () => status('success'))
    const scheduler = createRebuildScheduler({
      debounceMs: 5,
      startBuild,
      getBuildStatus,
      wait: async () => {},
    })

    scheduler.schedule()
    scheduler.schedule()
    scheduler.schedule()
    await new Promise((resolve) => setTimeout(resolve, 30))

    expect(startBuild).toHaveBeenCalledTimes(1)
  })

  it('runs one more build when changes arrive during a build', async () => {
    let polls = 0
    const startBuild = vi.fn(async () => ({ started: true, status: status('building') }))
    const getBuildStatus = vi.fn(async () => {
      polls += 1
      return status(polls < 3 ? 'building' : 'success')
    })
    const scheduler = createRebuildScheduler({
      debounceMs: 5,
      startBuild,
      getBuildStatus,
      wait: async () => {},
    })

    scheduler.schedule()
    await new Promise((resolve) => setTimeout(resolve, 10))
    scheduler.schedule()
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(startBuild).toHaveBeenCalledTimes(2)
  })
})
