import { evaluateGraded } from '../../repair/graded'
import type { ItemDef, RepairDef } from '../../repair/types'

const lower = (name: string) => name.toLowerCase()
const isMetal = (i: ItemDef) => i.tags.includes('METAL')

/** Under the bonnet: fan belt snapped, radiator hose split, battery terminal loose. */
export const CAR_ENGINE_REPAIR: RepairDef = {
  id: 'carEngine',
  machine: 'Car engine',
  items: ['nylonRope', 'innerTube', 'clothStrip', 'rubberBand', 'tape', 'coin', 'hairClip', 'woodenStick'],
  slots: [
    { id: 'crankPulley', label: 'Crank pulley' },
    { id: 'altPulley', label: 'Fan pulley' },
    { id: 'hoseSplit', label: 'Split hose' },
    { id: 'batteryTerminal', label: 'Battery terminal' },
  ],
  joints: [
    { id: 'belt', label: 'Fan belt', slots: ['crankPulley', 'altPulley'] },
    { id: 'hose', label: 'Hose patch', slots: ['hoseSplit'] },
    { id: 'terminal', label: 'Terminal shim', slots: ['batteryTerminal'] },
  ],
  evaluate: (p) =>
    evaluateGraded(
      p,
      [
        {
          joint: 'belt',
          stage: 'Engine turns the fan',
          code: 'no-fan',
          grades: { nylonRope: 3, innerTube: 2, clothStrip: 1 },
          fail: (i) =>
            !i
              ? 'The engine runs, but the radiator fan never turns. It overheats again.'
              : i.tags.includes('LOOP')
                ? `The ${lower(i.name)} snaps the moment the engine revs.`
                : i.props.flexibility < 4
                  ? `The ${lower(i.name)} can’t bend round the pulleys.`
                  : `The ${lower(i.name)} slips on the pulleys.`,
          hint: 'An engine belt takes real pull. Something long, strong and grippy.',
        },
        {
          joint: 'hose',
          stage: 'No more steam',
          code: 'steam',
          grades: { innerTube: 3, tape: 1 },
          fail: (i) => (i ? `The ${lower(i.name)} can’t seal a hot, pressurised hose. Pssssht!` : 'Hot water still sprays out of the split hose.'),
          hint: 'Sleeve the split with something rubbery that seals and grips.',
        },
        {
          joint: 'terminal',
          stage: 'Battery charging',
          code: 'no-charge',
          grades: { coin: 3, hairClip: 2 },
          fail: (i) =>
            i
              ? `The ${lower(i.name)} can’t wedge the clamp tight and carry current.`
              : 'The loose terminal sparks. The battery isn’t charging.',
          hint: 'Wedge the loose clamp with something small, solid and metal: it has to carry current.',
        },
      ],
      {
        code: 'engine',
        message: (r) =>
          r === 3
            ? 'The engine purrs, the fan spins, the needle sits in the middle. Good for the whole trip, and back.'
            : r === 2
              ? 'The engine runs cool. Not forever, but it will get the groom to the wedding.'
              : 'It runs… keep an eye on that temperature needle.',
      },
    ),
}

