import type { DayScript, JobScript } from '../types'
import { COOLER_REPAIR, PEDAL_REPAIR } from './repairs'

const OFF = 'The cooler is switched off, so nothing is moving yet. Switch it on first.'

export const COOLER_JOB: JobScript = {
  id: 'cooler',
  customer: { name: 'Mishra Ji', side: 'right' },
  repair: COOLER_REPAIR,
  arrival: [
    { who: 'customer', text: 'Hot air! My cooler is blowing hot air at me!' },
    { who: 'customer', text: 'The fan runs. The tank is full. I filled it myself. Twice.' },
    { who: 'customer', text: 'My wife says buy a new one. I said, first let’s see what the young man says.' },
    { who: 'player', text: 'Let’s follow the water.' },
  ],
  rule: 'Follow the chain: power, pump, pipe, pads. Find where it stops.',
  inspect: [
    { target: 'power', label: 'ON/OFF switch', prompt: 'Switch the cooler on', observation: 'Power: the fan starts', ok: true },
    {
      target: 'fan',
      label: 'Fan',
      prompt: 'Feel the air',
      observation: 'Fan: spinning, but the air is hot',
      ok: true,
      requires: 'power',
      blocked: OFF,
    },
    {
      target: 'pump',
      label: 'Pump',
      prompt: 'Listen to the pump',
      observation: 'Pump: humming in a full tank',
      ok: true,
      requires: 'power',
      blocked: OFF,
    },
    {
      target: 'gap',
      label: 'Pipe',
      prompt: 'Follow the pipe up',
      observation: 'Pipe: slipped off and split. Water spills back down',
      ok: false,
      requires: 'pump',
      blocked: 'Nothing is flowing yet. Check the pump first, then follow its pipe.',
    },
    { target: 'pads', label: 'Cooling pads', prompt: 'Touch the pads', observation: 'Pads: bone dry', ok: false },
  ],
  inspectPose: { pos: [0.05, 1.8, -1.62], target: [-0.06, 1.5, -0.7], fov: 40 },
  diagnosis: [
    { who: 'mama', text: 'The fan blows and the pump pumps. The water just never reaches the top.' },
    { who: 'mama', text: 'Bridge the gap with something water can travel through. Then make sure it stays on.' },
  ],
  goal: 'Get water up to the pads.',
  needs: ['Hollow', 'Flexible'],
  refine: { text: 'Water reaches the pads, but the tube pops off. Tie it on.', needs: ['Loops round', 'Grippy'] },
  focus: ['flexibility', 'grip'],
  walkthrough: [
    {
      item: 'innerTube',
      joint: 'pipe',
      pick: 'Pick up the inner tube. It’s hollow, and it bends.',
      attach: ['Fit it across the pipe gap.'],
      testAfter: true,
    },
    {
      item: 'rubberBand',
      joint: 'tie',
      pick: 'It pops off under pressure. Pick up the rubber band.',
      attach: ['Loop it tight round the joint.'],
    },
  ],
  solution: 'Fit the inner tube across the pipe gap, then loop the rubber band round the joint.',
  reward: { money: 200, reputation: 8 },
  thanks: [
    { who: 'customer', text: 'Ahh. Cool air. Finally.' },
    { who: 'customer', text: 'A cycle tube and a rubber band. My wife will never believe it.' },
    { who: 'player', text: 'Don’t tell her. Just let her sit in front of it.' },
    { who: 'customer', text: 'Ha! Wise boy. Just like your Mama.' },
  ],
  test: { stageAt: [500, 1500, 2600], duration: 3400, hum: 110, start: 'water', pops: { pops: 0.66 } },
}

export const PEDAL_JOB: JobScript = {
  id: 'pedal',
  customer: { name: 'Chhotu', side: 'left' },
  repair: PEDAL_REPAIR,
  arrival: [
    { who: 'customer', text: 'Bhaiya! My cycle’s pedal fell off. Right in the middle of the road!' },
    { who: 'customer', text: 'Tuition is at five. If I walk, I’ll be late, and Sir will make me stand outside.' },
    { who: 'player', text: 'Five o’clock? Ho jayega.' },
  ],
  rule: 'It has to work under load, not just on the bench.',
  inspect: [
    { target: 'crank', label: 'Crank', prompt: 'Turn the crank by hand', observation: 'Chain: the back wheel turns', ok: true },
    { target: 'pedal', label: 'Pedal', prompt: 'Pick up the pedal', observation: 'Pedal: fine, but nothing holds it on', ok: false },
    {
      target: 'pinHole',
      label: 'Pin hole',
      prompt: 'Look inside the pin hole',
      observation: 'Pin: snapped off inside the crank',
      ok: false,
      requires: 'pedal',
      blocked: 'The pedal is still hanging over the hole. Pick up the pedal first.',
    },
  ],
  inspectPose: { pos: [0.04, 1.66, -1.58], target: [-0.04, 1.42, -0.72], fov: 40 },
  diagnosis: [
    { who: 'mama', text: 'The old pin snapped. Anything that fits the hole will turn the pedal.' },
    { who: 'mama', text: 'But a pedal carries a whole person, push after push. Fitting isn’t enough.' },
  ],
  goal: 'Fix the pedal back on.',
  needs: ['Pin-shaped', 'Very strong'],
  focus: ['strength', 'rigidity'],
  walkthrough: [
    {
      item: 'bolt',
      joint: 'pin',
      pick: 'Pick up the steel bolt. It fits, and it’s strong.',
      attach: ['Push it through the pedal into the pin hole.'],
    },
  ],
  solution: 'Put the steel bolt in the pin hole.',
  reward: { money: 60, reputation: 7 },
  thanks: [
    { who: 'customer', text: 'It’s solid! Look, I can stand on it!' },
    { who: 'customer', text: 'Bhaiya… can I tell you something?' },
    { who: 'customer', text: 'The chalk on your pillar. That was me.' },
    { who: 'player', text: 'You? Why?' },
    { who: 'customer', text: 'You fixed Sharma Uncle’s fan with a rubber band. That’s the coolest thing I’ve ever seen.' },
    { who: 'player', text: '…Then it stays. Now go, it’s nearly five.' },
  ],
  test: { stageAt: [500, 1500, 2600], duration: 3400, pops: { snap: 0.76, wobble: 0.5 } },
}

export const DAY_THREE: DayScript = {
  day: 3,
  recommend: 'self',
  jobs: [COOLER_JOB, PEDAL_JOB],
  evening: {
    visitor: 'ayesha',
    name: 'Ayesha',
    lines: [
      { who: 'visitor', text: 'I brought you something. Grandpa’s favourite sweets.' },
      { who: 'visitor', text: 'The radio plays every evening now. The whole building sits on the stairs to listen.' },
      { who: 'player', text: 'Then the antenna’s doing its job.' },
      { who: 'visitor', text: 'People keep asking where I got it fixed. I tell them, take it to Ho Jayega.' },
      { who: 'visitor', text: 'They ask, “Will it really get fixed?” And I say: ho jayega.' },
    ],
  },
  reportTitle: (failedTests) => (failedTests === 0 ? 'Cool Head, Strong Pin' : 'Tested Under Load'),
  endLine: 'Whatever breaks tomorrow, the lane knows where to bring it.',
  finale: {
    title: 'HO JAYEGA',
    lines: [
      'Three days. Six repairs. Not one proper part.',
      'A fan on a rubber band. A radio on a clothes hanger. A cooler on a cycle tube.',
      'The lane knows now: whatever breaks, bring it here.',
    ],
    footer: 'Thanks for playing. More days are on the way.',
  },
}
