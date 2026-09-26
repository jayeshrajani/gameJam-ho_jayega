import type { DayScript, JobScript } from '../types'
import { CAR_ENGINE_REPAIR, CAR_SILENCER_REPAIR, CAR_TYRE_REPAIR } from './repairs'

const CUSTOMER = { name: 'Mr. Khanna', side: 'right' as const }
const BONNET_SHUT = 'The bonnet is shut. Open it first.'

export const CAR_ENGINE_JOB: JobScript = {
  id: 'carEngine',
  customer: CUSTOMER,
  repair: CAR_ENGINE_REPAIR,
  zone: { label: 'Steam from the front', blurb: 'Something under the bonnet is hissing, and the needle is in the red.' },
  arrival: [
    { who: 'customer', text: 'It started steaming near the petrol pump. Then the temperature needle went red.' },
    { who: 'player', text: 'Let’s open the bonnet.' },
  ],
  rule: 'Open it up and check everything. Some parts are fine.',
  inspect: [
    { target: 'hood', label: 'Bonnet', prompt: 'Open the bonnet', observation: 'Bonnet: hot air and steam rush out', ok: true },
    { target: 'dipstick', label: 'Dipstick', prompt: 'Pull the dipstick', observation: 'Oil: full and clean', ok: true, requires: 'hood', blocked: BONNET_SHUT },
    { target: 'coolant', label: 'Coolant tank', prompt: 'Check the coolant tank', observation: 'Coolant tank: still has water', ok: true, requires: 'hood', blocked: BONNET_SHUT },
    { target: 'hoseSplit', label: 'Radiator hose', prompt: 'Find the steam', observation: 'Radiator hose: split, spraying steam', ok: false, requires: 'hood', blocked: BONNET_SHUT },
    { target: 'belt', label: 'Fan belt', prompt: 'Check the fan belt', observation: 'Fan belt: snapped. The fan never turns', ok: false, requires: 'hood', blocked: BONNET_SHUT },
    {
      target: 'batteryTerminal',
      label: 'Battery',
      prompt: 'Wiggle the battery terminal',
      observation: 'Battery: the terminal clamp is loose and sparks',
      ok: false,
      requires: 'hood',
      blocked: BONNET_SHUT,
    },
  ],
  inspectPose: { pos: [-1.4, 2.0, 1.35], target: [-1.35, 0.6, 2.75], fov: 44 },
  buildPose: { pos: [-0.65, 2.3, 0.7], target: [-1.05, 0.45, 2.45], fov: 54 },
  diagnosis: [
    { who: 'mama', text: 'No belt, so the fan never turns. A split hose, so the water boils out. No wonder it steamed.' },
    { who: 'mama', text: 'And a loose battery terminal. Three jobs under one bonnet.' },
  ],
  goal: 'Stop the engine overheating.',
  needs: ['Belt: long, strong, grippy', 'Hose: rubbery sleeve', 'Terminal: small solid metal'],
  focus: ['strength', 'grip', 'conductivity'],
  walkthrough: [
    {
      item: 'nylonRope',
      joint: 'belt',
      pick: 'Pick up the nylon rope. Charpai rope makes a strong emergency belt.',
      attach: ['Loop it round the crank pulley.', 'Now round the fan pulley.'],
    },
    { item: 'innerTube', joint: 'hose', pick: 'Pick up the inner tube. It sleeves the split hose tight.', attach: ['Slide it over the split.'] },
    { item: 'coin', joint: 'terminal', pick: 'Pick up the one-rupee coin. Solid metal, a perfect shim.', attach: ['Wedge it in the battery terminal.'] },
  ],
  solution: 'Nylon rope as the fan belt, the inner tube over the split hose, and the coin wedged in the battery terminal.',
  reward: { money: 350, reputation: 10 },
  ratingLines: {
    1: { who: 'customer', text: 'It runs, but I don’t trust that needle…' },
    2: { who: 'customer', text: 'No steam! The needle is right in the middle.' },
    3: { who: 'customer', text: 'Purring like a new car! Rope and a coin, really?' },
  },
  thanks: [{ who: 'player', text: 'Engine done. Next.' }],
  test: { stageAt: [600, 1500, 2400], duration: 3400, hum: 55 },
}

