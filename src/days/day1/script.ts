import type { DayScript, JobScript } from '../types'
import { FAN_REPAIR, MIXER_REPAIR } from './repairs'

export const FAN_JOB: JobScript = {
  id: 'fan',
  customer: { name: 'Sharma Uncle', side: 'right' },
  repair: FAN_REPAIR,
  arrival: [
    { who: 'customer', text: 'Oh, you’ve opened up! Then the first job is mine.' },
    { who: 'customer', text: 'This fan. The motor runs, but the blades won’t turn.' },
    { who: 'customer', text: 'It’s old… but I can’t bring myself to throw it away.' },
    { who: 'player', text: 'Let’s take a look.' },
  ],
  rule: 'Rule #1: First see what’s working, and what isn’t.',
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
    {
      target: 'fanPulley',
      label: 'Fan pulley',
      prompt: 'Look at the fan pulley',
      observation: 'Fan pulley: not moving',
      ok: false,
      requires: 'fanSwitch',
      blocked: 'The fan is switched off, so nothing is moving yet. Switch it on first.',
    },
    { target: 'beltGap', label: 'Belt', prompt: 'Look between the pulleys', observation: 'Belt: snapped', ok: false },
  ],
  inspectPose: { pos: [0.12, 1.82, -1.82], target: [-0.05, 1.54, -0.84], fov: 36 },
  diagnosis: [
    { who: 'mama', text: 'The motor’s power isn’t reaching the blades. Something has to connect the two pulleys.' },
    { who: 'mama', text: 'No proper belt? No problem. Switch it off, then look at what’s on the bench.' },
  ],
  goal: 'Connect the motor pulley to the fan pulley.',
  needs: ['Flexible', 'Grippy', 'Makes a loop'],
  focus: ['flexibility', 'grip'],
  walkthrough: [
    {
      item: 'rubberBand',
      joint: 'drive',
      pick: 'Pick up the rubber band.',
      attach: ['Put it on the motor pulley.', 'Now loop it over the fan pulley.'],
    },
  ],
  solution: 'Loop the rubber band over both pulleys.',
  reward: { money: 120, reputation: 5 },
  thanks: [
    { who: 'customer', text: 'It’s spinning! Wait… you didn’t have the original belt?' },
    { who: 'player', text: 'No.' },
    { who: 'customer', text: 'Then what is that?' },
    { who: 'player', text: 'A rubber band.' },
    { who: 'customer', text: '…I see. Well. It works!' },
  ],
  test: { stageAt: [400, 1200, 2000], duration: 3000, hum: 95, pops: { jam: 0.45 } },
}

export const MIXER_JOB: JobScript = {
  id: 'mixer',
  customer: { name: 'Rukmini Aunty', side: 'right' },
  repair: MIXER_REPAIR,
  arrival: [
    { who: 'customer', text: 'Quick, please! If my chutney stops, my whole snack shop stops.' },
    { who: 'customer', text: 'Look, I press the button and nothing happens. Not even a hum.' },
    { who: 'player', text: 'Alright, let’s see.' },
  ],
  rule: 'Rule #1 again: see what’s working, and what isn’t.',
  inspect: [
    { target: 'motor', label: 'Motor terminals', prompt: 'Test the motor directly', observation: 'Motor: runs when powered directly', ok: true },
    { target: 'button', label: 'START button', prompt: 'Press the START button', observation: 'START button: goes in, but nothing happens', ok: false },
    {
      target: 'contact',
      label: 'Switch panel',
      prompt: 'Open the switch panel',
      observation: 'Inside: the plastic pusher has snapped, so the contacts never touch',
      ok: false,
    },
  ],
  inspectPose: { pos: [0.06, 1.62, -1.55], target: [-0.05, 1.4, -0.8], fov: 34 },
  diagnosis: [
    { who: 'mama', text: 'The button has to push the contacts together, and spring back when you let go.' },
    { who: 'mama', text: 'Rule #2: Switching it on is easy. It has to switch off too.' },
  ],
  goal: 'Make a new switch: something to press, something to push back.',
  needs: ['Firm to press', 'Springs back'],
  focus: ['rigidity', 'elasticity'],
  walkthrough: [
    { item: 'bottleCap', joint: 'pusher', pick: 'Pick up the bottle cap. It’s flat and firm.', attach: ['Fit it where the pusher broke.'] },
    { item: 'spring', joint: 'return', pick: 'Now the spring. It always pushes back.', attach: ['Put it behind the contact.'] },
  ],
  solution: 'Bottle cap where the pusher broke, spring behind the contact.',
  reward: { money: 150, reputation: 5 },
  thanks: [
    { who: 'customer', text: 'Press… it runs! Let go… it stops!' },
    { who: 'customer', text: 'It starts AND it stops! Double chutney from tomorrow, and yours is free.' },
  ],
  test: { stageAt: [1100, 2500], duration: 3300, hum: 165 },
}

export const DAY_ONE: DayScript = {
  day: 1,
  recommend: 'tutorial',
  jobs: [FAN_JOB, MIXER_JOB],
  evening: {
    visitor: 'rafiq',
    name: 'Rafiq Bhai',
    lines: [
      { who: 'visitor', text: 'Here, chai. You’ve earned it.' },
      { who: 'visitor', text: 'Two customers on your very first day!' },
      { who: 'player', text: 'And both went home happy.' },
      { who: 'visitor', text: 'On their own two feet?' },
      { who: 'player', text: 'On their own two feet.' },
      { who: 'visitor', text: 'Then Mama’s shop is alive again. Drink up. More will come tomorrow.' },
    ],
  },
  reportTitle: (failedTests) => (failedTests === 0 ? 'Local Engineering Department' : 'Jugaad Research Institute'),
  endLine: 'The shop has only just opened. Tomorrow, word gets around.',
}
