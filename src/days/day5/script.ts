import type { DayScript, JobScript } from '../types'
import { LIGHTS_REPAIR, SPEAKER_REPAIR } from './repairs'

const AMP_OFF = 'The amplifier is off. Switch it on first.'

export const SPEAKER_JOB: JobScript = {
  id: 'speaker',
  customer: { name: 'Bunty', side: 'right' },
  repair: SPEAKER_REPAIR,
  arrival: [
    { who: 'customer', text: 'Namaste! Bunty Band, number one in Old Bhopal. The Khan wedding is in three days.' },
    { who: 'customer', text: 'My loudspeaker went quiet in the middle of practice. Not a squeak.' },
    { who: 'customer', text: 'Without sound, my band is just six men in red jackets walking slowly.' },
    { who: 'player', text: 'Let’s find where the sound stops.' },
  ],
  rule: 'Not every part is broken. Check everything, and trust what works.',
  inspect: [
    { target: 'power', label: 'ON/OFF switch', prompt: 'Switch the amplifier on', observation: 'Power: the red light comes on', ok: true },
    {
      target: 'volume',
      label: 'VOLUME knob',
      prompt: 'Turn the volume up',
      observation: 'Volume: turns smoothly, still silent',
      ok: true,
      requires: 'power',
      blocked: AMP_OFF,
    },
    {
      target: 'mic',
      label: 'Microphone',
      prompt: 'Tap the microphone',
      observation: 'Mic: the meter needle jumps. The mic is fine',
      ok: true,
      requires: 'power',
      blocked: AMP_OFF,
    },
    { target: 'speakerWire', label: 'Speaker wire', prompt: 'Follow the speaker wire', observation: 'Wire: snapped where it meets the horn', ok: false },
    {
      target: 'terminal',
      label: 'Terminal',
      prompt: 'Check the terminal',
      observation: 'Terminal: the screw is lost, nothing holds a wire on',
      ok: false,
      requires: 'speakerWire',
      blocked: 'Follow the speaker wire first, and see where it should connect.',
    },
    { target: 'cone', label: 'Horn cone', prompt: 'Look inside the horn', observation: 'Cone: torn. It would buzz even with sound', ok: false },
  ],
  inspectPose: { pos: [0.02, 1.62, -1.5], target: [-0.05, 1.38, -0.72], fov: 40 },
  diagnosis: [
    { who: 'mama', text: 'The amplifier works: light, volume, microphone. The sound just never reaches the horn.' },
    { who: 'mama', text: 'A snapped wire, a lost screw, a torn cone. Fix all three.' },
  ],
  goal: 'Get the band’s loudspeaker playing.',
  needs: ['Wire: carries current', 'Terminal: small metal pin', 'Patch: light and sticky'],
  focus: ['conductivity', 'strength', 'flexibility'],
  walkthrough: [
    { item: 'wire', joint: 'lead', pick: 'Pick up the copper wire. Copper carries a signal best.', attach: ['Join the speaker wire to the horn.'] },
    { item: 'bolt', joint: 'screw', pick: 'Pick up the steel bolt. It clamps the wire on the terminal.', attach: ['Fit it in the terminal.'] },
    { item: 'tape', joint: 'patch', pick: 'Pick up the cloth tape. It patches the cone, light and tight.', attach: ['Patch the torn cone.'] },
  ],
  solution: 'Copper wire to the horn, the steel bolt in the terminal, and tape over the torn cone.',
  reward: { money: 240, reputation: 10 },
  ratingLines: {
    1: { who: 'customer', text: 'It plays… a bit crackly. It’ll do for practice.' },
    2: { who: 'customer', text: 'Loud and clear! Well, mostly clear.' },
    3: { who: 'customer', text: 'Listen to that! They’ll hear it in Indore!' },
  },
  thanks: [
    { who: 'customer', text: 'Three days to the wedding, and Bunty Band is back!' },
    { who: 'customer', text: 'For you, bhai, we’ll play your favourite song at the procession.' },
    { who: 'player', text: 'Just don’t play it at my shutter at six in the morning.' },
  ],
  test: { stageAt: [600, 1500, 2400], duration: 3400, start: 'static', pass: 'radio' },
}

