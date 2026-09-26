import type { ComponentType } from 'react'
import type { Vec3 } from '../../app/cameraPose'
import type { Outfit } from '../../world/Person'
import { RAFIQ } from '../../world/Person'
import { FAN_AGAIN_POINTS, FAN_POINTS, FanAgainMachine, MIXER_POINTS, MixerMachine, TableFanMachine } from '../day1/machines'
import { SEWING_POINTS, SewingMachine } from '../day4/machines'
import { LIGHTS_POINTS, LightsMachine, SPEAKER_POINTS, SpeakerMachine } from '../day5/machines'
import { CAR_AT, CAR_ENGINE_POINTS, CAR_SILENCER_POINTS, CAR_TYRE_POINTS, CarMachine } from '../day6/machines'
import { FUSE_POINTS, GENERATOR_POINTS, STAGE_POINTS, WEDDING_AT, WeddingMachine } from '../day7/machines'
import { PUMP_POINTS, PumpMachine, RADIO_POINTS, RadioMachine } from '../day2/machines'
import { BIKE_POINTS, BicycleMachine, COOLER_POINTS, CoolerMachine } from '../day3/machines'
import type { EveningVisitor } from '../types'
import { MACHINE_AT, TRAY_AT } from '../layout'
import type { DayGeometry } from './items'

interface MachineEntry {
  Machine: ComponentType<{ geo: DayGeometry }>
  /** Hotspot positions relative to the machine origin. */
  points: Readonly<Record<string, readonly [number, number, number]>>
  /** Where a hotspot's name tag sits relative to the hotspot, when the default (just above) would overlap. */
  tagOffsets?: Readonly<Record<string, Vec3>>
  customer: Outfit
  /** Outdoor machines: world origin, parts crate and where the customer stands (defaults: the counter). */
  at?: Vec3
  trayAt?: Vec3
  customerAt?: Vec3
  /** Shown all day (it arrived in the morning), and shared across jobs with the same key so it doesn't remount. */
  allDay?: string
}

const SHARMA: Outfit = {
  kind: 'shirt',
  skin: '#8a5a3c',
  hair: '#d6d1c8',
  top: '#d8c7a0',
  bottom: '#5f6266',
  moustache: true,
  glasses: true,
}

const RUKMINI: Outfit = {
  kind: 'saree',
  skin: '#a06a48',
  hair: '#1a1310',
  top: '#2f8f5b',
  bottom: '#d5a23b',
  accent: '#883D3B',
}

const AYESHA: Outfit = {
  kind: 'salwar',
  skin: '#b07a55',
  hair: '#15100d',
  top: '#5b6fb5',
  bottom: '#efe6d2',
  accent: '#f0c75e',
}

const MISHRA: Outfit = {
  kind: 'kurta',
  skin: '#9a6a4a',
  hair: '#cfcac2',
  top: '#f1ece0',
  bottom: '#f1ece0',
  accent: '#6b4a2f',
  moustache: true,
  glasses: true,
}

const CHHOTU: Outfit = { kind: 'kid', skin: '#8f5d3f', hair: '#120d0a', top: '#f4d35e', bottom: '#2d4a7a', accent: '#2f8f5b' }

const MASTER_JI: Outfit = {
  kind: 'kurta',
  skin: '#8a5a3c',
  hair: '#e6e1d8',
  top: '#3f5f8a',
  bottom: '#efe6d2',
  accent: '#d5a23b',
  glasses: true,
  moustache: true,
}

const BUNTY: Outfit = {
  kind: 'shirt',
  skin: '#9a6445',
  hair: '#1a1410',
  top: '#b3261e',
  bottom: '#f2efe6',
  accent: '#d5a23b',
  moustache: true,
}

const KHANNA: Outfit = {
  kind: 'shirt',
  skin: '#c08a62',
  hair: '#2a2320',
  top: '#f7f3ea',
  bottom: '#2f3440',
  moustache: true,
  glasses: true,
}

/** The three zones of the groom's car share one model, parked in the road all day. */
const CAR = { Machine: CarMachine, at: CAR_AT, allDay: 'car', customer: KHANNA, customerAt: [2.75, 0, 3.45] as Vec3 }

/** Day 7: the whole wedding pandal is one model; Ayesha waits by the pole. */
const WEDDING = { Machine: WeddingMachine, at: WEDDING_AT, allDay: 'wedding', customer: AYESHA, customerAt: [-2.05, 0, 3.75] as Vec3 }

export const EVENING_VISITORS: Readonly<Record<EveningVisitor, Outfit>> = {
  rafiq: { ...RAFIQ, holding: '#b07a45' },
  sharma: SHARMA,
  ayesha: { ...AYESHA, holding: '#e8b04a' },
  rocky: { kind: 'shirt', skin: '#a8744f', hair: '#1b1512', top: '#d63a7a', bottom: '#1f2a44', glasses: true },
  bunty: BUNTY,
  masterJi: MASTER_JI,
  khanna: KHANNA,
  mama: { kind: 'saree', skin: '#8a5a3c', hair: '#cfcac2', top: '#6b2f5a', bottom: '#d5a23b', accent: '#f2c14e', glasses: true, bag: '#5a3a2a' },
}

