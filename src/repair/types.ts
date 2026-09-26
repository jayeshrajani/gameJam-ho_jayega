export type PropertyId = 'strength' | 'flexibility' | 'grip' | 'conductivity' | 'elasticity' | 'rigidity' | 'seal'

export type ItemTag = 'LOOP' | 'SPRING' | 'CORD' | 'METAL' | 'RIGID' | 'CAP' | 'LONG' | 'ADHESIVE' | 'HOLLOW' | 'PIN'

export type ItemId =
  | 'rubberBand'
  | 'spoon'
  | 'spring'
  | 'bottleCap'
  | 'wire'
  | 'steelWire'
  | 'woodenStick'
  | 'tape'
  | 'innerTube'
  | 'bolt'
  | 'penRefill'
  | 'clothStrip'
  | 'safetyPin'
  | 'hairClip'
  | 'nylonRope'
  | 'coin'
  | 'sodaCan'
  | 'brick'
  | 'chewingGum'
  | 'cyclePump'
  | 'fuseStrand'

export interface ItemDef {
  id: ItemId
  name: string
  /** One-line flavour shown on the item card. */
  blurb: string
  /** 0–5 per property. */
  props: Readonly<Record<PropertyId, number>>
  tags: readonly ItemTag[]
}

/** A place on a machine where something can be attached. */
export interface SlotDef {
  id: string
  label: string
  /** The slot only becomes usable once this joint holds something. */
  requires?: string
}

/** A connection the player can make. Two-slot joints link points (like a belt). */
export interface JointDef {
  id: string
  label: string
  slots: readonly [string] | readonly [string, string]
}

/** jointId → item placed in it. */
export type Placements = Readonly<Partial<Record<string, ItemId>>>

export interface TestStage {
  label: string
  ok: boolean
}

export interface TestOutcome {
  pass: boolean
  /** Works, but can be better: not a failure, and nothing is returned to the bench. */
  partial?: boolean
  /** Stable id for the case, used by animations and tests. */
  code: string
  title: string
  message: string
  stages: readonly TestStage[]
  /** Joints whose items pop back to the bench after the test. */
  returnJoints: readonly string[]
  /** Mama's nudge shown after a failure. */
  hint?: string
  /** Jugaad Rating of a passing fix, from 1 (works for today) to 3 (built to last). */
  rating?: Rating
  /** Extra line on the result card (e.g. a hint penalty). */
  note?: string
}

export type Rating = 1 | 2 | 3

export interface RepairDef {
  id: string
  machine: string
  items: readonly ItemId[]
  slots: readonly SlotDef[]
  joints: readonly JointDef[]
  evaluate(placements: Placements): TestOutcome
}
