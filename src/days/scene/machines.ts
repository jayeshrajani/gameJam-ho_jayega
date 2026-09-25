import type { ComponentType } from 'react'
import type { Vec3 } from '../../app/cameraPose'
import type { Outfit } from '../../world/Person'
import { RAFIQ } from '../../world/Person'
import { FAN_AGAIN_POINTS, FAN_POINTS, FanAgainMachine, MIXER_POINTS, MixerMachine, TableFanMachine } from '../day1/machines'
import { SEWING_POINTS, SewingMachine } from '../day4/machines'
import { PUMP_POINTS, PumpMachine, RADIO_POINTS, RadioMachine } from '../day2/machines'
import { BIKE_POINTS, BicycleMachine, COOLER_POINTS, CoolerMachine } from '../day3/machines'
import type { EveningVisitor } from '../types'
import type { DayGeometry } from './items'

interface MachineEntry {
  Machine: ComponentType<{ geo: DayGeometry }>
  /** Hotspot positions relative to the machine origin. */
  points: Readonly<Record<string, readonly [number, number, number]>>
  /** Where a hotspot's name tag sits relative to the hotspot, when the default (just above) would overlap. */
  tagOffsets?: Readonly<Record<string, Vec3>>
  customer: Outfit
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

export const EVENING_VISITORS: Readonly<Record<EveningVisitor, Outfit>> = {
  rafiq: { ...RAFIQ, holding: '#b07a45' },
  sharma: SHARMA,
  ayesha: { ...AYESHA, holding: '#e8b04a' },
  rocky: { kind: 'shirt', skin: '#a8744f', hair: '#1b1512', top: '#d63a7a', bottom: '#1f2a44', glasses: true },
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
}

const DEFAULT_TAG: Vec3 = [0, 0.062, 0]

export function tagOffset(jobId: string, target: string): Vec3 {
  return MACHINES[jobId]?.tagOffsets?.[target] ?? DEFAULT_TAG
}

export function machinePoint(jobId: string, target: string, origin: Vec3): Vec3 | undefined {
  const p = MACHINES[jobId]?.points[target]
  return p ? [origin[0] + p[0], origin[1] + p[1], origin[2] + p[2]] : undefined
}
