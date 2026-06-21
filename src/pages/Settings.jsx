import { useState } from 'react'
import TopAppBar from '../components/TopAppBar.jsx'
import BottomNav from '../components/BottomNav.jsx'
import Icon from '../components/Icon.jsx'
import { useLibrary } from '../hooks/useLibrary.js'
import { useTheme } from '../hooks/useTheme.js'
import { useStreak } from '../hooks/useStreak.js'
import { useChunkSize, MIN_CHUNK, MAX_CHUNK } from '../hooks/useChunkSize.js'
import { useWpm, MIN_WPM, MAX_WPM } from '../hooks/useWpm.js'
import { usePurposeCountdown, MIN_COUNTDOWN, MAX_COUNTDOWN } from '../hooks/usePurposeCountdown.js'

const GOAL_PRESETS = [1, 5, 10, 15, 20, 30]
const CHUNK_PRESETS = [1, 2, 3, 4]
const WPM_PRESETS = [250, 350, 450, 600]
const COUNTDOWN_PRESETS = [10, 15, 30, 60]
const WPM_STEP = 50
const COUNTDOWN_STEP = 5

export default function Settings() {
  const { docs, removeDocument } = useLibrary()
  const { theme, toggleTheme } = useTheme()
  const { goalMinutes, setGoalMinutes } = useStreak()
  const { chunkSize, setChunkSize, breakOnPunctuation, setBreakOnPunctuation } = useChunkSize()
  const { defaultWpm, setDefaultWpm } = useWpm()
  const { countdownSeconds, setCountdownSeconds } = usePurposeCountdown()
  const [cleared, setCleared] = useState(false)
  const isDark = theme === 'dark'

  const clearAll = () => {
    if (window.confirm('Delete all documents and reading history?')) {
      docs.forEach((d) => removeDocument(d.id))
      setCleared(true)
    }
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden max-w-max-width mx-auto bg-background">
      <TopAppBar title="Settings" />
      <main className="flex-1 overflow-y-auto pt-20 pb-24 px-padding-screen custom-scrollbar">
        <h2 className="font-h2 text-h2 text-text-heading mb-6">Settings</h2>

        <div className="space-y-3">
          <button
            onClick={toggleTheme}
            className="w-full bg-bg-secondary border border-border rounded-xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <Icon name={isDark ? 'dark_mode' : 'light_mode'} className="text-primary" />
              <span className="font-body text-body text-text-primary">Appearance</span>
            </div>
            <div
              className={`relative w-12 h-7 rounded-full transition-colors ${
                isDark ? 'bg-bg-tertiary' : 'bg-primary'
              }`}
              role="switch"
              aria-checked={!isDark}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white flex items-center justify-center transition-transform ${
                  isDark ? 'translate-x-0' : 'translate-x-5'
                }`}
              >
                <Icon
                  name={isDark ? 'dark_mode' : 'light_mode'}
                  className="text-[12px] text-primary"
                />
              </span>
            </div>
          </button>

          <div className="bg-bg-secondary border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <Icon name="local_fire_department" className="text-tertiary" />
                <span className="font-body text-body text-text-primary">Daily streak goal</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  aria-label="Decrease goal"
                  onClick={() => setGoalMinutes(goalMinutes - 1)}
                  disabled={goalMinutes <= 1}
                  className="w-8 h-8 rounded-full bg-bg-tertiary border border-border flex items-center justify-center text-primary active:scale-95 disabled:opacity-30"
                >
                  <Icon name="remove" className="text-[18px]" />
                </button>
                <span className="font-h2 text-h2 text-text-heading w-14 text-center">
                  {goalMinutes}m
                </span>
                <button
                  aria-label="Increase goal"
                  onClick={() => setGoalMinutes(goalMinutes + 1)}
                  className="w-8 h-8 rounded-full bg-bg-tertiary border border-border flex items-center justify-center text-primary active:scale-95"
                >
                  <Icon name="add" className="text-[18px]" />
                </button>
              </div>
            </div>
            <p className="font-caption text-caption text-text-secondary mb-3">
              Practice this many minutes a day to keep your streak.
            </p>
            <div className="flex flex-wrap gap-2">
              {GOAL_PRESETS.map((m) => (
                <button
                  key={m}
                  onClick={() => setGoalMinutes(m)}
                  className={`px-3 py-1.5 rounded-full font-caption text-caption border transition-colors ${
                    goalMinutes === m
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-bg-tertiary text-text-secondary border-border hover:text-primary'
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
          </div>

          <div className="bg-bg-secondary border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <Icon name="hourglass_top" className="text-secondary" />
                <span className="font-body text-body text-text-primary">Purpose countdown</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  aria-label="Decrease countdown"
                  onClick={() => setCountdownSeconds(countdownSeconds - COUNTDOWN_STEP)}
                  disabled={countdownSeconds <= MIN_COUNTDOWN}
                  className="w-8 h-8 rounded-full bg-bg-tertiary border border-border flex items-center justify-center text-primary active:scale-95 disabled:opacity-30"
                >
                  <Icon name="remove" className="text-[18px]" />
                </button>
                <span className="font-h2 text-h2 text-text-heading w-14 text-center">
                  {countdownSeconds}s
                </span>
                <button
                  aria-label="Increase countdown"
                  onClick={() => setCountdownSeconds(countdownSeconds + COUNTDOWN_STEP)}
                  disabled={countdownSeconds >= MAX_COUNTDOWN}
                  className="w-8 h-8 rounded-full bg-bg-tertiary border border-border flex items-center justify-center text-primary active:scale-95 disabled:opacity-30"
                >
                  <Icon name="add" className="text-[18px]" />
                </button>
              </div>
            </div>
            <p className="font-caption text-caption text-text-secondary mb-3">
              Seconds to reflect on your reading purpose before it auto-starts.
            </p>
            <div className="flex flex-wrap gap-2">
              {COUNTDOWN_PRESETS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCountdownSeconds(n)}
                  className={`px-3 py-1.5 rounded-full font-caption text-caption border transition-colors ${
                    countdownSeconds === n
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-bg-tertiary text-text-secondary border-border hover:text-primary'
                  }`}
                >
                  {n}s
                </button>
              ))}
            </div>
          </div>

          <div className="bg-bg-secondary border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <Icon name="speed" className="text-primary" />
                <span className="font-body text-body text-text-primary">Reading speed</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  aria-label="Decrease reading speed"
                  onClick={() => setDefaultWpm(defaultWpm - WPM_STEP)}
                  disabled={defaultWpm <= MIN_WPM}
                  className="w-8 h-8 rounded-full bg-bg-tertiary border border-border flex items-center justify-center text-primary active:scale-95 disabled:opacity-30"
                >
                  <Icon name="remove" className="text-[18px]" />
                </button>
                <span className="font-h2 text-h2 text-text-heading w-16 text-center">
                  {defaultWpm}
                </span>
                <button
                  aria-label="Increase reading speed"
                  onClick={() => setDefaultWpm(defaultWpm + WPM_STEP)}
                  disabled={defaultWpm >= MAX_WPM}
                  className="w-8 h-8 rounded-full bg-bg-tertiary border border-border flex items-center justify-center text-primary active:scale-95 disabled:opacity-30"
                >
                  <Icon name="add" className="text-[18px]" />
                </button>
              </div>
            </div>
            <p className="font-caption text-caption text-text-secondary mb-3">
              Default words per minute for new reading sessions.
            </p>
            <div className="flex flex-wrap gap-2">
              {WPM_PRESETS.map((n) => (
                <button
                  key={n}
                  onClick={() => setDefaultWpm(n)}
                  className={`px-3 py-1.5 rounded-full font-caption text-caption border transition-colors ${
                    defaultWpm === n
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-bg-tertiary text-text-secondary border-border hover:text-primary'
                  }`}
                >
                  {n} wpm
                </button>
              ))}
            </div>
          </div>

          <div className="bg-bg-secondary border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <Icon name="view_column" className="text-primary" />
                <span className="font-body text-body text-text-primary">Words per flash</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  aria-label="Fewer words per flash"
                  onClick={() => setChunkSize(chunkSize - 1)}
                  disabled={chunkSize <= MIN_CHUNK}
                  className="w-8 h-8 rounded-full bg-bg-tertiary border border-border flex items-center justify-center text-primary active:scale-95 disabled:opacity-30"
                >
                  <Icon name="remove" className="text-[18px]" />
                </button>
                <span className="font-h2 text-h2 text-text-heading w-14 text-center">
                  {chunkSize}
                </span>
                <button
                  aria-label="More words per flash"
                  onClick={() => setChunkSize(chunkSize + 1)}
                  disabled={chunkSize >= MAX_CHUNK}
                  className="w-8 h-8 rounded-full bg-bg-tertiary border border-border flex items-center justify-center text-primary active:scale-95 disabled:opacity-30"
                >
                  <Icon name="add" className="text-[18px]" />
                </button>
              </div>
            </div>
            <p className="font-caption text-caption text-text-secondary mb-3">
              Show this many words at once in the reader, centered on the focus point.
            </p>
            <div className="flex flex-wrap gap-2">
              {CHUNK_PRESETS.map((n) => (
                <button
                  key={n}
                  onClick={() => setChunkSize(n)}
                  className={`px-3 py-1.5 rounded-full font-caption text-caption border transition-colors ${
                    chunkSize === n
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-bg-tertiary text-text-secondary border-border hover:text-primary'
                  }`}
                >
                  {n === 1 ? '1 word' : `${n} words`}
                </button>
              ))}
            </div>

            <button
              onClick={() => setBreakOnPunctuation(!breakOnPunctuation)}
              disabled={chunkSize === 1}
              className="mt-4 w-full flex items-center justify-between border-t border-border pt-4 disabled:opacity-40"
              role="switch"
              aria-checked={breakOnPunctuation}
            >
              <div className="flex flex-col text-left pr-3">
                <span className="font-body text-body text-text-primary">
                  Break at punctuation
                </span>
                <span className="font-caption text-caption text-text-secondary">
                  Start a new chunk after . , ! ? ; : and add a short breath pause.
                </span>
              </div>
              <div
                className={`relative w-12 h-7 flex-shrink-0 rounded-full transition-colors ${
                  breakOnPunctuation && chunkSize > 1 ? 'bg-primary' : 'bg-bg-tertiary'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                    breakOnPunctuation && chunkSize > 1 ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>

          <div className="bg-bg-secondary border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="folder" className="text-primary" />
              <span className="font-body text-body text-text-primary">Saved documents</span>
            </div>
            <span className="font-body text-body text-text-secondary">{docs.length}</span>
          </div>

          <button
            onClick={clearAll}
            className="w-full bg-bg-secondary border border-border rounded-xl p-4 flex items-center justify-between hover:border-error/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Icon name="delete_sweep" className="text-error" />
              <span className="font-body text-body text-error">Clear all data</span>
            </div>
            <Icon name="chevron_right" className="text-text-secondary" />
          </button>

          {cleared && (
            <p className="font-caption text-caption text-secondary">All data cleared.</p>
          )}
        </div>

        <p className="mt-10 text-center font-caption text-caption text-text-secondary">
          Velocity Reader • v0.1.0
        </p>
      </main>
      <BottomNav />
    </div>
  )
}