export const MACHINES: Readonly<Record<string, MachineEntry>> = {
  fan: { Machine: TableFanMachine, points: FAN_POINTS, customer: SHARMA },
  mixer: { Machine: MixerMachine, points: MIXER_POINTS, customer: RUKMINI },
  radio: {
    Machine: RadioMachine,
    points: RADIO_POINTS,
    // The two knobs sit side by side: one tag above-left, one below-right.
    tagOffsets: { tuning: [0.03, 0.062, 0], power: [-0.03, -0.062, 0] },
    customer: AYESHA,
  },
  pump: { Machine: PumpMachine, points: PUMP_POINTS, customer: RAFIQ },
  cooler: { Machine: CoolerMachine, points: COOLER_POINTS, tagOffsets: { pump: [0, -0.06, 0] }, customer: MISHRA },
  pedal: {
    Machine: BicycleMachine,
    points: BIKE_POINTS,
    tagOffsets: {
      crank: [-0.045, 0.065, 0],
      pinHole: [0.035, 0.065, 0],
      pinEnd: [0.035, -0.065, 0],
      chainLink: [-0.02, -0.055, 0],
    },
    customer: CHHOTU,
  },
  sewing: {
    Machine: SewingMachine,
    points: SEWING_POINTS,
    tagOffsets: { needle: [0.035, -0.06, 0], needleClamp: [0.035, -0.06, 0], bobbin: [-0.03, -0.055, 0] },
    customer: MASTER_JI,
  },
  fanAgain: {
    Machine: FanAgainMachine,
    points: FAN_AGAIN_POINTS,
    tagOffsets: { neck: [-0.06, 0.02, 0], neckJoint: [-0.06, 0.02, 0], beltGap: [0.05, 0.03, 0] },
    customer: SHARMA,
  },
  speaker: {
    Machine: SpeakerMachine,
    points: SPEAKER_POINTS,
    tagOffsets: {
      power: [0.03, 0.055, 0],
      volume: [0, -0.055, 0],
      speakerWire: [0.035, -0.05, 0],
      terminal: [-0.07, 0, 0],
    },
    customer: BUNTY,
  },
  lights: {
    Machine: LightsMachine,
    points: LIGHTS_POINTS,
    tagOffsets: { bulbB: [0, -0.055, 0], bulbD: [0, -0.055, 0], fray: [0.02, -0.055, 0], bareJoint: [0.02, -0.055, 0] },
    customer: AYESHA,
  },
  carEngine: {
    ...CAR,
    points: CAR_ENGINE_POINTS,
    trayAt: [-1.95, 0.35, 1.75],
    tagOffsets: {
      crankPulley: [0.06, -0.06, 0],
      altPulley: [-0.06, 0.06, 0],
      batteryTerminal: [-0.05, -0.06, 0],
      belt: [0.07, 0, 0],
    },
  },
  carSilencer: {
    ...CAR,
    points: CAR_SILENCER_POINTS,
    trayAt: [0.05, 0.22, 1.4],
    tagOffsets: { hole: [0, -0.07, 0], patchWrap: [0, -0.07, 0], heat: [0, 0.08, 0] },
  },
  carTyre: {
    ...CAR,
    points: CAR_TYRE_POINTS,
    trayAt: [-2.35, 0.35, 1.7],
    tagOffsets: { rim: [0, -0.07, 0], valve: [0.06, 0.05, 0], puncture: [0.03, -0.06, 0], slope: [-0.05, 0.05, 0] },
  },
  generator: {
    ...WEDDING,
    points: GENERATOR_POINTS,
    trayAt: [-2.05, 0.25, 2.45],
    tagOffsets: {
      enginePulley: [0.05, -0.06, 0],
      dynamoPulley: [-0.05, -0.06, 0],
      beltGuard: [0, -0.07, 0],
      fuelCrack: [0.07, 0.03, 0],
      sleeveClamp: [-0.07, 0.03, 0],
      oil: [0, -0.05, 0],
      plug: [0.03, 0.06, 0],
    },
  },
  fuseBox: {
    ...WEDDING,
    points: FUSE_POINTS,
    trayAt: [-0.4, 0.8, 2.6],
    tagOffsets: {
      mainSwitch: [-0.07, 0.03, 0],
      fuseCarrier: [0.07, 0.04, 0],
      terminal: [-0.08, 0, 0],
      cover: [0, -0.05, 0],
      crack: [0, -0.05, 0],
      load: [0, -0.05, 0],
    },
  },
  stage: {
    ...WEDDING,
    points: STAGE_POINTS,
    trayAt: [0.3, 0.3, 2.75],
    tagOffsets: { micCut: [0.02, 0.07, 0], micJoint: [-0.02, 0.07, 0], amp: [0.03, 0.06, 0] },
  },
}

const DEFAULT_TAG: Vec3 = [0, 0.062, 0]

export function tagOffset(jobId: string, target: string): Vec3 {
  return MACHINES[jobId]?.tagOffsets?.[target] ?? DEFAULT_TAG
}

export function machineOrigin(jobId: string): Vec3 {
  return MACHINES[jobId]?.at ?? MACHINE_AT
}

export function trayOrigin(jobId: string): Vec3 {
  return MACHINES[jobId]?.trayAt ?? TRAY_AT
}

export function machinePoint(jobId: string, target: string): Vec3 | undefined {
  const p = MACHINES[jobId]?.points[target]
  const o = machineOrigin(jobId)
  return p ? [o[0] + p[0], o[1] + p[1], o[2] + p[2]] : undefined
}