export const CAR_SILENCER_JOB: JobScript = {
  id: 'carSilencer',
  customer: CUSTOMER,
  repair: CAR_SILENCER_REPAIR,
  zone: { label: 'Roaring underneath', blurb: 'A roar like a tractor, and something scraping along the road.' },
  arrival: [
    { who: 'customer', text: 'And that noise! Like a tractor. And something was scraping the road the whole way.' },
    { who: 'player', text: 'Let’s get down and look underneath.' },
  ],
  rule: 'Everything near an exhaust gets hot. Think about what survives heat.',
  inspect: [
    { target: 'tailpipe', label: 'Tailpipe', prompt: 'Look into the tailpipe', observation: 'Tailpipe: clear, nothing blocking it', ok: true },
    { target: 'frontHanger', label: 'Front hanger', prompt: 'Tug the front hanger', observation: 'Front hanger: holding firm', ok: true },
    { target: 'hanger', label: 'Rear hanger', prompt: 'Look at the rear hanger', observation: 'Rear hanger: snapped. The silencer drags on the road', ok: false },
    { target: 'hole', label: 'Silencer', prompt: 'Check the silencer drum', observation: 'Silencer: a rusted hole. That’s the roar', ok: false },
    { target: 'heat', label: 'Heat', prompt: 'Hold a hand near it', observation: 'Silencer: very hot! Nothing plastic or cloth near it', ok: true },
  ],
  inspectPose: { pos: [0.75, 0.6, 1.15], target: [0.1, 0.14, 2.45], fov: 46 },
  buildPose: { pos: [0.95, 0.78, 0.95], target: [0.2, 0.08, 2.35], fov: 54 },
  diagnosis: [
    { who: 'mama', text: 'A snapped hanger and a rusted hole. Easy jobs, with one catch: it gets hot enough to melt anything soft.' },
    { who: 'mama', text: 'Metal only, near an exhaust.' },
  ],
  goal: 'Hang the silencer back up and stop the roar.',
  needs: ['Hanger: metal wire (strongest)', 'Patch: thin metal sheet', 'Wrap: any metal wire'],
  focus: ['strength', 'conductivity', 'flexibility'],
  walkthrough: [
    { item: 'steelWire', joint: 'hang', pick: 'Pick up the steel wire. It carries the silencer’s weight, and heat can’t hurt it.', attach: ['Loop it through the rear hanger.'] },
    { item: 'sodaCan', joint: 'patch', pick: 'Pick up the soda can. Flattened aluminium makes a heat-proof patch.', attach: ['Cover the rusted hole.'] },
    { item: 'wire', joint: 'wrap', pick: 'Pick up the copper wire. It only has to hold the patch on.', attach: ['Wind it round the patch.'] },
  ],
  solution: 'Steel wire through the rear hanger, the soda can over the hole, and copper wire wound round the patch.',
  reward: { money: 250, reputation: 9 },
  ratingLines: {
    1: { who: 'customer', text: 'Quieter… I’ll drive slowly over the potholes.' },
    2: { who: 'customer', text: 'No more tractor! And no more scraping.' },
    3: { who: 'customer', text: 'Silent! You could hear a pin drop. A soda can? Unbelievable.' },
  },
  thanks: [{ who: 'player', text: 'Silencer done. Next.' }],
  test: { stageAt: [600, 1500, 2400], duration: 3400, hum: 50 },
}

