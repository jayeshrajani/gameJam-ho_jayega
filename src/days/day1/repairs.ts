import { ITEMS } from '../../repair/items'
import type { ItemDef, Placements, RepairDef, TestOutcome } from '../../repair/types'

const item = (id: Placements[string]): ItemDef | undefined => (id ? ITEMS[id] : undefined)

/** Sharma Uncle's table fan: the drive belt between motor pulley and blade pulley has snapped. */
export const FAN_REPAIR: RepairDef = {
  id: 'fan',
  machine: 'Table fan',
  items: ['rubberBand', 'spoon'],
  slots: [
    { id: 'motorPulley', label: 'Motor pulley' },
    { id: 'fanPulley', label: 'Fan pulley' },
  ],
  joints: [{ id: 'drive', label: 'Drive (motor → fan)', slots: ['motorPulley', 'fanPulley'] }],
  evaluate(p): TestOutcome {
    const drive = item(p.drive)
    const motor = { label: 'Motor runs', ok: true }
    const reaches = (ok: boolean) => ({ label: 'Rotation reaches the fan pulley', ok })
    if (drive && drive.props.flexibility >= 3 && drive.props.grip >= 3 && drive.tags.includes('LOOP')) {
      return {
        pass: true,
        code: 'belt',
        title: 'IT WORKS!',
        message: 'The rubber band carries the motor’s turn all the way to the blades.',
        stages: [motor, reaches(true), { label: 'Blades spin', ok: true }],
        returnJoints: [],
      }
    }
    if (drive && drive.props.rigidity >= 4) {
      return {
        pass: false,
        code: 'jam',
        title: 'JAMMED!',
        message: `The ${drive.name.toLowerCase()} can’t bend round the pulleys, so it wedges and jams. No rotation gets through.`,
        stages: [motor, reaches(false)],
        returnJoints: ['drive'],
        hint: 'You need something flexible and grippy that can loop round both pulleys.',
      }
    }
    return {
      pass: false,
      code: 'slip',
      title: 'SLIPPING!',
      message: 'It’s connected, but it has no grip. The pulley turns and the belt just slides.',
      stages: [motor, reaches(false)],
      returnJoints: ['drive'],
      hint: 'Grip matters, and it has to make a loop.',
    }
  },
}

/** Rukmini Aunty's mixer: the plastic switch pusher snapped, so the contacts never meet. */
export const MIXER_REPAIR: RepairDef = {
  id: 'mixer',
  machine: 'Mixer',
  items: ['spring', 'bottleCap', 'wire'],
  slots: [
    { id: 'button', label: 'Where the pusher broke' },
    { id: 'contact', label: 'Behind the contact' },
  ],
  joints: [
    { id: 'pusher', label: 'Button', slots: ['button'] },
    { id: 'return', label: 'Contact', slots: ['contact'] },
  ],
  evaluate(p): TestOutcome {
    const pusher = item(p.pusher)
    const back = item(p.return)
    const press = (ok: boolean) => ({ label: 'Press: it runs', ok })
    const release = (ok: boolean) => ({ label: 'Release: it stops', ok })

    // A conductive cord across the contacts is a permanent short: it runs, but it never stops.
    const bridge = (['pusher', 'return'] as const).find((j) => {
      const it = item(p[j])
      return it && it.tags.includes('CORD') && it.props.conductivity >= 3
    })
    if (bridge) {
      return {
        pass: false,
        code: 'bridge',
        title: 'HOW DO YOU TURN IT OFF?',
        message: 'The wire joins the contacts for good. The mixer runs, and it never stops.',
        stages: [press(true), release(false)],
        returnJoints: [bridge],
        hint: 'Switching on is easy. It has to switch off too. No permanent shortcuts.',
      }
    }
    if (!pusher || pusher.props.rigidity < 3) {
      return {
        pass: false,
        code: pusher ? 'soft-push' : 'no-push',
        title: 'NOTHING TO PRESS',
        message: pusher
          ? `The ${pusher.name.toLowerCase()} just bends under your finger. The button needs something flat and firm.`
          : 'Nothing is where the pusher was, so pressing the button reaches nothing.',
        stages: [press(false)],
        returnJoints: pusher ? ['pusher'] : [],
        hint: 'Where the pusher broke, fit something flat and firm you can press.',
      }
    }
    if (!back || back.props.elasticity < 4) {
      return {
        pass: false,
        code: 'no-return',
        title: 'IT NEVER CAME BACK',
        message: 'Pressing works. But when you let go, the button stays down and the mixer keeps running.',
        stages: [press(true), release(false)],
        returnJoints: back ? ['return'] : [],
        hint: 'Behind the contact, you need something that pushes back after it’s pressed.',
      }
    }
    return {
      pass: true,
      code: 'switch',
      title: 'IT WORKS!',
      message: 'The cap pushes, the spring pushes back. A brand-new switch.',
      stages: [press(true), release(true)],
      returnJoints: [],
    }
  },
}
