import { useEffect, useRef, useState } from 'react'
import { selectProgress, useGame } from '../../app/state'
import type { PlayMode } from '../../app/storage'
import { canTest, jointOfItem, slotAvailable } from '../../repair/engine'
import { ITEMS, PROPERTY_LABELS } from '../../repair/items'
import type { ItemId, ItemTag } from '../../repair/types'
import type { JobScript, Line } from '../types'
import { currentJob, currentLine, currentNeeds, currentScript, guidance, SOLUTION_AFTER, useDayRun } from './store'

const DIARY_PHASES = ['inspect', 'inspecting', 'diagnosis', 'build', 'testing', 'result']
const TAG_LABELS: Partial<Record<ItemTag, string>> = { LONG: 'Long', ADHESIVE: 'Sticky', LOOP: 'Loop', HOLLOW: 'Hollow', PIN: 'Pin-shaped' }

function useMode(): PlayMode {
  return useGame((s) => selectProgress(s)?.mode ?? 'tutorial')
}

/** The DOM half of a day: mode choice, dialogue, Mama's diary, bench controls, results and the report. */
export function DayOverlay() {
  useEffect(() => {
    useDayRun.getState().begin()
    return () => useDayRun.getState().dispose()
  }, [])

  const s = useDayRun()
  const job = currentJob(s)
  const line = currentLine(s)

  return (
    <div className="d1" data-phase={s.phase}>
      {s.phase === 'choose' && <ModeChoice />}
      {job && DIARY_PHASES.includes(s.phase) && <Diary job={job} />}
      {line && <DialogueBox line={line} job={job} />}
      {s.phase === 'inspect' && <InspectPrompt />}
      {s.phase === 'inspecting' && job && <InspectBar job={job} />}
      {s.phase === 'build' && job && <BenchPanel job={job} />}
      {s.phase === 'testing' && job && <TestPanel job={job} />}
      {s.phase === 'result' && job && <ResultCard job={job} />}
      {s.phase === 'report' && <DayReport />}
    </div>
  )
}

function ModeChoice() {
  const day = useDayRun((s) => s.day)
  const recommend = useDayRun((s) => currentScript(s)?.recommend ?? 'tutorial')
  const choose = useDayRun((s) => s.choose)
  const first = useRef<HTMLButtonElement>(null)
  useEffect(() => first.current?.focus({ preventScroll: true }), [])
  const options: { mode: PlayMode; title: string; body: string }[] = [
    { mode: 'tutorial', title: 'Tutorial mode', body: 'Mama’s diary walks you through every step. The right part and the right spot glow.' },
    { mode: 'self', title: 'Play it yourself', body: 'Just the problem and the parts. Hints only turn up if you get stuck.' },
  ]
  const ordered = recommend === 'self' ? [...options].reverse() : options
  return (
    <section className="d1-choose" aria-labelledby="choose-title">
      <p className="d1-report__kicker">DAY {day}</p>
      <h2 id="choose-title" className="d1-choose__title">
        How do you want to play?
      </h2>
      <div className="d1-choose__options">
        {ordered.map((o, i) => (
          <button
            key={o.mode}
            ref={i === 0 ? first : undefined}
            type="button"
            className={`d1-choose__option${o.mode === recommend ? ' is-recommended' : ''}`}
            onClick={() => choose(o.mode)}
          >
            {o.mode === recommend && <span className="d1-choose__tag">Recommended</span>}
            <span className="d1-choose__name">{o.title}</span>
            <span className="d1-choose__body">{o.body}</span>
          </button>
        ))}
      </div>
      <p className="d1-choose__note">You can switch any time with the Tutorial switch at the top of the screen.</p>
    </section>
  )
}

function DialogueBox({ line, job }: { line: Line; job: JobScript | undefined }) {
  const player = useGame((s) => s.save?.playerName ?? 'You')
  const visitor = useDayRun((s) => currentScript(s)?.evening.name ?? '')
  const next = useDayRun((s) => s.next)
  const index = useDayRun((s) => s.line)
  const phase = useDayRun((s) => s.phase)
  const button = useRef<HTMLButtonElement>(null)
  const names: Record<Line['who'], string> = {
    customer: job?.customer.name ?? '',
    player,
    mama: 'Mama’s Diary',
    visitor,
  }

  useEffect(() => {
    button.current?.focus({ preventScroll: true })
  }, [index, phase])

  return (
    <section className={`d1-dialogue d1-dialogue--${line.who}`} aria-live="polite" onClick={next}>
      <p className="d1-dialogue__who">
        <bdi>{names[line.who]}</bdi>
      </p>
      <p className="d1-dialogue__text">{line.text}</p>
      <button
        ref={button}
        type="button"
        className="btn btn--small d1-dialogue__next"
        onClick={(e) => {
          e.stopPropagation()
          next()
        }}
      >
        Next ›
      </button>
    </section>
  )
}

