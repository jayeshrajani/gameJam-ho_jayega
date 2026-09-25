import type { DayScript, JobScript } from '../types'
import { PUMP_REPAIR, RADIO_REPAIR } from './repairs'

export const RADIO_JOB: JobScript = {
  id: 'radio',
  customer: { name: 'Ayesha', side: 'right' },
  repair: RADIO_REPAIR,
  arrival: [
    { who: 'customer', text: 'Hello. This was my grandfather’s radio.' },
    { who: 'customer', text: 'It switches on, but it won’t catch a single station. Just static.' },
    { who: 'customer', text: 'Sharma Uncle said you’d find a way.' },
    { who: 'player', text: 'Let’s take a look.' },
  ],
  rule: 'Look first, then think.',
  inspect: [
    { target: 'power', label: 'ON/OFF knob', prompt: 'Switch it on', observation: 'Power: the dial lights up', ok: true },
    {
      target: 'tuning',
      label: 'TUNE knob',
      prompt: 'Turn the tuning knob',
      observation: 'Tuning: nothing but static on every station',
      ok: false,
      requires: 'power',
      blocked: 'The radio is off, so there’s nothing to tune. Switch it on first.',
    },
    { target: 'antennaMount', label: 'Antenna socket', prompt: 'Check the antenna', observation: 'Antenna: snapped off at the base', ok: false },
  ],
  inspectPose: { pos: [0.02, 1.64, -1.55], target: [-0.1, 1.42, -0.78], fov: 36 },
  diagnosis: [
    { who: 'mama', text: 'The signal is in the air. It takes an antenna to catch it.' },
    { who: 'mama', text: 'What will you make it from? Read the cards: what carries current, and what’s long?' },
  ],
  goal: 'Fit a new antenna.',
  needs: ['Conductive', 'Long'],
  focus: ['conductivity', 'rigidity'],
  walkthrough: [
    {
      item: 'steelWire',
      joint: 'antenna',
      pick: 'Pick up the steel wire. It conducts, and it’s long.',
      attach: ['Fit it into the antenna socket.'],
    },
  ],
  solution: 'Put the steel wire in the antenna socket.',
  reward: { money: 180, reputation: 8 },
  thanks: [
    { who: 'customer', text: 'That’s the station. Grandpa listened to it every evening.' },
    { who: 'customer', text: '…Can I just listen for a minute?' },
    { who: 'player', text: 'Take your time.' },
    { who: 'customer', text: 'Thank you.' },
  ],
  test: { stageAt: [500, 2100], duration: 3600, start: 'static', pass: 'radio' },
}

export const PUMP_JOB: JobScript = {
  id: 'pump',
  customer: { name: 'Rafiq Bhai', side: 'left', isVendor: true },
  repair: PUMP_REPAIR,
  arrival: [
    { who: 'customer', text: 'Brother! There’s no water coming!' },
    { who: 'customer', text: 'No pump, no chai. And no chai, the whole lane shuts down.' },
    { who: 'customer', text: 'Look at that joint. It’s dripping everywhere.' },
    { who: 'player', text: 'The chai isn’t stopping. Leave it with me.' },
  ],
  rule: 'See what’s working, and what isn’t.',
  inspect: [
    { target: 'motor', label: 'ON/OFF switch', prompt: 'Switch the pump on', observation: 'Motor: spinning', ok: true },
    {
      target: 'outlet',
      label: 'Outlet',
      prompt: 'Look at the outlet',
      observation: 'Outlet: barely a trickle',
      ok: false,
      requires: 'motor',
      blocked: 'Nothing flows while the pump is off. Switch it on first.',
    },
    {
      target: 'crack',
      label: 'Pipe joint',
      prompt: 'Check the pipe joint',
      observation: 'Joint: water sprays out of a crack',
      ok: false,
      requires: 'motor',
      blocked: 'Nothing flows while the pump is off. Switch it on first.',
    },
  ],
  inspectPose: { pos: [0.04, 1.74, -1.55], target: [-0.14, 1.5, -0.74], fov: 38 },
  diagnosis: [
    { who: 'mama', text: 'The pump is fine. The pressure is escaping through the crack.' },
    { who: 'mama', text: 'Close the crack first. Then make sure it holds.' },
  ],
  goal: 'Seal the crack.',
  needs: ['Seals'],
  refine: { text: 'It works, but it could be better. Clamp something over the wrap.', needs: ['Strong', 'Flexible'] },
  focus: ['seal', 'strength'],
  walkthrough: [
    { item: 'tape', joint: 'seal', pick: 'Pick up the cloth tape. It seals.', attach: ['Wrap it over the crack.'], testAfter: true },
    {
      item: 'wire',
      joint: 'clamp',
      pick: 'It drips under pressure. Pick up the copper wire.',
      attach: ['Wind it tight over the tape.'],
    },
  ],
  solution: 'Wrap tape over the crack, then wind copper wire over the tape.',
  reward: { money: 160, reputation: 6 },
  thanks: [
    { who: 'customer', text: 'Look at that! A clean jet, not a drop wasted.' },
    { who: 'customer', text: 'That’s… tape and wire?' },
    { who: 'player', text: 'And a little bit of brains.' },
    { who: 'customer', text: 'Mama used to say exactly that.' },
    { who: 'customer', text: 'From today, your chai is on me.' },
  ],
  test: { stageAt: [500, 1500, 2600], duration: 3400, hum: 120, start: 'water' },
}

export const DAY_TWO: DayScript = {
  day: 2,
  recommend: 'self',
  jobs: [RADIO_JOB, PUMP_JOB],
  evening: {
    visitor: 'sharma',
    name: 'Sharma Uncle',
    lines: [
      { who: 'visitor', text: 'The fan ran all night!' },
      { who: 'visitor', text: 'And the rubber band is still alive.' },
      { who: 'player', text: 'It’ll run tomorrow too.' },
      { who: 'visitor', text: 'Tomorrow is tomorrow. Tonight I slept well.' },
      { who: 'visitor', text: 'Oh, and the chalk on your pillar? That wasn’t me.' },
    ],
  },
  reportTitle: (failedTests) => (failedTests === 0 ? 'Signal Strong, Pressure Strong' : 'Tape and Wire Specialist'),
  endLine: 'Word is getting around. Day 3 arrives in the next build.',
}
