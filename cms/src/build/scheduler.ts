import { getBuildStatus, startBuild } from './manager'
import type { BuildStatus } from './manager'

export interface RebuildSchedulerOptions {
  debounceMs?: number
  startBuild: () => Promise<{ started: boolean; status: BuildStatus }>
  getBuildStatus: () => Promise<BuildStatus>
  wait?: (ms: number) => Promise<void>
}

export interface RebuildSchedulerState {
  pending: boolean
  scheduledAt?: number
}

const defaultWait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** 防抖 + 合并：连续变更只构建一次，构建期间的新变更会在结束后补一次。 */
export function createRebuildScheduler(options: RebuildSchedulerOptions) {
  const debounceMs = options.debounceMs ?? 4000
  const wait = options.wait ?? defaultWait
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending = false
  let scheduledAt: number | undefined
  let working = false

  const run = async () => {
    if (working) return
    working = true
    try {
      while (pending) {
        pending = false
        const result = await options.startBuild().catch(() => null)
        if (!result?.started) {
          if (result?.status?.status === 'error') break
          pending = true
          await wait(2000)
          continue
        }
        for (;;) {
          const status = await options.getBuildStatus().catch(() => null)
          if (!status || status.status !== 'building') break
          await wait(1500)
        }
      }
    } finally {
      working = false
    }
  }

  const schedule = () => {
    pending = true
    scheduledAt = Date.now()
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      void run()
    }, debounceMs)
  }

  const state = (): RebuildSchedulerState => ({ pending, scheduledAt })
  const reset = () => {
    pending = false
    scheduledAt = undefined
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  return { schedule, state, reset }
}

export const rebuildScheduler = createRebuildScheduler({ startBuild, getBuildStatus })

/** 数据变更后调用；测试和脚本可用 DISABLE_AUTO_REBUILD=1 关闭。 */
export function scheduleRebuild(): void {
  if (process.env.DISABLE_AUTO_REBUILD === '1' || process.env.NODE_ENV === 'test') return
  rebuildScheduler.schedule()
}

export function getRebuildSchedulerState(): RebuildSchedulerState {
  return rebuildScheduler.state()
}

export function resetPendingRebuild(): void {
  rebuildScheduler.reset()
}
