import { ITEMS } from '../../repair/items'
import type { ItemDef, Placements, RepairDef, TestOutcome } from '../../repair/types'

const item = (id: Placements[string]): ItemDef | undefined => (id ? ITEMS[id] : undefined)

/** Ayesha's radio: powers on, tunes, but the antenna has snapped off at the base. */
export const RADIO_REPAIR: RepairDef = {
  id: 'radio',
  machine: 'Radio',
  items: ['steelWire', 'rubberBand', 'woodenStick'],
  slots: [{ id: 'antennaMount', label: 'Antenna socket' }],
  joints: [{ id: 'antenna', label: 'Antenna', slots: ['antennaMount'] }],
  evaluate(p): TestOutcome {
    const a = item(p.antenna)
    const power = { label: 'Power on', ok: true }
    const signal = (ok: boolean) => ({ label: 'Station tuned in', ok })
    const hint = 'An antenna has to carry current, and it has to reach out. Conductive and long.'
    if (a && a.props.conductivity >= 4 && a.tags.includes('LONG')) {
      return {
        pass: true,
        code: 'antenna',
        title: 'IT WORKS!',
        message: 'An old song comes clear through the static.',
        stages: [power, signal(true)],
        returnJoints: [],
      }
    }
    if (a && a.props.conductivity >= 4) {
      return {
        pass: false,
        code: 'too-short',
        title: 'JUST STATIC',
        message: `The ${a.name.toLowerCase()} conducts, but it’s far too short to catch a signal.`,
        stages: [power, signal(false)],
        returnJoints: ['antenna'],
        hint,
      }
    }
    const name = a?.name.toLowerCase() ?? 'part'
    return {
      pass: false,
      code: 'no-signal',
      title: 'JUST STATIC',
      message: a?.tags.includes('LONG')
        ? `The ${name} is long enough, but a signal can’t travel through it.`
        : `The ${name} neither carries a signal nor reaches out far.`,
      stages: [power, signal(false)],
      returnJoints: a ? ['antenna'] : [],
      hint,
    }
  },
}

/** Rafiq Bhai's water pump: the motor spins, but a cracked joint leaks all the pressure. */
export const PUMP_REPAIR: RepairDef = {
  id: 'pump',
  machine: 'Water pump',
  items: ['tape', 'spoon', 'wire'],
  slots: [
    { id: 'crack', label: 'Over the crack' },
    { id: 'clamp', label: 'Around the wrap', requires: 'seal' },
  ],
  joints: [
    { id: 'seal', label: 'Crack', slots: ['crack'] },
    { id: 'clamp', label: 'Clamp', slots: ['clamp'] },
  ],
  evaluate(p): TestOutcome {
    const seal = item(p.seal)
    const clamp = item(p.clamp)
    const motor = { label: 'Pump spins', ok: true }
    const sealed = (ok: boolean) => ({ label: 'Crack sealed', ok })
    const holds = (ok: boolean) => ({ label: 'Holds under pressure', ok })

    if (!seal || seal.props.seal < 3) {
      return {
        pass: false,
        code: 'leak',
        title: 'PSSSHHT!',
        message: seal
          ? `The ${seal.name.toLowerCase()} can’t close the crack. Water sprays out all round it.`
          : 'The crack is still open, so all the pressure goes straight out.',
        stages: [motor, sealed(false)],
        returnJoints: (['seal', 'clamp'] as const).filter((j) => p[j]),
        hint: 'First, something that closes the crack. Something that sticks and seals.',
      }
    }
    if (!clamp || !clamp.tags.includes('CORD') || clamp.props.strength < 3) {
      return {
        pass: false,
        partial: true,
        code: 'drip',
        title: 'ALMOST!',
        message: clamp
          ? `The ${clamp.name.toLowerCase()} can’t hold the tape down. It bulges under pressure: drip, drip.`
          : 'It works… but under pressure the tape bulges. Drip, drip, drip.',
        stages: [motor, sealed(true), holds(false)],
        returnJoints: clamp ? ['clamp'] : [],
        hint: 'Clamp something over the tape: strong, and flexible enough to wind round.',
      }
    }
    return {
      pass: true,
      code: 'sealed',
      title: 'IT WORKS!',
      message: 'The tape seals the crack and the wire clamps it tight. A clean jet of water!',
      stages: [motor, sealed(true), holds(true)],
      returnJoints: [],
    }
  },
}
