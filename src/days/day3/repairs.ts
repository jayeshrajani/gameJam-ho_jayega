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

const pinShaped = (i: ItemDef) => i.tags.includes('PIN') || (i.tags.includes('RIGID') && i.tags.includes('LONG'))

/**
 * Chhotu's bicycle fell hard: the pedal pin sheared, nothing locks the pedal on, and a chain link snapped.
 * Three joints compete for the same few strong parts, so the player has to put strength where the force is.
 */
export const PEDAL_REPAIR: RepairDef = {
  id: 'pedal',
  machine: 'Bicycle',
  items: ['bolt', 'steelWire', 'wire', 'woodenStick', 'penRefill', 'rubberBand'],
  slots: [
    { id: 'chainLink', label: 'Broken chain link' },
    { id: 'pinHole', label: 'Pin hole' },
    { id: 'pinEnd', label: 'End of the pin', requires: 'pin' },
  ],
  joints: [
    { id: 'link', label: 'Chain link', slots: ['chainLink'] },
    { id: 'pin', label: 'Pedal pin', slots: ['pinHole'] },
    { id: 'lock', label: 'Pin lock', slots: ['pinEnd'] },
  ],
  evaluate(p): TestOutcome {
    const pin = item(p.pin)
    const lock = item(p.lock)
    const link = item(p.link)
    const fits = (ok: boolean) => ({ label: 'Pedal fits', ok })
    const stays = (ok: boolean) => ({ label: 'Pedal stays on', ok })
    const chain = (ok: boolean) => ({ label: 'Chain drives the wheel', ok })
    const load = (ok: boolean) => ({ label: 'Under load', ok })
    const lower = (i: ItemDef) => i.name.toLowerCase()

    if (!pin || !pinShaped(pin)) {
      return {
        pass: false,
        code: 'no-fit',
        title: 'DOESN’T FIT',
        message: pin ? `The ${lower(pin)} won’t go through the pin hole. Wrong shape entirely.` : 'There’s nothing holding the pedal on.',
        stages: [fits(false)],
        returnJoints: (['pin', 'lock'] as const).filter((j) => p[j]),
        hint: 'First, something shaped like a pin: long, thin and straight.',
      }
    }
    if (pin.props.strength < 2) {
      return {
        pass: false,
        code: 'wobble',
        title: 'WOBBLE… CLUNK',
        message: `The ${lower(pin)} slides in, but it bends as soon as the pedal turns. The pedal wobbles off.`,
        stages: [fits(true), stays(false)],
        returnJoints: (['pin', 'lock'] as const).filter((j) => p[j]),
        hint: 'The pin has to be stiff and strong, or the pedal just bends it.',
      }
    }
    if (!lock || !lock.tags.includes('CORD')) {
      return {
        pass: false,
        code: 'slides',
        title: 'IT SLID OFF!',
        message: lock
          ? `The ${lower(lock)} can’t hold the pedal on. It creeps off the end of the pin.`
          : 'The pedal turns… and slides straight off the end of the pin. Nothing is holding it on.',
        stages: [fits(true), stays(false)],
        returnJoints: lock ? ['lock'] : [],
        hint: 'Lock the end of the pin. Wind something round it that won’t stretch.',
      }
    }
    if (!link || !(link.tags.includes('CORD') && link.tags.includes('METAL'))) {
      return {
        pass: false,
        code: 'chain-off',
        title: 'WHEEL WON’T TURN',
        message: link
          ? `The ${lower(link)} can’t join a chain link. The chain still hangs loose.`
          : 'The pedal turns, but the chain hangs loose. The back wheel doesn’t move.',
        stages: [fits(true), stays(true), chain(false)],
        returnJoints: link ? ['link'] : [],
        hint: 'Join the chain with thin metal wire: thread it through the link and twist it shut.',
      }
    }
    const weakPin = pin.props.strength < 5
    const weakLink = link.props.strength < 4
    if (weakPin || weakLink) {
      return {
        pass: false,
        code: weakPin ? 'snap' : 'link-snap',
        title: 'CRACK!',
        message:
          weakPin && weakLink
            ? `Chhotu stands on the pedal: the ${lower(pin)} snaps and the ${lower(link)} link stretches apart.`
            : weakPin
              ? `Everything turns nicely… until Chhotu stands on the pedal. The ${lower(pin)} snaps.`
              : `The ${lower(link)} link stretches under his weight, then snaps. The chain drops off.`,
        stages: [fits(true), stays(true), chain(true), load(false)],
        returnJoints: [...(weakPin ? (['pin', 'lock'] as const) : []), ...(weakLink ? (['link'] as const) : [])],
        hint: 'The pedal and the chain take his whole weight. The lock doesn’t. Put your strongest parts where the force is.',
      }
    }
    return {
      pass: true,
      code: 'solid',
      title: 'IT WORKS!',
      message: 'The bolt holds the pedal, the wire locks it on, and the steel link carries the chain. Solid.',
      stages: [fits(true), stays(true), chain(true), load(true)],
      returnJoints: [],
    }
  },
}