/** Underneath: the rear hanger snapped (silencer dragging) and a rusted hole makes it roar. Everything here gets hot. */
export const CAR_SILENCER_REPAIR: RepairDef = {
  id: 'carSilencer',
  machine: 'Silencer',
  items: ['steelWire', 'wire', 'sodaCan', 'tape', 'nylonRope', 'clothStrip', 'rubberBand', 'bolt'],
  slots: [
    { id: 'hanger', label: 'Rear hanger' },
    { id: 'hole', label: 'Rusted hole' },
    { id: 'patchWrap', label: 'Around the patch', requires: 'patch' },
  ],
  joints: [
    { id: 'hang', label: 'Hanger', slots: ['hanger'] },
    { id: 'patch', label: 'Hole patch', slots: ['hole'] },
    { id: 'wrap', label: 'Patch wire', slots: ['patchWrap'] },
  ],
  evaluate: (p) =>
    evaluateGraded(
      p,
      [
        {
          joint: 'hang',
          stage: 'Silencer off the road',
          code: 'drag',
          grades: { steelWire: 3, wire: 1 },
          fail: (i) =>
            !i
              ? 'The silencer still drags along the road, sparking.'
              : !isMetal(i)
                ? `The ${lower(i.name)} melts on the hot exhaust in seconds. The silencer drops again.`
                : `The ${lower(i.name)} can’t hang a silencer.`,
          hint: 'Exhausts get very hot. Hang it with metal wire you can loop and twist.',
        },
        {
          joint: 'patch',
          stage: 'No more roar',
          code: 'roar',
          grades: { sodaCan: 3 },
          fail: (i) =>
            !i
              ? 'It still roars like a tractor through the hole.'
              : !isMetal(i)
                ? `The ${lower(i.name)} scorches and burns off the hot silencer.`
                : `The ${lower(i.name)} can’t cover the hole.`,
          hint: 'Cover the hole with thin metal sheet: it has to survive the heat.',
        },
        {
          joint: 'wrap',
          stage: 'Patch stays put',
          code: 'patch-off',
          grades: { steelWire: 3, wire: 2 },
          fail: (i) =>
            !i
              ? 'The patch rattles loose within a minute.'
              : !isMetal(i)
                ? `The ${lower(i.name)} melts, and the patch falls off.`
                : `The ${lower(i.name)} can’t hold the patch on.`,
          hint: 'Wind wire round the patch to hold it. Metal only: it gets hot.',
        },
      ],
      {
        code: 'quiet',
        message: (r) =>
          r === 3
            ? 'A soft, even purr from the tailpipe, and the silencer hangs tight. Nothing will fall off on the way to the wedding.'
            : r === 2
              ? 'Quiet and off the road. It will hold for this trip.'
              : 'Quieter, and off the road… for now. Drive gently over potholes.',
      },
    ),
}

/** The front tyre: a nail. Block the wheel first, plug the hole, then pump it up. */
export const CAR_TYRE_REPAIR: RepairDef = {
  id: 'carTyre',
  machine: 'Tyre',
  items: ['brick', 'cyclePump', 'innerTube', 'chewingGum', 'tape', 'woodenStick', 'bottleCap', 'spoon'],
  slots: [
    { id: 'wheelChock', label: 'In front of the wheel' },
    { id: 'puncture', label: 'Puncture' },
    { id: 'valve', label: 'Valve', requires: 'plug' },
  ],
  joints: [
    { id: 'chock', label: 'Wheel chock', slots: ['wheelChock'] },
    { id: 'plug', label: 'Puncture plug', slots: ['puncture'] },
    { id: 'inflate', label: 'Air', slots: ['valve'] },
  ],
  evaluate: (p) =>
    evaluateGraded(
      p,
      [
        {
          joint: 'chock',
          stage: 'Car can’t roll',
          code: 'rolls',
          grades: { brick: 3, woodenStick: 1 },
          fail: (i) =>
            i
              ? `The ${lower(i.name)} can’t stop a car rolling towards the drain.`
              : 'Nothing stops the car rolling towards the drain while you work. Never skip the chock!',
          hint: 'Safety first: block the wheel with something heavy and solid before working on it.',
        },
        {
          joint: 'plug',
          stage: 'Puncture sealed',
          code: 'hiss',
          grades: { innerTube: 3, chewingGum: 1 },
          fail: (i) => (i ? `The ${lower(i.name)} can’t seal a puncture. Air hisses straight out.` : 'Air hisses out of the nail hole.'),
          hint: 'Plug the hole with something rubbery that seals under pressure.',
        },
        {
          joint: 'inflate',
          stage: 'Tyre pumped up',
          code: 'flat',
          grades: { cyclePump: 3 },
          fail: (i) => (i ? `The ${lower(i.name)} can’t push air into a tyre.` : 'The hole is plugged, but the tyre is still flat. It needs air.'),
          hint: 'The tyre needs air pushed in. What pushes air?',
        },
      ],
      {
        code: 'rolling',
        message: (r) =>
          r === 3
            ? 'The tyre stands firm and round. That tube plug will last until a proper puncture shop.'
            : r === 2
              ? 'The tyre holds air. Good enough for the trip.'
              : 'It holds air… for now. Chewing gum is not a long-term plan.',
      },
    ),
}
