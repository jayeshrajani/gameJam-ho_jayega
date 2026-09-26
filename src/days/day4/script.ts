import type { DayScript, JobScript } from '../types'
import { FAN_AGAIN_REPAIR, SEWING_REPAIR } from './repairs'

export const SEWING_JOB: JobScript = {
  id: 'sewing',
  customer: { name: 'Master Ji', side: 'left' },
  repair: SEWING_REPAIR,
  arrival: [
    { who: 'customer', text: 'Beta, I have a wedding order. Twelve blouses by tomorrow morning.' },
    { who: 'customer', text: 'And my machine picks today to give up. The wheel won’t turn, the needle wobbles, the thread knots.' },
    { who: 'customer', text: 'That QuickFix boy across the lane said, “Buy a new electric one.” Forty years this machine has fed my family.' },
    { who: 'player', text: 'Then let’s make it forty-one.' },
  ],
  rule: 'A sewing machine needs three things: turn, a steady needle, and tight thread. Check all three.',
  inspect: [
    {
      target: 'treadle',
      label: 'Treadle (big wheel)',
      prompt: 'Press the treadle',
      observation: 'Treadle: the big wheel under the table spins freely',
      ok: true,
    },
    {
      target: 'wheel',
      label: 'Hand wheel',
      prompt: 'Watch the hand wheel',
      observation: 'Hand wheel: doesn’t move. The belt up from the big wheel has snapped',
      ok: false,
      requires: 'treadle',
      blocked: 'Press the treadle first, then watch what moves and what doesn’t.',
    },
    {
      target: 'needle',
      label: 'Needle',
      prompt: 'Wiggle the needle',
      observation: 'Needle: loose and crooked. The little screw that clamps it is missing',
      ok: false,
    },
    {
      target: 'thread',
      label: 'Tension discs',
      prompt: 'Pull the thread',
      observation: 'Thread: runs slack through the tension discs and knots under the cloth. Their spring is missing',
      ok: false,
      requires: 'needle',
      blocked: 'The thread runs down to the needle. Check the needle first.',
    },
    { target: 'bobbin', label: 'Bobbin', prompt: 'Check the bobbin', observation: 'Bobbin: full and turning smoothly. Not the problem', ok: true },
  ],
  inspectPose: { pos: [0.02, 1.7, -1.58], target: [-0.06, 1.46, -0.72], fov: 40 },
  diagnosis: [
    { who: 'mama', text: 'A sewing machine needs three things. The treadle’s turn must reach the hand wheel: that’s the belt.' },
    { who: 'mama', text: 'The needle must be clamped tight: that’s its screw. And the thread must run taut: that’s the tension spring.' },
    { who: 'mama', text: 'All three are broken. Many parts on this bench would do. Pick the ones that will last.' },
  ],
  goal: 'Get the machine sewing neat stitches again.',
  needs: ['Belt: long, bendy, grippy', 'Needle screw: small stiff pin', 'Tension: springy'],
  focus: ['strength', 'grip', 'elasticity'],
  walkthrough: [
    {
      item: 'innerTube',
      joint: 'belt',
      pick: 'Pick up the inner tube. Cut into a strip, it makes a tough, grippy belt.',
      attach: ['Loop it round the big wheel under the table.', 'Now up round the hand wheel.'],
    },
    { item: 'bolt', joint: 'clamp', pick: 'Pick up the steel bolt. It clamps the needle for good.', attach: ['Fit it in the needle screw hole.'] },
    { item: 'spring', joint: 'tension', pick: 'Pick up the spring. It squeezes the tension discs so the thread runs tight.', attach: ['Put it on the tension discs.'] },
  ],
  solution: 'Inner tube as the belt, the steel bolt in the needle screw hole, the spring on the tension discs. That’s the ★★★ fix.',
  reward: { money: 220, reputation: 9 },
  ratingLines: {
    1: { who: 'customer', text: 'It stitches… I’ll pray it lasts till the wedding.' },
    2: { who: 'customer', text: 'Good, good. This will see me through the season.' },
    3: { who: 'customer', text: 'Listen to that! It stitches like it’s 1985 again.' },
  },
  thanks: [
    { who: 'customer', text: 'Twelve blouses by morning. No problem now.' },
    { who: 'customer', text: 'Tell that QuickFix boy: some things are worth repairing.' },
    { who: 'player', text: 'I think he’ll hear it from the whole lane soon.' },
  ],
  test: { stageAt: [600, 1600, 2600], duration: 3600, hum: 70 },
}