function Diary({ job }: { job: JobScript }) {
  const s = useDayRun()
  const mode = useMode()
  const g = guidance(s, mode)
  const tutorial = mode === 'tutorial'
  const seen = s.seen.map((t) => job.inspect.find((step) => step.target === t)).filter((x) => x !== undefined)
  const needs = currentNeeds(s)
  const showNeeds = tutorial && ['build', 'testing', 'result'].includes(s.phase)
  const showHint = s.phase === 'build' && s.lastHint !== null && s.fails >= 1 && s.fails < SOLUTION_AFTER[mode]
  return (
    <aside className="d1-diary" aria-label="Mama’s Diary">
      <p className="d1-diary__title">MAMA’S DIARY</p>
      {tutorial && <p className="d1-diary__rule">{job.rule}</p>}
      {seen.length > 0 && (
        <ul className="d1-diary__checks">
          {seen.map((step) => (
            <li key={step.target} className={step.ok ? 'is-ok' : 'is-bad'}>
              <span className="d1-mark" aria-hidden="true">
                {step.ok ? '✓' : '✗'}
              </span>
              <span>{step.observation}</span>
            </li>
          ))}
        </ul>
      )}
      {showNeeds && (
        <p className="d1-diary__needs">
          <span>NEEDS</span>
          {needs.map((n) => (
            <strong key={n}>{n}</strong>
          ))}
        </p>
      )}
      {g && (
        <div className="d1-diary__now">
          <p className="d1-diary__say">{g.text}</p>
        </div>
      )}
      {s.phase === 'build' && (
        <p className="d1-diary__power">⏻ The machine is switched off while you work. TEST REPAIR switches it on.</p>
      )}
      {showHint && (
        <p className="d1-diary__hint">
          <strong>Mama’s hint:</strong> {s.lastHint}
        </p>
      )}
    </aside>
  )
}

function InspectPrompt() {
  const startInspect = useDayRun((s) => s.startInspect)
  const tutorial = useMode() === 'tutorial'
  const button = useRef<HTMLButtonElement>(null)
  useEffect(() => button.current?.focus({ preventScroll: true }), [])
  return (
    <div className="d1-actions">
      <button ref={button} type="button" className={`btn btn--primary${tutorial ? ' is-glowing' : ''}`} onClick={startInspect}>
        INSPECT
      </button>
    </div>
  )
}

function InspectBar({ job }: { job: JobScript }) {
  const seen = useDayRun((s) => s.seen)
  const inspectTarget = useDayRun((s) => s.inspectTarget)
  const tutorial = useMode() === 'tutorial'
  const button = useRef<HTMLButtonElement>(null)
  const open = job.inspect.filter((step) => !seen.includes(step.target))
  const ready = open.filter((step) => !step.requires || seen.includes(step.requires))
  const shown = tutorial ? ready.slice(0, 1) : open
  useEffect(() => button.current?.focus({ preventScroll: true }), [seen.length])
  if (shown.length === 0) return null
  return (
    <div className="d1-actions d1-actions--wrap">
      <p className="d1-actions__tip">{tutorial ? 'Click the glowing spot, or' : 'Click the machine, or'}</p>
      {shown.map((step, i) => (
        <button
          key={step.target}
          ref={i === 0 ? button : undefined}
          type="button"
          className="btn btn--secondary"
          onClick={() => inspectTarget(step.target)}
        >
          {step.prompt}
        </button>
      ))}
    </div>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <span className="stars" role="img" aria-label={`${value} of 5`}>
      {'★'.repeat(value)}
      <span className="stars__off">{'★'.repeat(5 - value)}</span>
    </span>
  )
}

