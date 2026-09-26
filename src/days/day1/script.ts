import type { DayScript, JobScript } from '../types'
import { GRAMOPHONE_REPAIR, SCALE_REPAIR } from './repairs'

const WIND_FIRST = 'The spring motor isn’t wound, so nothing is turning yet. Wind the handle first.'

export const GRAMOPHONE_JOB: JobScript = {
  id: 'gramophone',
  customer: { name: 'Sharma Uncle', side: 'right' },
  repair: GRAMOPHONE_REPAIR,
  arrival: [
    { who: 'customer', text: 'Oh, you’ve opened up! Then the first job is mine.' },
    { who: 'customer', text: 'This gramophone. The record turns, but not a note comes out.' },
    { who: 'customer', text: 'It’s old… but it was my wife’s. I can’t bring myself to throw it away.' },
    { who: 'player', text: 'Let’s take a look.' },
  ],
  rule: 'Rule #1: First see what’s working, and what isn’t.',
  inspect: [
    { target: 'crank', label: 'Winding handle', prompt: 'Wind the handle', observation: 'Spring motor: wound tight', ok: true },
    {
      target: 'turntable',
      label: 'Turntable',
      prompt: 'Watch the turntable',
      observation: 'Turntable: turning at a steady speed',
      ok: true,
      requires: 'crank',
      blocked: WIND_FIRST,
    },
    {
      target: 'horn',
      label: 'Horn',
      prompt: 'Listen at the horn',
      observation: 'Horn: not a sound, even with the record turning',
      ok: false,
      requires: 'crank',
      blocked: WIND_FIRST,
    },
    { target: 'needle', label: 'Needle', prompt: 'Look under the soundbox', observation: 'Needle: fallen out. The holder is empty', ok: false },
  ],
  inspectPose: { pos: [0.1, 1.88, -1.6], target: [-0.07, 1.45, -0.72], fov: 40 },
  diagnosis: [
    { who: 'mama', text: 'The music is in the grooves. The needle rides them and the horn makes it loud. No needle, no music.' },
    { who: 'mama', text: 'No proper needle? No problem. Stop the record, then look at what’s on the bench.' },
  ],
  goal: 'Give the gramophone a new needle.',
  needs: ['Thin', 'Hard', 'Sharp point'],
  focus: ['rigidity', 'flexibility'],
  walkthrough: [
    {
      item: 'safetyPin',
      joint: 'needle',
      pick: 'Pick up the safety pin. Thin, hard, with a sharp point.',
      attach: ['Fit it in the needle holder, point down.'],
    },
  ],
  solution: 'Fit the safety pin in the needle holder, point down.',
  reward: { money: 120, reputation: 5 },
  thanks: [
    { who: 'customer', text: 'It’s playing! Wait… you didn’t have a gramophone needle?' },
    { who: 'player', text: 'No.' },
    { who: 'customer', text: 'Then what is that?' },
    { who: 'player', text: 'A safety pin.' },
    { who: 'customer', text: '…I see. Well. It sings!' },
  ],
  test: { stageAt: [400, 1200, 2000], duration: 3200, pass: 'radio', pops: { scratch: 0.4 } },
}

export const SCALE_JOB: JobScript = {
  id: 'scale',
  customer: { name: 'Rukmini Aunty', side: 'right' },
  repair: SCALE_REPAIR,
  arrival: [
    { who: 'customer', text: 'Quick, please! If my scale is wrong, my whole snack shop stops.' },
    { who: 'customer', text: 'Look, the hook snapped, and the pointer just flops to the bottom. My customers think I’m cheating them!' },
    { who: 'player', text: 'Alright, let’s see.' },
  ],
  rule: 'Rule #1 again: see what’s working, and what isn’t.',
  inspect: [
    { target: 'dial', label: 'Dial', prompt: 'Read the dial', observation: 'Dial: markings clear, glass fine', ok: true },
    { target: 'hook', label: 'Hook', prompt: 'Look under the scale', observation: 'Hook: snapped clean off. Nothing to hang the pan from', ok: false },
    {
      target: 'spring',
      label: 'Case',
      prompt: 'Open the case',
      observation: 'Inside: the spring has snapped, so the pointer just drops to the bottom',
      ok: false,
    },
  ],
  inspectPose: { pos: [-0.07, 1.86, -1.62], target: [-0.06, 1.5, -0.72], fov: 42 },
  diagnosis: [
    { who: 'mama', text: 'The pan pulls the spring down, and the spring pulls the pointer back up. Both have to work.' },
    { who: 'mama', text: 'Rule #2: Showing the weight is easy. It has to come back to zero too.' },
  ],
  goal: 'Give the scale a new hook and a new spring.',
  needs: ['Hook: bends, and holds weight', 'Spring: pulls back'],
  focus: ['flexibility', 'elasticity'],
  walkthrough: [
    { item: 'wire', joint: 'hook', pick: 'Pick up the copper wire. It bends into a hook and holds.', attach: ['Bend it into a hook where the old one snapped.'] },
    { item: 'spring', joint: 'spring', pick: 'Now the spring. It always pulls back.', attach: ['Fit it inside the case.'] },
  ],
  solution: 'Copper wire bent into a hook where the old one snapped, and the spring inside the case.',
  reward: { money: 150, reputation: 5 },
  thanks: [
    { who: 'customer', text: 'Half a kilo… exactly! And back to zero!' },
    { who: 'customer', text: 'Honest weight again! Free jalebis from tomorrow, and yours are extra.' },
  ],
  test: { stageAt: [700, 1700, 2700], duration: 3600 },
}

export const DAY_ONE: DayScript = {
  day: 1,
  recommend: 'tutorial',
  jobs: [GRAMOPHONE_JOB, SCALE_JOB],
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
