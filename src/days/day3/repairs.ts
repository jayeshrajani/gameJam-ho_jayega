import { ITEMS } from '../../repair/items'
import type { ItemDef, Placements, RepairDef, TestOutcome } from '../../repair/types'

const item = (id: Placements[string]): ItemDef | undefined => (id ? ITEMS[id] : undefined)

/** Mishra Ji's desert cooler: fan and pump work, but the pipe to the top tray has slipped off and split. */
export const COOLER_REPAIR: RepairDef = {
  id: 'cooler',
  machine: 'Desert cooler',
  items: ['innerTube', 'penRefill', 'woodenStick', 'rubberBand'],
  slots: [
    { id: 'gap', label: 'Pipe gap' },
    { id: 'tie', label: 'Around the joint', requires: 'pipe' },
  ],
  joints: [
    { id: 'pipe', label: 'Pipe', slots: ['gap'] },
    { id: 'tie', label: 'Tie', slots: ['tie'] },
  ],
  evaluate(p): TestOutcome {
    const pipe = item(p.pipe)
    const tie = item(p.tie)
    const fan = { label: 'Fan blows', ok: true }
    const up = (ok: boolean) => ({ label: 'Water reaches the top', ok })
    const holds = (ok: boolean) => ({ label: 'Stays on while running', ok })
    const back = (['pipe', 'tie'] as const).filter((j) => p[j])

    if (!pipe || !pipe.tags.includes('HOLLOW')) {
      return {
        pass: false,
        code: 'dry',
        title: 'STILL HOT!',
        message: pipe
          ? `The ${pipe.name.toLowerCase()} is solid. Water can’t travel through it, so it spills back into the tank.`
          : 'The pump pushes water up… and it spills straight out of the gap.',
        stages: [fan, up(false)],
        returnJoints: back,
        hint: 'Water needs a way up. Something hollow, that bends to fit the gap.',
      }
    }
    if (pipe.props.flexibility < 4) {
      return {
        pass: false,
        code: 'trickle',
        title: 'JUST A TRICKLE',
        message: `The ${pipe.name.toLowerCase()} is hollow, but far too thin and stiff to fit the pipe. Only a trickle gets up.`,
        stages: [fan, up(false)],
        returnJoints: back,
        hint: 'Hollow is right. It also has to be wide and bendy enough to fit over both pipe ends.',
      }
    }
    const tied = tie && (tie.tags.includes('LOOP') || tie.tags.includes('CORD')) && (tie.props.grip >= 3 || tie.props.strength >= 3)
    if (!tied) {
      return {
        pass: false,
        partial: true,
        code: 'pops',
        title: 'ALMOST!',
        message: tie
          ? `The ${tie.name.toLowerCase()} can’t hold the tube. The pressure pushes it off again. Splash.`
          : 'Water climbs to the top… then the pressure pushes the tube off the pipe. Splash.',
        stages: [fan, up(true), holds(false)],
        returnJoints: tie ? ['tie'] : [],
        hint: 'Tie the tube on tight. Something that loops round and grips.',
      }
    }
    return {
      pass: true,
      code: 'cool',
      title: 'IT WORKS!',
      message: 'Water climbs to the tray and trickles down the pads. The air coming out is properly cool.',
      stages: [fan, up(true), holds(true)],
      returnJoints: [],
    }
  },
}

/** Chhotu's bicycle: the pin that holds the pedal to the crank has sheared off. */
export const PEDAL_REPAIR: RepairDef = {
  id: 'pedal',
  machine: 'Bicycle',
  items: ['woodenStick', 'penRefill', 'bolt', 'spoon'],
  slots: [{ id: 'pinHole', label: 'Pin hole' }],
  joints: [{ id: 'pin', label: 'Pedal pin', slots: ['pinHole'] }],
  evaluate(p): TestOutcome {
    const pin = item(p.pin)
    const fits = (ok: boolean) => ({ label: 'Pedal fits', ok })
    const turns = (ok: boolean) => ({ label: 'Pedal turns', ok })
    const load = (ok: boolean) => ({ label: 'Under load', ok })
    const hint = 'It has to take Chhotu’s whole weight, push after push. The right shape isn’t enough: it must be really strong.'
    const name = pin?.name.toLowerCase() ?? 'part'

    if (!pin || !(pin.tags.includes('PIN') || (pin.tags.includes('RIGID') && pin.tags.includes('LONG')))) {
      return {
        pass: false,
        code: 'no-fit',
        title: 'DOESN’T FIT',
        message: pin ? `The ${name} won’t go through the pin hole. Wrong shape entirely.` : 'There’s nothing holding the pedal on.',
        stages: [fits(false)],
        returnJoints: pin ? ['pin'] : [],
        hint: 'First, something shaped like a pin: long, thin and straight.',
      }
    }
    if (pin.props.strength < 2) {
      return {
        pass: false,
        code: 'wobble',
        title: 'WOBBLE… CLUNK',
        message: `The ${name} slides in, but it bends as soon as the pedal turns. The pedal wobbles off.`,
        stages: [fits(true), turns(false)],
        returnJoints: ['pin'],
        hint,
      }
    }
    if (pin.props.strength < 5) {
      return {
        pass: false,
        code: 'snap',
        title: 'CRACK!',
        message: `The ${name} fits and turns nicely… until Chhotu stands on the pedal. Snap.`,
        stages: [fits(true), turns(true), load(false)],
        returnJoints: ['pin'],
        hint,
      }
    }
    return {
      pass: true,
      code: 'solid',
      title: 'IT WORKS!',
      message: 'The steel bolt holds the pedal firm, even with all his weight on it.',
      stages: [fits(true), turns(true), load(true)],
      returnJoints: [],
    }
  },
}
