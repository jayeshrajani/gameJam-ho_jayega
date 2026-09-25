import type { ItemId, JointDef, Placements, RepairDef } from './types'

export function jointForSlot(repair: RepairDef, slotId: string): JointDef | undefined {
  return repair.joints.find((j) => j.slots.includes(slotId))
}

export function jointOfItem(placements: Placements, itemId: ItemId): string | undefined {
  return Object.keys(placements).find((j) => placements[j] === itemId)
}

/** Puts an item in a joint. The item leaves any other joint; a displaced item returns to the bench. */
export function place(placements: Placements, jointId: string, itemId: ItemId): Placements {
  const next: Partial<Record<string, ItemId>> = {}
  for (const [j, item] of Object.entries(placements)) {
    if (item && item !== itemId && j !== jointId) next[j] = item
  }
  next[jointId] = itemId
  return next
}

export function removeJoint(placements: Placements, jointId: string): Placements {
  const next = { ...placements }
  delete next[jointId]
  return next
}

export function removeJoints(placements: Placements, jointIds: readonly string[]): Placements {
  return jointIds.reduce(removeJoint, placements)
}

export function slotAvailable(repair: RepairDef, placements: Placements, slotId: string): boolean {
  const slot = repair.slots.find((s) => s.id === slotId)
  return Boolean(slot && (!slot.requires || placements[slot.requires]))
}

export function canTest(placements: Placements): boolean {
  return Object.values(placements).some(Boolean)
}

export function itemsOnBench(repair: RepairDef, placements: Placements): ItemId[] {
  const used = new Set(Object.values(placements))
  return repair.items.filter((i) => !used.has(i))
}