export const FAN_AGAIN_JOB: JobScript = {
  id: 'fanAgain',
  customer: { name: 'Sharma Uncle', side: 'right' },
  repair: FAN_AGAIN_REPAIR,
  arrival: [
    { who: 'customer', text: 'Remember me? The gramophone hasn’t stopped singing since your safety pin.' },
    { who: 'customer', text: 'Now it’s my fan. The belt snapped, the head flops forward and the guard rattles like a tempo.' },
    { who: 'customer', text: 'Make it last, beta. I’m too old to come every week.' },
    { who: 'player', text: 'Then we do it properly.' },
  ],
  rule: 'A fix that works is good. A fix that lasts is better.',
  inspect: [
    { target: 'fanSwitch', label: 'ON/OFF switch', prompt: 'Switch the fan on', observation: 'Power: the motor hums', ok: true },
    {
      target: 'motorPulley',
      label: 'Motor pulley',
      prompt: 'Look at the motor pulley',
      observation: 'Motor pulley: spinning',
      ok: true,
      requires: 'fanSwitch',
      blocked: 'The fan is switched off, so nothing is moving yet. Switch it on first.',
    },
    { target: 'beltGap', label: 'Belt', prompt: 'Look between the pulleys', observation: 'Belt: old and cracked, and finally snapped', ok: false },
    { target: 'neck', label: 'Neck', prompt: 'Lift the fan head', observation: 'Neck: loose, the head flops forward', ok: false },
    {
      target: 'guard',
      label: 'Guard',
      prompt: 'Listen to the guard',
      observation: 'Guard: the clip broke, it rattles',
      ok: false,
      requires: 'fanSwitch',
      blocked: 'It only rattles while it runs. Switch it on first.',
    },
  ],
  inspectPose: { pos: [0.1, 1.92, -1.9], target: [-0.05, 1.62, -0.84], fov: 44 },
  diagnosis: [
    { who: 'mama', text: 'A rubber band would get it spinning today. But rubber bands wear out.' },
    { who: 'mama', text: 'Choose parts that will still be working when his grandchildren visit.' },
  ],
  goal: 'Make the fan last this time.',
  needs: ['Belt: grippy and tough', 'Neck: strong pin', 'Guard: wire to tie it'],
  focus: ['strength', 'grip', 'flexibility'],
  walkthrough: [
    {
      item: 'innerTube',
      joint: 'drive',
      pick: 'Pick up the inner tube. A tube-strip belt outlasts a rubber band by years.',
      attach: ['Put it on the motor pulley.', 'Now loop it over the fan pulley.'],
    },
    { item: 'bolt', joint: 'neck', pick: 'Pick up the steel bolt. It holds the head up for good.', attach: ['Push it through the neck joint.'] },
    { item: 'wire', joint: 'guard', pick: 'Pick up the copper wire. It ties the guard tight.', attach: ['Wind it round the guard clip.'] },
  ],
  solution: 'Inner tube on the pulleys, the steel bolt through the neck, copper wire on the guard clip. That’s the ★★★ fix.',
  reward: { money: 150, reputation: 8 },
  ratingLines: {
    1: { who: 'customer', text: 'Running again. So… see you next week, then?' },
    2: { who: 'customer', text: 'Much better. This should hold a good long while.' },
    3: { who: 'customer', text: 'Solid as a rock! Even the rattle is gone.' },
  },
  thanks: [
    { who: 'customer', text: 'You know, I told that QuickFix boy about you.' },
    { who: 'customer', text: 'He laughed. “Safety pins!” he said.' },
    { who: 'player', text: 'Let him laugh. Your fan is spinning.' },
  ],
  test: { stageAt: [500, 1400, 2300], duration: 3200, hum: 95 },
}

export const DAY_FOUR: DayScript = {
  day: 4,
  recommend: 'self',
  jobs: [SEWING_JOB, FAN_AGAIN_JOB],
  evening: {
    visitor: 'rocky',
    name: 'Rocky',
    lines: [
      { who: 'visitor', text: 'So you’re the famous safety-pin mechanic.' },
      { who: 'visitor', text: 'Rocky. QuickFix, across the lane. Phones, chargers, earphones. Replace, warranty, done.' },
      { who: 'player', text: 'And when there’s no part to replace?' },
      { who: 'visitor', text: 'Then they buy a new one. Simple.' },
      { who: 'visitor', text: '…Master Ji’s machine really runs? Hm. We’ll see how long.' },
    ],
  },
  reportTitle: (failedTests) => (failedTests === 0 ? 'Built To Last' : 'More Than One Way'),
  endLine: 'Rocky is watching. Tomorrow, show him what jugaad can really do.',
}