export const CAR_TYRE_JOB: JobScript = {
  id: 'carTyre',
  customer: CUSTOMER,
  repair: CAR_TYRE_REPAIR,
  zone: { label: 'Leaning to one side', blurb: 'The front corner sits low, and the car pulls sideways.' },
  arrival: [
    { who: 'customer', text: 'And it pulls to one side. My driver said, “Sir, tyre.” Then he ran away.' },
    { who: 'player', text: 'First things first: stop it rolling.' },
  ],
  rule: 'Safety first. Make sure it can’t move before you work on it.',
  inspect: [
    { target: 'slope', label: 'Road', prompt: 'Look at the road', observation: 'Road: slopes towards the drain. The car could roll!', ok: false },
    { target: 'tyre', label: 'Front tyre', prompt: 'Press the tyre', observation: 'Tyre: flat as a chapati', ok: false },
    {
      target: 'puncture',
      label: 'Nail',
      prompt: 'Run a hand round the tread',
      observation: 'Tread: a nail, right through',
      ok: false,
      requires: 'tyre',
      blocked: 'Check the tyre itself first.',
    },
    { target: 'rim', label: 'Rim', prompt: 'Check the rim', observation: 'Rim: straight, not bent', ok: true },
    { target: 'valve', label: 'Valve', prompt: 'Check the valve', observation: 'Valve: seals fine', ok: true },
  ],
  inspectPose: { pos: [-1.15, 0.95, 1.35], target: [-1.3, 0.25, 2.25], fov: 44 },
  buildPose: { pos: [-1.5, 1.1, 0.95], target: [-1.6, 0.25, 2.15], fov: 54 },
  diagnosis: [
    { who: 'mama', text: 'A nail in the tyre, and the road slopes towards the drain.' },
    { who: 'mama', text: 'Block the wheel first. Then plug the hole, then pump it up.' },
  ],
  goal: 'Fix the flat, safely.',
  needs: ['Chock: heavy and solid', 'Plug: rubbery seal', 'Air: something that pumps'],
  focus: ['strength', 'seal', 'rigidity'],
  walkthrough: [
    { item: 'brick', joint: 'chock', pick: 'Pick up the brick. Heavy and rough: the wheel won’t budge.', attach: ['Put it in front of the wheel.'] },
    { item: 'innerTube', joint: 'plug', pick: 'Pick up the inner tube. A strip of tube plugs a puncture well.', attach: ['Plug the nail hole.'] },
    { item: 'cyclePump', joint: 'inflate', pick: 'Pick up Chhotu’s cycle pump.', attach: ['Fit it on the valve and pump.'] },
  ],
  solution: 'The brick in front of the wheel, a strip of inner tube in the nail hole, then the cycle pump on the valve.',
  reward: { money: 200, reputation: 8 },
  ratingLines: {
    1: { who: 'customer', text: 'It holds… Is that chewing gum?' },
    2: { who: 'customer', text: 'Nice and round again. Well done.' },
    3: { who: 'customer', text: 'Firm as a rock! With a cycle pump! My driver will be ashamed.' },
  },
  thanks: [{ who: 'player', text: 'Tyre done. Next.' }],
  test: { stageAt: [600, 1500, 2400], duration: 3600 },
}

export const DAY_SIX: DayScript = {
  day: 6,
  recommend: 'self',
  askMama: true,
  zones: {
    prompt: 'The car has three problems. Where do you start?',
    pose: { pos: [0.3, 3.1, 0.15], target: [-0.1, 0.35, 3.3], fov: 58 },
    arriveSound: 'carArrive',
    leaveSound: 'carLeave',
  },
  companions: [{ visitor: 'rocky', at: [-2.85, 0, 3.4], facing: 0 }],
  morning: [
    { who: 'visitor', text: 'Sir! Sir! QuickFix, right here! Phones, laptops, cars, anything!' },
    { who: 'customer', text: 'Anything? Then fix this! First a nail, then smoke, and now this horrible noise.' },
    { who: 'customer', text: 'This is the groom’s car. The wedding is in two days!' },
    { who: 'visitor', text: 'Leave it to me, sir.' },
    { who: 'visitor', text: '…' },
    { who: 'visitor', text: 'Hm. No spare parts for this model. The service centre is forty kilometres away.' },
    { who: 'customer', text: 'Forty kilometres? It can’t even go forty metres!' },
    { who: 'visitor', text: '…Oi. Rubber-band. Don’t just stand there staring.' },
    { who: 'visitor', text: 'Can you do anything with this? …Please.' },
    { who: 'player', text: 'Step aside, Rocky. Let me get my toolbox.' },
    { who: 'player', text: 'Ho jayega.' },
  ],
  jobs: [CAR_ENGINE_JOB, CAR_SILENCER_JOB, CAR_TYRE_JOB],
  evening: {
    visitor: 'rocky',
    name: 'Rocky',
    lines: [
      { who: 'visitor', text: 'Rope. A soda can. A one-rupee coin.' },
      { who: 'visitor', text: 'Mr. Khanna tipped you more than I make in a week.' },
      { who: 'player', text: 'You could learn. It isn’t magic.' },
      { who: 'visitor', text: '…Nobody at QuickFix could have done that. Not even me.' },
      { who: 'visitor', text: 'Don’t tell anyone I came here.' },
    ],
  },
  reportTitle: (failedTests) => (failedTests === 0 ? 'Roadside Hero' : 'Out Of The Shop'),
  endLine: 'The groom’s car will make it. One day to the wedding.',
}