function BenchPanel({ job }: { job: JobScript }) {
  const s = useDayRun()
  const mode = useMode()
  const g = guidance(s, mode)
  const testRef = useRef<HTMLButtonElement>(null)
  const ready = canTest(s.placements)
  const slots = job.repair.slots.filter((slot) => slotAvailable(job.repair, s.placements, slot.id))

  useEffect(() => {
    if (g?.glowButton === 'test') testRef.current?.focus({ preventScroll: true })
  }, [g?.glowButton])

  return (
    <section className="d1-bench" aria-label="Workbench">
      <p className="d1-bench__title">What’s on the bench?</p>
      <p className="d1-bench__tip">Drag a part from the tray onto the machine, or tap a card and then a spot.</p>
      <ul className={`d1-items${job.repair.items.length > 4 ? ' d1-items--compact' : ''}`}>
        {job.repair.items.map((id) => (
          <ItemCard key={id} id={id} job={job} glow={g?.glowItem === id} />
        ))}
      </ul>
      {s.held && (
        <div className="d1-slots" role="group" aria-label="Where should it go?">
          <span className="d1-slots__label">Where does it go?</span>
          {slots.map((slot) => {
            const glow = g?.glowSlots.includes(slot.id)
            const pending = s.pendingSlot === slot.id
            return (
              <button
                key={slot.id}
                type="button"
                className={`btn btn--small${glow ? ' is-glowing' : ''}${pending ? ' is-pending' : ''}`}
                aria-pressed={pending}
                onClick={() => s.clickSlot(slot.id)}
              >
                {slot.label}
              </button>
            )
          })}
        </div>
      )}
      <div className="d1-bench__actions">
        <button type="button" className="btn btn--plain btn--ink" onClick={s.resetBench} disabled={!ready && !s.held}>
          Clear the bench
        </button>
        <button
          ref={testRef}
          type="button"
          className={`btn btn--stamp${g?.glowButton === 'test' ? ' is-glowing' : ''}`}
          onClick={s.test}
          disabled={!ready}
        >
          TEST REPAIR
        </button>
      </div>
    </section>
  )
}

