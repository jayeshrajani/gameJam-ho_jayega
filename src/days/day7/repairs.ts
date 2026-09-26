import { evaluateGraded } from '../../repair/graded'
import type { ItemDef, ItemId, RepairDef } from '../../repair/types'

const lower = (name: string) => name.toLowerCase()
const conducts = (i: ItemDef) => i.tags.includes('METAL') || i.props.conductivity >= 3

/** The tent generator: belt gone, fuel pipe cracked (petrol on a hot engine!), starter cord snapped. */
export const GENERATOR_REPAIR: RepairDef = {
  id: 'generator',
  machine: 'Generator',
  items: ['innerTube', 'nylonRope', 'penRefill', 'steelWire', 'clothStrip', 'rubberBand', 'chewingGum', 'hairClip'],
  slots: [
    { id: 'fuelCrack', label: 'Cracked fuel pipe' },
    { id: 'sleeveClamp', label: 'Round the sleeve', requires: 'fuel' },
    { id: 'pullCord', label: 'Starter handle' },
    { id: 'enginePulley', label: 'Engine pulley' },
    { id: 'dynamoPulley', label: 'Dynamo pulley' },
  ],
  joints: [
    { id: 'fuel', label: 'Fuel pipe sleeve', slots: ['fuelCrack'] },
    { id: 'clamp', label: 'Sleeve clamp', slots: ['sleeveClamp'] },
    { id: 'cord', label: 'Starter cord', slots: ['pullCord'] },
    { id: 'belt', label: 'Belt (engine → dynamo)', slots: ['enginePulley', 'dynamoPulley'] },
  ],
  evaluate: (p) =>
    evaluateGraded(
      p,
      [
        {
          joint: 'fuel',
          stage: 'No petrol dripping',
          code: 'leak',
          grades: { innerTube: 3, penRefill: 2 },
          fail: (i) =>
            !i
              ? 'Petrol drips from the crack straight onto the hot engine. Never start it like that!'
              : i.id === 'chewingGum'
                ? 'Petrol dissolves chewing gum in seconds. It drips onto the hot engine again.'
                : `The ${lower(i.name)} can’t seal a fuel pipe. Petrol still drips onto the hot engine.`,
          hint: 'Sleeve the crack with a tube that fits over the pipe and won’t melt in petrol.',
        },
        {
          joint: 'clamp',
          stage: 'Sleeve stays on',
          code: 'slide',
          grades: { steelWire: 3, hairClip: 2, rubberBand: 1 },
          fail: (i) =>
            i
              ? `The ${lower(i.name)} can’t squeeze the sleeve. It shakes loose as the engine runs.`
              : 'The engine shakes the sleeve straight off the pipe. It needs a clamp.',
          hint: 'A sleeve needs clamping. Twist something thin and strong round it.',
        },
        {
          joint: 'cord',
          stage: 'Engine starts',
          code: 'no-start',
          grades: { nylonRope: 3, clothStrip: 1 },
          fail: (i) =>
            !i
              ? 'No starter cord, so there’s nothing to pull. The engine never starts.'
              : i.tags.includes('LOOP')
                ? `The ${lower(i.name)} just stretches. The engine never spins fast enough to start.`
                : `The ${lower(i.name)} can’t take a hard yank. It snaps in your hand.`,
          hint: 'A starter cord takes a hard yank. Something long and strong that won’t stretch.',
        },
        {
          joint: 'belt',
          stage: 'Dynamo makes power',
          code: 'no-power',
          grades: { innerTube: 3, nylonRope: 2, clothStrip: 1 },
          fail: (i) =>
            !i
              ? 'The engine roars, but nothing turns the dynamo. Still no power.'
              : i.tags.includes('LOOP')
                ? `The ${lower(i.name)} snaps the moment the engine revs.`
                : i.props.flexibility < 3
                  ? `The ${lower(i.name)} can’t bend round the pulleys.`
                  : `The ${lower(i.name)} slips on the pulleys. The dynamo barely turns.`,
          hint: 'The belt carries the engine’s whole pull to the dynamo. Something grippy and strong.',
        },
      ],
      {
        code: 'power',
        message: (r) =>
          r === 3
            ? 'Brrrm-brrrm-BRRRRM! The generator roars and holds a steady hum. It will run all night, and the next wedding too.'
            : r === 2
              ? 'The generator runs steady. Good for tonight.'
              : 'It runs… mostly. Someone should keep an eye on it.',
      },
      'POWER!',
    ),
}

const TRAP: readonly ItemId[] = ['coin', 'steelWire', 'wire', 'hairClip', 'spoon', 'sodaCan']

