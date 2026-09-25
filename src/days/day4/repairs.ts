import { evaluateGraded } from '../../repair/graded'
import type { RepairDef } from '../../repair/types'

const lower = (name: string) => name.toLowerCase()

/** Master Ji's treadle sewing machine: belt snapped, needle clamp screw lost, tension spring gone. */
export const SEWING_REPAIR: RepairDef = {
  id: 'sewing',
  machine: 'Sewing machine',
  items: ['innerTube', 'clothStrip', 'tape', 'rubberBand', 'bolt', 'safetyPin', 'spring', 'hairClip'],
  slots: [
    { id: 'treadleWheel', label: 'Treadle wheel' },
    { id: 'handWheel', label: 'Hand wheel' },
    { id: 'needleClamp', label: 'Needle clamp' },
    { id: 'tensionPost', label: 'Tension post' },
  ],
  joints: [
    { id: 'belt', label: 'Belt (treadle → wheel)', slots: ['treadleWheel', 'handWheel'] },
    { id: 'clamp', label: 'Needle clamp', slots: ['needleClamp'] },
    { id: 'tension', label: 'Thread tension', slots: ['tensionPost'] },
  ],
  evaluate: (p) =>
    evaluateGraded(
      p,
      [
        {
          joint: 'belt',
          stage: 'Hand wheel turns',
          code: 'no-drive',
          grades: { innerTube: 3, clothStrip: 2, tape: 1 },
          fail: (i) =>
            !i
              ? 'The treadle goes up and down, but nothing reaches the wheel.'
              : i.tags.includes('LOOP')
                ? `The ${lower(i.name)} is far too short to reach from the treadle to the wheel.`
                : i.props.flexibility < 4
                  ? `The ${lower(i.name)} can’t bend round the wheels.`
                  : `The ${lower(i.name)} just slips on the wheels.`,
          hint: 'The belt must be long, bendy and grippy to reach from the treadle to the wheel.',
        },
        {
          joint: 'clamp',
          stage: 'Needle steady',
          code: 'wobble',
          grades: { bolt: 3, safetyPin: 2, tape: 1 },
          fail: (i) =>
            i ? `The ${lower(i.name)} can’t hold the needle tight. It wobbles and snaps the thread.` : 'The needle still wobbles loose in its clamp.',
          hint: 'Something stiff and pin-shaped to clamp the needle tight. Tape will do, just about.',
        },
        {
          joint: 'tension',
          stage: 'Neat stitches',
          code: 'tangle',
          grades: { spring: 3, hairClip: 2, rubberBand: 1 },
          fail: (i) =>
            i ? `The ${lower(i.name)} has no spring in it. The thread still loops into a knot.` : 'Nothing presses on the thread, so it loops into a knot.',
          hint: 'Thread tension needs something springy pressing on it.',
        },
      ],
      {
        code: 'stitches',
        message: (r) =>
          r === 3
            ? 'Clack-clack-clack. Straight, tight stitches, and every part will outlast the wedding season.'
            : r === 2
              ? 'It stitches nicely. One or two parts won’t last forever, but they’ll last the season.'
              : 'It stitches… for now. Some of these parts won’t survive the week.',
      },
    ),
}

/** Sharma Uncle's fan, back again: the rubber band wore out, the neck is loose and the guard clip broke. */
export const FAN_AGAIN_REPAIR: RepairDef = {
  id: 'fanAgain',
  machine: 'Table fan',
  items: ['innerTube', 'clothStrip', 'rubberBand', 'bolt', 'woodenStick', 'penRefill', 'wire', 'safetyPin'],
  slots: [
    { id: 'motorPulley', label: 'Motor pulley' },
    { id: 'fanPulley', label: 'Fan pulley' },
    { id: 'neckJoint', label: 'Neck joint' },
    { id: 'guardClip', label: 'Guard clip' },
  ],
  joints: [
    { id: 'drive', label: 'Drive (motor → fan)', slots: ['motorPulley', 'fanPulley'] },
    { id: 'neck', label: 'Neck', slots: ['neckJoint'] },
    { id: 'guard', label: 'Guard clip', slots: ['guardClip'] },
  ],
  evaluate: (p) =>
    evaluateGraded(
      p,
      [
        {
          joint: 'drive',
          stage: 'Blades spin',
          code: 'no-drive',
          grades: { innerTube: 3, clothStrip: 2, rubberBand: 1 },
          fail: (i) =>
            !i
              ? 'The motor spins, but nothing connects it to the blades.'
              : i.props.flexibility < 4
                ? `The ${lower(i.name)} can’t bend round the pulleys.`
                : `The ${lower(i.name)} just slips round the pulleys.`,
          hint: 'The belt needs grip and bend. Tougher than a rubber band, if you want it to last.',
        },
        {
          joint: 'neck',
          stage: 'Head stays up',
          code: 'droop',
          grades: { bolt: 3, woodenStick: 1 },
          fail: (i) => (i ? `The ${lower(i.name)} can’t hold the head up. It flops forward again.` : 'The head still flops forward on its loose neck.'),
          hint: 'The neck holds the whole head up. Something stiff and strong through the joint.',
        },
        {
          joint: 'guard',
          stage: 'Guard quiet',
          code: 'rattle',
          grades: { wire: 3, safetyPin: 2 },
          fail: (i) => (i ? `The ${lower(i.name)} can’t hold the guard. It still rattles.` : 'The guard rattles like a tempo on a bad road.'),
          hint: 'Tie the guard back on with something that bends round it and holds.',
        },
      ],
      {
        code: 'breeze',
        message: (r) =>
          r === 3
            ? 'A steady, quiet breeze. Head up, guard tight, and a belt that will outlive the rubber band by years.'
            : r === 2
              ? 'A good breeze, head up, guard quiet. Not forever, but a good long while.'
              : 'It spins, the head stays up. But a rubber-band belt will wear out again soon.',
      },
    ),
}
