import { ITEMS } from '../../repair/items'
import type { ItemDef, Placements, RepairDef, TestOutcome } from '../../repair/types'

const item = (id: Placements[string]): ItemDef | undefined => (id ? ITEMS[id] : undefined)

/** Sharma Uncle's wind-up gramophone: the record turns, but the needle has fallen out of the soundbox. */
export const GRAMOPHONE_REPAIR: RepairDef = {
  id: 'gramophone',
  machine: 'Gramophone',
  items: ['safetyPin', 'spoon'],
  slots: [{ id: 'needleHolder', label: 'Needle holder' }],
  joints: [{ id: 'needle', label: 'Needle', slots: ['needleHolder'] }],
  evaluate(p): TestOutcome {
    const needle = item(p.needle)
    const turns = { label: 'Record turns', ok: true }
    const groove = (ok: boolean) => ({ label: 'Needle follows the groove', ok })
    if (needle?.tags.includes('PIN')) {
      return {
        pass: true,
        code: 'music',
        title: 'IT PLAYS!',
        message: `The ${needle.name.toLowerCase()}’s sharp point rides the groove, and the old song pours out of the horn.`,
        stages: [turns, groove(true), { label: 'Music from the horn', ok: true }],
        returnJoints: [],
      }
    }
    if (needle && needle.props.rigidity >= 4) {
      return {
        pass: false,
        code: 'scratch',
        title: 'SCRRRATCH!',
        message: `The ${needle.name.toLowerCase()} is far too blunt to fit in the groove. It just skates across the record.`,
        stages: [turns, groove(false)],
        returnJoints: ['needle'],
        hint: 'The groove is thinner than a hair. You need something thin, hard and sharp.',
      }
    }
    return {
      pass: false,
      code: 'silent',
      title: 'NOT A SOUND',
      message: needle
        ? `The ${needle.name.toLowerCase()} is too soft. It bends, and the record slides past in silence.`
        : 'Nothing is in the needle holder, so nothing touches the record.',
      stages: [turns, groove(false)],
      returnJoints: needle ? ['needle'] : [],
      hint: 'Something thin, hard and sharp has to sit in the groove.',
    }
  },
}

const makesHook = (i: ItemDef) => i.tags.includes('CORD') && i.props.strength >= 3 && i.props.flexibility >= 3

/** Rukmini Aunty's hanging shop scale: the pan hook snapped off and the spring inside broke. */
export const SCALE_REPAIR: RepairDef = {
  id: 'scale',
  machine: 'Shop scale',
  items: ['spring', 'wire', 'bottleCap'],
  slots: [
    { id: 'hookEye', label: 'Where the hook snapped' },
    { id: 'springCase', label: 'Inside the case' },
  ],
  joints: [
    { id: 'hook', label: 'Hook', slots: ['hookEye'] },
    { id: 'spring', label: 'Spring', slots: ['springCase'] },
  ],
  evaluate(p): TestOutcome {
    const hook = item(p.hook)
    const spring = item(p.spring)
    const hangs = (ok: boolean) => ({ label: 'Pan hangs', ok })
    const weighs = (ok: boolean) => ({ label: 'Shows the weight', ok })
    const zero = (ok: boolean) => ({ label: 'Back to zero', ok })

    if (hook?.tags.includes('SPRING')) {
      return {
        pass: false,
        code: 'bounce',
        title: 'BOING BOING',
        message: 'The spring makes a bouncy hook. The pan yo-yos up and down, and the pointer never settles.',
        stages: [hangs(false)],
        returnJoints: ['hook'],
        hint: 'The hook should hold still. Something that bends into shape and stays there.',
      }
    }
    if (!hook || !makesHook(hook)) {
      return {
        pass: false,
        code: 'drop',
        title: 'CRASH!',
        message: hook
          ? `The ${hook.name.toLowerCase()} can’t bend into a hook. The pan drops onto the counter.`
          : 'Nothing to hang the pan from. It stays on the counter.',
        stages: [hangs(false)],
        returnJoints: hook ? ['hook'] : [],
        hint: 'Where the hook snapped, you need something that bends into a hook and holds weight.',
      }
    }
    if (!spring || spring.props.elasticity < 4) {
      return {
        pass: false,
        code: 'no-zero',
        title: 'STUCK AT THE BOTTOM',
        message: !spring
          ? 'Nothing pulls the pointer back up. It drops to the bottom and stays there.'
          : spring.tags.includes('CORD')
            ? `The ${spring.name.toLowerCase()} stretches once and stays stretched. The pointer never comes back to zero.`
            : `The ${spring.name.toLowerCase()} isn’t springy at all. The pointer drops to the bottom and stays there.`,
        stages: [hangs(true), weighs(false)],
        returnJoints: spring ? ['spring'] : [],
        hint: 'Inside the case, you need something that pulls back after it stretches.',
      }
    }
    return {
      pass: true,
      code: 'weigh',
      title: 'IT WORKS!',
      message: 'Half a kilo of jalebis: the pointer swings to 500 g. Lift them off, and it springs right back to zero.',
      stages: [hangs(true), weighs(true), zero(true)],
      returnJoints: [],
    }
  },
}
