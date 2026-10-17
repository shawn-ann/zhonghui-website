import { allowedChildTypes, isLayout } from './blocks'
import { findPath, getAtPath, blockChildren } from './state'
import type { Block } from './types'

/** Nearest section/grid container that would receive a drop on `targetId`. */
export function resolveDropContainer(blocks: Block[], targetId: string): string | null {
  const path = findPath(blocks, targetId)
  if (!path) return null
  const target = getAtPath(blocks, path)
  if (target && isLayout(target.type)) return target._id!
  if (path.length < 2) return null
  const parent = getAtPath(blocks, path.slice(0, -1))
  return parent && isLayout(parent.type) ? parent._id! : null
}

/**
 * Resolve where a dragged content block should land.
 * Only section/grid containers accept drops:
 * - dropping on a container appends to its children;
 * - dropping on a child inserts right after it in the same parent.
 */
export function resolveDropTarget(
  blocks: Block[],
  targetId: string,
  type: Block['type'],
): { parentId: string; index: number } | null {
  const path = findPath(blocks, targetId)
  if (!path) return null
  const target = getAtPath(blocks, path)
  if (!target) return null

  if (isLayout(target.type)) {
    if (!allowedChildTypes(target.type).includes(type)) return null
    return { parentId: target._id!, index: blockChildren(target).length }
  }

  if (path.length < 2) return null
  const parent = getAtPath(blocks, path.slice(0, -1))
  if (!parent || !isLayout(parent.type)) return null
  if (!allowedChildTypes(parent.type).includes(type)) return null
  return { parentId: parent._id!, index: path[path.length - 1] + 1 }
}