function ItemCard({ id, job, glow }: { id: ItemId; job: JobScript; glow: boolean }) {
  const item = ITEMS[id]
  const held = useDayRun((s) => s.held === id)
  const placedIn = useDayRun((s) => jointOfItem(s.placements, id))
  const pick = useDayRun((s) => s.pick)
  const joint = placedIn ? job.repair.joints.find((j) => j.id === placedIn) : undefined
  const tags = item.tags.map((t) => TAG_LABELS[t]).filter(Boolean)
  return (
    <li>
      <button
        type="button"
        className={`d1-item${held ? ' is-held' : ''}${placedIn ? ' is-placed' : ''}${glow ? ' is-glowing' : ''}`}
        aria-pressed={held}
        onClick={() => pick(id)}
      >
        <span className="d1-item__name">{item.name}</span>
        <span className="d1-item__blurb">{item.blurb}</span>
        <span className="d1-item__props">
          {job.focus.map((p) => (
            <span key={p} className="d1-item__prop">
              <span>{PROPERTY_LABELS[p]}</span> <Stars value={item.props[p]} />
            </span>
          ))}
        </span>
        {tags.length > 0 && (
          <span className="d1-item__tags">
            {tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </span>
        )}
        <span className="d1-item__state">
          {placedIn ? `On: ${joint?.label ?? placedIn} (tap to take off)` : held ? 'In hand' : 'Tap to pick up'}
        </span>
      </button>
    </li>
  )
}

function TestPanel({ job }: { job: JobScript }) {
  const outcome = useDayRun((s) => s.outcome)
  const phaseAt = useDayRun((s) => s.phaseAt)
  const testMs = useDayRun((s) => s.testMs)
  const [now, setNow] = useState(() => performance.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(performance.now()), 100)
    return () => window.clearInterval(id)
  }, [])
  if (!outcome) return null
  const scale = testMs / job.test.duration
  const elapsed = now - phaseAt
  return (
    <section className="d1-test" aria-live="polite">
      <p className="d1-test__title">TESTING…</p>
      <ul className="d1-test__stages">
        {outcome.stages.map((stage, i) => {
          const shown = elapsed >= (job.test.stageAt[i] ?? job.test.duration) * scale
          return (
            <li key={stage.label} className={shown ? (stage.ok ? 'is-ok' : 'is-bad') : 'is-waiting'}>
              <span className="d1-mark" aria-hidden="true">
                {shown ? (stage.ok ? '✓' : '✗') : '…'}
              </span>
              <span>{stage.label}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function ResultCard({ job }: { job: JobScript }) {
  const outcome = useDayRun((s) => s.outcome)
  const fails = useDayRun((s) => s.fails)
  const next = useDayRun((s) => s.next)
  const mode = useMode()
  const button = useRef<HTMLButtonElement>(null)
  useEffect(() => button.current?.focus({ preventScroll: true }), [])
  if (!outcome) return null
  const kind = outcome.pass ? 'is-pass' : outcome.partial ? 'is-partial' : 'is-fail'
  return (
    <section className={`d1-result ${kind}`} role="alert">
      <p className="d1-result__stamp">
        {outcome.title}
        {outcome.pass && <span aria-hidden="true"> ✓</span>}
      </p>
      {outcome.pass && (
        <ul className="d1-result__stages">
          {outcome.stages.map((st) => (
            <li key={st.label}>✓ {st.label}</li>
          ))}
        </ul>
      )}
      <p className="d1-result__msg">{outcome.message}</p>
      {outcome.pass ? (
        <p className="d1-result__reward">
          Earned ₹{job.reward.money} · Reputation +{job.reward.reputation}
        </p>
      ) : outcome.partial ? (
        <p className="d1-result__reassure">Your first fix works. Now make it last.</p>
      ) : (
        <p className="d1-result__reassure">
          No harm done. The part is back on the bench.
          {fails >= SOLUTION_AFTER[mode] ? ' Mama’s diary now spells out the answer.' : ''}
        </p>
      )}
      <button ref={button} type="button" className="btn btn--small" onClick={next}>
        {outcome.pass ? 'Next ›' : outcome.partial ? 'Make it stronger' : 'Try again'}
      </button>
    </section>
  )
}

function DayReport() {
  const progress = useGame(selectProgress)
  const replaying = useGame((s) => s.replay !== null)
  const closeDay = useGame((s) => s.closeDay)
  const script = useDayRun((s) => currentScript(s))
  const button = useRef<HTMLButtonElement>(null)
  const [finale, setFinale] = useState(false)
  useEffect(() => button.current?.focus({ preventScroll: true }), [finale])
  if (!progress || !script) return null
  const p = progress
  if (finale && script.finale) {
    return (
      <section className="d1-report d1-finale" aria-labelledby="finale-title">
        <h2 id="finale-title" className="d1-finale__title">
          {script.finale.title}
        </h2>
        {script.finale.lines.map((line) => (
          <p key={line} className="d1-finale__line">
            {line}
          </p>
        ))}
        <p className="d1-finale__tag">Ho jayega.</p>
        <p className="d1-report__end">{script.finale.footer}</p>
        <button ref={button} type="button" className="btn btn--stamp" onClick={closeDay}>
          CLOSE THE SHOP
        </button>
      </section>
    )
  }
  return (
    <section className="d1-report" aria-labelledby="report-title">
      <p className="d1-report__kicker">HO JAYEGA REPAIR WORKS · LEDGER{replaying ? ' · REPLAY' : ''}</p>
      <h2 id="report-title" className="d1-report__title">
        DAY {script.day} REPORT
      </h2>
      <dl className="d1-report__rows">
        <div>
          <dt>Jobs</dt>
          <dd>
            {p.completedJobs.length}/{script.jobs.length}
          </dd>
        </div>
        <div>
          <dt>Earned</dt>
          <dd>₹{p.earned}</dd>
        </div>
        <div>
          <dt>Reputation</dt>
          <dd>+{p.reputationGained}</dd>
        </div>
        <div>
          <dt>Failed tests</dt>
          <dd>{p.failedTests}</dd>
        </div>
        <div>
          <dt>Played in</dt>
          <dd>{p.mode === 'self' ? 'Play it yourself' : 'Tutorial mode'}</dd>
        </div>
      </dl>
      <p className="d1-report__badge">
        <span>Today’s title</span>
        {script.reportTitle(p.failedTests)}
      </p>
      <p className="d1-report__end">
        {replaying ? 'That was a replay. Your saved shop is exactly as you left it.' : script.endLine}
      </p>
      <button
        ref={button}
        type="button"
        className="btn btn--stamp"
        onClick={script.finale && !replaying ? () => setFinale(true) : closeDay}
      >
        {replaying ? 'BACK TO TITLE' : script.finale ? 'NEXT ›' : 'CLOSE THE SHOP'}
      </button>
    </section>
  )
}
