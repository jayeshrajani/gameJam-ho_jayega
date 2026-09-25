import type { CameraPose } from '../app/cameraPose'
import type { SoundName } from '../audio/AudioManager'
import type { ItemId, PropertyId, RepairDef } from '../repair/types'

export type Speaker = 'customer' | 'player' | 'mama' | 'visitor'

export interface Line {
  who: Speaker
  text: string
}

/** Inspection and repair steps must follow storyline/repair_logic.md (labels, power first, `requires`). */
export interface InspectStep {
  target: string
  /** Short name of the part, shown as a tag in 3D. */
  label: string
  /** Tutorial prompt, and the label of the inspect button. */
  prompt: string
  /** What the player learns, written into the diary. */
  observation: string
  ok: boolean
  /** Another target that must be checked first (e.g. switch it on before tuning). */
  requires?: string
  /** Said when the player tries this before its requirement. */
  blocked?: string
}

/** One placement in the tutorial walkthrough. */
export interface WalkStep {
  item: ItemId
  joint: string
  pick: string
  /** One line per slot of the joint, in order. */
  attach: readonly string[]
  /** After this step the tutorial asks for a test before moving on. */
  testAfter?: boolean
}

export interface JobScript {
  id: string
  customer: { name: string; side: 'left' | 'right'; isVendor?: boolean }
  repair: RepairDef
  /** The customer's lines before inspection. */
  arrival: readonly Line[]
  /** Mama's rule for this job (tutorial mode). */
  rule: string
  inspect: readonly InspectStep[]
  inspectPose: CameraPose
  /** Mama explains the problem (tutorial mode only). */
  diagnosis: readonly Line[]
  goal: string
  /** What the repair needs, listed in the diary in tutorial mode. */
  needs: readonly string[]
  /** After a partial result: the nudge towards a better repair. */
  refine?: { text: string; needs: readonly string[] }
  /** Properties shown on item cards. */
  focus: readonly PropertyId[]
  walkthrough: readonly WalkStep[]
  /** Revealed after repeated failures. */
  solution: string
  reward: { money: number; reputation: number }
  thanks: readonly Line[]
  test: { stageAt: readonly number[]; duration: number; hum?: number; start?: SoundName; pass?: SoundName }
}

export interface DayScript {
  day: number
  /** Which mode the choice card recommends. */
  recommend: 'tutorial' | 'self'
  /** Optional lines before the first customer. */
  morning?: readonly Line[]
  jobs: readonly JobScript[]
  evening: { visitor: 'rafiq' | 'sharma'; name: string; lines: readonly Line[] }
  reportTitle(failedTests: number): string
  endLine: string
}