export const LIGHTS_JOB: JobScript = {
  id: 'lights',
  customer: { name: 'Ayesha', side: 'right' },
  repair: LIGHTS_REPAIR,
  arrival: [
    { who: 'customer', text: 'Hello again! My sister’s wedding is on Sunday.' },
    { who: 'customer', text: 'These lights were my mother’s. We put them up for every wedding and every Diwali.' },
    { who: 'customer', text: 'Now the whole string is dark. Rocky said buy new ones, two hundred rupees.' },
    { who: 'player', text: 'Then they’re worth more than two hundred. Let’s look.' },
  ],
  rule: 'In a string of lights, one bad bulb darkens them all. Find the one.',
  inspect: [
    { target: 'plug', label: 'Plug', prompt: 'Check the plug', observation: 'Plug: the socket is live. Power is there', ok: true },
    { target: 'bulbA', label: 'Bulb A', prompt: 'Check bulb A', observation: 'Bulb A: filament fine', ok: true },
    { target: 'bulbB', label: 'Bulb B', prompt: 'Check bulb B', observation: 'Bulb B: filament fine', ok: true },
    { target: 'bulbHolder', label: 'Bulb C', prompt: 'Check bulb C', observation: 'Bulb C: the holder contact is bent. It never touches', ok: false },
    { target: 'bulbD', label: 'Bulb D', prompt: 'Check bulb D', observation: 'Bulb D: filament fine', ok: true },
    {
      target: 'fray',
      label: 'Wire near plug',
      prompt: 'Look along the wire',
      observation: 'Wire: frayed through near the plug, bare copper showing',
      ok: false,
    },
  ],
  inspectPose: { pos: [0.0, 1.58, -1.45], target: [-0.05, 1.34, -0.72], fov: 40 },
  diagnosis: [
    { who: 'mama', text: 'The plug has power, and most bulbs are fine. So the fault is somewhere in between.' },
    { who: 'mama', text: 'Join the frayed wire, cover the joint so nobody gets a shock, and fix bulb C’s contact.' },
  ],
  goal: 'Light up the whole string, safely.',
  needs: ['Join: carries current', 'Cover: insulates (not metal!)', 'Contact: springy metal'],
  focus: ['conductivity', 'elasticity', 'flexibility'],
  walkthrough: [
    { item: 'wire', joint: 'splice', pick: 'Pick up the copper wire. It carries current best.', attach: ['Twist it across the frayed wire.'] },
    { item: 'tape', joint: 'insulate', pick: 'Pick up the cloth tape. It insulates the joint.', attach: ['Wrap the bare joint.'] },
    { item: 'hairClip', joint: 'contact', pick: 'Pick up the hair clip. Springy metal makes a perfect contact.', attach: ['Fit it in bulb C’s holder.'] },
  ],
  solution: 'Copper wire across the fray, tape over the bare joint, and the hair clip in bulb C’s holder.',
  reward: { money: 180, reputation: 10 },
  ratingLines: {
    1: { who: 'customer', text: 'They’re on! Please don’t flicker on Sunday…' },
    2: { who: 'customer', text: 'They’re glowing! Just like when I was little.' },
    3: { who: 'customer', text: 'Every single one! Mummy would have loved this.' },
  },
  thanks: [
    { who: 'customer', text: 'Sunday, you’re coming to the wedding. No excuses.' },
    { who: 'player', text: 'Ho jayega.' },
    { who: 'customer', text: '…You say that about everything, don’t you?' },
  ],
  test: { stageAt: [500, 1400, 2300], duration: 3300, pops: { bare: 0.45 } },
}

export const DAY_FIVE: DayScript = {
  day: 5,
  recommend: 'self',
  askMama: true,
  jobs: [SPEAKER_JOB, LIGHTS_JOB],
  evening: {
    visitor: 'rocky',
    name: 'Rocky',
    lines: [
      { who: 'visitor', text: 'So. The hair-clip electrician.' },
      { who: 'visitor', text: 'Ayesha could have bought new lights from me. Two hundred rupees. Instead she came to your junk shop.' },
      { who: 'player', text: 'They were her mother’s.' },
      { who: 'visitor', text: 'Mothers, grandfathers, forty-year-old sewing machines. You’re keeping this whole lane stuck in the past.' },
      { who: 'visitor', text: 'In the city nobody repairs anything. They replace. That’s called progress.' },
      { who: 'player', text: 'This isn’t the city.' },
      { who: 'visitor', text: 'Not yet. Enjoy your safety pins while they last, ustad.' },
    ],
  },
  reportTitle: (failedTests) => (failedTests === 0 ? 'Sharp Eyes' : 'Finds The Fault'),
  endLine: 'The wedding is in three days. The whole lane is getting ready.',
}