/** The mains box on the pole: fuse blown, a loose terminal arcing, a cracked cover. The fuse is a safety trap. */
export const FUSE_REPAIR: RepairDef = {
  id: 'fuseBox',
  machine: 'Fuse box',
  items: ['coin', 'fuseStrand', 'steelWire', 'wire', 'spoon', 'hairClip', 'tape', 'sodaCan'],
  slots: [
    { id: 'fuseCarrier', label: 'Fuse carrier' },
    { id: 'terminal', label: 'Loose terminal screw' },
    { id: 'crack', label: 'Cracked cover' },
  ],
  joints: [
    { id: 'fuse', label: 'Fuse wire', slots: ['fuseCarrier'] },
    { id: 'screw', label: 'Screwdriver', slots: ['terminal'] },
    { id: 'cover', label: 'Cover patch', slots: ['crack'] },
  ],
  evaluate: (p) => {
    const outcome = evaluateGraded(
      p,
      [
        {
          joint: 'fuse',
          stage: 'Fuse protects the line',
          code: 'blown',
          grades: { fuseStrand: 3 },
          fail: (i) =>
            !i
              ? 'No fuse wire, so no power reaches the pandal.'
              : conducts(i)
                ? `The lights flicker on… then the stage cable starts to smoke! A ${lower(i.name)} never melts, so nothing protects the wiring. The cables burn instead. Ayesha pulls the main switch just in time.`
                : `The ${lower(i.name)} doesn’t carry current. Still dark.`,
          hint: 'A fuse must be the weakest link: thin enough to melt before the cables do. Never a coin or thick wire.',
        },
        {
          joint: 'screw',
          stage: 'Terminal tight',
          code: 'arc',
          grades: { spoon: 3, coin: 2, hairClip: 1 },
          fail: (i) =>
            i ? `The ${lower(i.name)} can’t turn the terminal screw. It still sparks.` : 'The loose terminal crackles and sparks.',
          hint: 'Tighten the screw. Anything with a thin, flat, stiff edge works as a screwdriver.',
        },
        {
          joint: 'cover',
          stage: 'Nothing live to touch',
          code: 'exposed',
          grades: { tape: 3 },
          fail: (i) =>
            !i
              ? 'Live metal still shows through the crack, and children are running everywhere.'
              : conducts(i)
                ? `Metal over live parts? Whoever touches the ${lower(i.name)} gets a shock!`
                : `The ${lower(i.name)} won’t stay over the crack.`,
          hint: 'Cover the crack with something that sticks and doesn’t conduct.',
        },
      ],
      {
        code: 'fused',
        message: (r) =>
          r === 3
            ? 'Click. The meter spins, the line is live, and if anything overloads, that thin strand melts first. Safe.'
            : 'The line is live and safe. The screw is snug enough for tonight.',
      },
      'SAFE AND LIVE!',
    )
    // The trap: something that conducts but never melts "works" for a moment, then the wiring burns.
    const fuse = p.fuse
    if (outcome.code === 'blown' && fuse && TRAP.includes(fuse)) return { ...outcome, code: 'burn', title: 'SMOKE! SWITCH IT OFF!' }
    return outcome
  },
}

/** The stage: Bunty's mic cable chewed through, and two bare wires touching on the light arch. */
export const STAGE_REPAIR: RepairDef = {
  id: 'stage',
  machine: 'Stage',
  items: ['wire', 'safetyPin', 'tape', 'innerTube', 'clothStrip', 'woodenStick', 'sodaCan', 'steelWire'],
  slots: [
    { id: 'micCut', label: 'Chewed mic cable' },
    { id: 'micJoint', label: 'Bare cable joint', requires: 'splice' },
    { id: 'archShort', label: 'Touching wires (arch)' },
  ],
  joints: [
    { id: 'splice', label: 'Mic cable join', slots: ['micCut'] },
    { id: 'wrap', label: 'Joint cover', slots: ['micJoint'] },
    { id: 'separate', label: 'Arch spacer', slots: ['archShort'] },
  ],
  evaluate: (p) =>
    evaluateGraded(
      p,
      [
        {
          joint: 'splice',
          stage: 'Mic works',
          code: 'silent',
          grades: { wire: 3, steelWire: 2, safetyPin: 1 },
          fail: (i) => (i ? `The ${lower(i.name)} carries no signal. The mic stays silent.` : 'The mic cable is still in two pieces.'),
          hint: 'Join the two ends with something that carries current.',
        },
        {
          joint: 'wrap',
          stage: 'Joint covered',
          code: 'bare',
          grades: { tape: 3, innerTube: 2, clothStrip: 1 },
          fail: (i) =>
            !i
              ? 'The joint is bare, and Bunty grabs cables with wet hands. Never leave a joint bare!'
              : conducts(i)
                ? `Metal over a live joint? That’s worse than bare. Bzzt!`
                : `The ${lower(i.name)} won’t stay on the joint.`,
          hint: 'Wrap the joint in something that doesn’t conduct.',
        },
        {
          joint: 'separate',
          stage: 'Arch lights on',
          code: 'short',
          grades: { innerTube: 3, tape: 3, woodenStick: 2, clothStrip: 1 },
          fail: (i) =>
            !i
              ? 'The two bare wires still touch. BANG, short circuit, and the whole arch goes dark.'
              : conducts(i)
                ? `Metal between the wires is still a short. BANG! The arch goes dark again.`
                : `The ${lower(i.name)} won’t stay between the wires.`,
          hint: 'Keep the two bare wires apart with something that doesn’t conduct.',
        },
      ],
      {
        code: 'showtime',
        message: (r) =>
          r === 3
            ? '“Check, check, one-two!” The mic booms, and every bulb on the arch blazes. Built to last the whole wedding season.'
            : r === 2
              ? 'The mic works and the arch is lit. Good for tonight.'
              : 'It works… don’t let Bunty swing that cable around.',
      },
      'SHOWTIME!',
    ),
}
