import { evaluateGraded } from '../../repair/graded'
import type { RepairDef } from '../../repair/types'

const lower = (name: string) => name.toLowerCase()

/** Bunty's wedding-band loudspeaker: the amp is fine, but the wire, the terminal screw and the cone are not. */
export const SPEAKER_REPAIR: RepairDef = {
  id: 'speaker',
  machine: 'Loudspeaker',
  items: ['wire', 'steelWire', 'tape', 'clothStrip', 'bolt', 'safetyPin', 'hairClip', 'rubberBand'],
  slots: [
    { id: 'speakerWire', label: 'Speaker wire' },
    { id: 'terminal', label: 'Terminal', requires: 'lead' },
    { id: 'cone', label: 'Torn cone' },
  ],
  joints: [
    { id: 'lead', label: 'Speaker wire', slots: ['speakerWire'] },
    { id: 'screw', label: 'Terminal screw', slots: ['terminal'] },
    { id: 'patch', label: 'Cone patch', slots: ['cone'] },
  ],
  evaluate: (p) =>
    evaluateGraded(
      p,
      [
        {
          joint: 'lead',
          stage: 'Signal reaches the horn',
          code: 'silent',
          grades: { wire: 3, steelWire: 2, safetyPin: 1 },
          fail: (i) => (i ? `The ${lower(i.name)} doesn’t carry the signal. Not a sound.` : 'The speaker wire is still snapped. Not a sound.'),
          hint: 'Sound travels to the horn as electricity. The wire must carry current.',
        },
        {
          joint: 'screw',
          stage: 'Wire stays on',
          code: 'loose',
          grades: { bolt: 3, safetyPin: 2, hairClip: 2 },
          fail: (i) =>
            i ? `The ${lower(i.name)} can’t hold the wire on the terminal. It keeps dropping off.` : 'Nothing holds the wire on the terminal. It drops off.',
          hint: 'The terminal needs a small metal pin to clamp the wire.',
        },
        {
          joint: 'patch',
          stage: 'Clear sound',
          code: 'buzz',
          grades: { tape: 3, clothStrip: 1 },
          fail: (i) => (i ? `The ${lower(i.name)} can’t patch a paper cone. Bzzzzt!` : 'Sound comes through the tear as a horrible buzz.'),
          hint: 'A speaker cone is thin and light. Patch it with something light that sticks.',
        },
      ],
      {
        code: 'music',
        message: (r) =>
          r === 3
            ? 'Dhol, trumpet and all: loud, clear, and built to survive a whole wedding season.'
            : r === 2
              ? 'Loud and clear enough. One part won’t love a whole season of weddings.'
              : 'It plays, a bit crackly. It will get through a practice or two.',
      },
    ),
}

/** Ayesha's mother's wedding lights: a frayed lead, and one bad bulb contact that darkens the whole string. */
export const LIGHTS_REPAIR: RepairDef = {
  id: 'lights',
  machine: 'String lights',
  items: ['wire', 'steelWire', 'tape', 'innerTube', 'rubberBand', 'hairClip', 'safetyPin', 'woodenStick'],
  slots: [
    { id: 'fray', label: 'Frayed wire' },
    { id: 'bareJoint', label: 'Bare joint', requires: 'splice' },
    { id: 'bulbHolder', label: 'Bulb C holder' },
  ],
  joints: [
    { id: 'splice', label: 'Wire join', slots: ['fray'] },
    { id: 'insulate', label: 'Joint cover', slots: ['bareJoint'] },
    { id: 'contact', label: 'Bulb C contact', slots: ['bulbHolder'] },
  ],
  evaluate: (p) =>
    evaluateGraded(
      p,
      [
        {
          joint: 'splice',
          stage: 'Power reaches the string',
          code: 'dark',
          grades: { wire: 3, steelWire: 2 },
          fail: (i) =>
            i ? `The ${lower(i.name)} doesn’t carry current. The whole string stays dark.` : 'The frayed wire is still broken. No power gets through.',
          hint: 'Join the frayed wire with something that carries current.',
        },
        {
          joint: 'insulate',
          stage: 'Safe to touch',
          code: 'bare',
          grades: { tape: 3, innerTube: 2, rubberBand: 1 },
          fail: (i) =>
            !i
              ? 'The lights come on, but the bare joint sparks when touched. Never leave a joint bare!'
              : i.props.conductivity >= 3
                ? `The ${lower(i.name)} is metal. Wrapping a live joint in metal is worse than leaving it bare!`
                : `The ${lower(i.name)} won’t stay wrapped round the joint.`,
          hint: 'Cover the bare joint with something that doesn’t carry current, and wraps tight.',
        },
        {
          joint: 'contact',
          stage: 'Every bulb lights',
          code: 'one-out',
          grades: { hairClip: 3, safetyPin: 2, wire: 1 },
          fail: (i) =>
            i
              ? `The ${lower(i.name)} doesn’t make contact in the holder. One dark bulb keeps the whole string dark.`
              : 'Bulb C still isn’t touching. In a string like this, one dark bulb keeps every bulb dark.',
          hint: 'The bulb needs springy metal pressing it onto the contact.',
        },
      ],
      {
        code: 'glow',
        message: (r) =>
          r === 3
            ? 'Every bulb glows, the joint is safe to touch, and it will all be shining for years of weddings.'
            : r === 2
              ? 'Every bulb glows and it’s safe. Good for this wedding and a few more.'
              : 'Every bulb glows, for now. Check it again before Diwali.',
      },
    ),
}
