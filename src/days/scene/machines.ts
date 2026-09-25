import type { ComponentType } from 'react'
import type { Vec3 } from '../../app/cameraPose'
import type { Outfit } from '../../world/Person'
import { RAFIQ } from '../../world/Person'
import { FAN_POINTS, MIXER_POINTS, MixerMachine, TableFanMachine } from '../day1/machines'
import { PUMP_POINTS, PumpMachine, RADIO_POINTS, RadioMachine } from '../day2/machines'
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

export const EVENING_VISITORS: Readonly<Record<'rafiq' | 'sharma', Outfit>> = {
  rafiq: { ...RAFIQ, holding: '#b07a45' },
  sharma: SHARMA,
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
}

const DEFAULT_TAG: Vec3 = [0, 0.062, 0]

export function tagOffset(jobId: string, target: string): Vec3 {
  return MACHINES[jobId]?.tagOffsets?.[target] ?? DEFAULT_TAG
}

export function machinePoint(jobId: string, target: string, origin: Vec3): Vec3 | undefined {
  const p = MACHINES[jobId]?.points[target]
  return p ? [origin[0] + p[0], origin[1] + p[1], origin[2] + p[2]] : undefined
}
