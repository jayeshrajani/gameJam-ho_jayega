import type { CameraPose } from '../app/cameraPose'
import type { SoundName } from '../audio/AudioManager'
import type { ItemId, PropertyId, Rating, RepairDef } from '../repair/types'

export type Speaker = 'customer' | 'player' | 'mama' | 'visitor'

export interface Line {
  who: Speaker
  text: string
  /** Overrides the speaker's usual name (e.g. a second visitor in the morning). */
  name?: string
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
  /** Camera while building and testing; the counter bench camera if omitted. */
  buildPose?: CameraPose
  /** On zone days: the card the player picks this job from. */
  zone?: { label: string; blurb: string }
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
  /** Opening thanks line for each Jugaad Rating, on days where fixes are graded. */
  ratingLines?: Readonly<Record<Rating, Line>>
  test: {
    stageAt: readonly number[]
    duration: number
    hum?: number
    start?: SoundName
    pass?: SoundName
    /** Outcome code → fraction of the test at which something pops, snaps or jams. */
    pops?: Readonly<Record<string, number>>
  }
}

export type EveningVisitor = 'rafiq' | 'sharma' | 'ayesha' | 'rocky' | 'bunty' | 'masterJi' | 'khanna' | 'mama'

export interface DayScript {
  day: number
  /** Which mode the choice card recommends. */
  recommend: 'tutorial' | 'self'
  /** Optional lines before the first customer. */
  morning?: readonly Line[]
  jobs: readonly JobScript[]
  evening: { visitor: EveningVisitor; name: string; lines: readonly Line[] }
  reportTitle(failedTests: number): string
  endLine: string
  /** Shown after the report on the last day of this build. */
  finale?: { title: string; lines: readonly string[]; footer: string; sign?: { before: string; after: string } }
  /** Play-it-yourself players may ask Mama for the NEEDS list, for one star. */
  askMama?: boolean
  /**
   * Zone day: one customer, one big machine, several jobs the player picks in any order.
   * The customer stays put between jobs, and `pose` frames the whole machine while picking.
   */
  zones?: { prompt: string; pose: CameraPose; arriveSound?: SoundName; leaveSound?: SoundName }
  /** Neighbours standing around during the day's jobs. */
  companions?: readonly { visitor: EveningVisitor; at: readonly [number, number, number]; facing?: number }[]
  /** The whole day happens after dark. */
  night?: boolean
  /** Sounds played when the morning reaches a given line. */
  morningCues?: Readonly<Record<number, SoundName>>
  /**
   * A real-time clock across all jobs, running only while the player works (not during dialogue).
   * Each failed test costs `penaltyMs`; fixes finished after it runs out lose one star.
   */
  countdown?: { ms: number; label: string; penaltyMs: number; lateLabel: string; lateNote: string }
}
