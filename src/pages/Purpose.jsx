import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../components/TopAppBar.jsx'
import Icon from '../components/Icon.jsx'
import { useLibrary } from '../hooks/useLibrary.js'
import { useWpm } from '../hooks/useWpm.js'

const MAX = 150
const COUNTDOWN_SECONDS = 30 // seconds
const RING_RADIUS = 70

function formatTime(total) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Purpose() {
  const navigate = useNavigate()
  const { addDocument } = useLibrary()
  const { defaultWpm } = useWpm()
  const [purpose, setPurpose] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS)
  const [typingMode, setTypingMode] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!sessionStorage.getItem('velocity.pending')) {
      navigate('/import', { replace: true })
    }
  }, [navigate])

  const start = useCallback(() => {
    if (startedRef.current) return
    const raw = sessionStorage.getItem('velocity.pending')
    if (!raw) return
    startedRef.current = true
    const data = JSON.parse(raw)
    const doc = addDocument({ title: data.title, text: data.text, purpose, wpm: defaultWpm })
    sessionStorage.removeItem('velocity.pending')
    navigate(`/read?id=${doc.id}`)
  }, [addDocument, navigate, purpose, defaultWpm])

  // Reflection countdown runs only while not typing; tapping the text icon cancels it.
  useEffect(() => {
    if (typingMode) return
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [typingMode])

  // Auto-start reading once the countdown reaches zero (reflection mode only).
  useEffect(() => {
    if (!typingMode && secondsLeft === 0) start()
  }, [secondsLeft, typingMode, start])

  const circumference = 2 * Math.PI * RING_RADIUS
  const dashOffset = circumference * (1 - secondsLeft / COUNTDOWN_SECONDS)

  return (
    <div className="h-dvh flex flex-col items-center bg-background overflow-hidden">
      <TopAppBar title="Velocity" showBack />

      <main className="flex-grow w-full max-w-max-width px-padding-screen pt-24 pb-32 flex flex-col">
        <section className="mb-8">
          <h2 className="font-h2 text-h2 text-text-heading mb-2">Your reading purpose</h2>
          <p className="font-body text-body text-text-secondary">
            {typingMode
              ? 'Type your intention, then tap Start Reading when ready.'
              : 'Take a moment to focus. Reading begins automatically at zero.'}
          </p>
        </section>

        <section className="flex-grow flex flex-col">
          {typingMode ? (
            <div className="relative">
              <textarea
                value={purpose}
                maxLength={MAX}
                autoFocus
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full min-h-[200px] p-6 bg-bg-tertiary border border-border rounded-xl font-body text-body text-text-primary placeholder:text-text-secondary/40 focus:border-primary outline-none transition-all duration-300 resize-none"
                placeholder="e.g., Understand the 3 key principles of behavioral economics for my project..."
              />
              <div className="absolute bottom-4 right-6 font-caption text-caption text-text-secondary/60">
                <span className={purpose.length ? 'text-primary' : ''}>{purpose.length}</span> / {MAX}
              </div>
            </div>
          ) : (
            <div className="relative flex-grow flex flex-col items-center justify-center text-center bg-bg-tertiary border border-border rounded-xl p-8 overflow-hidden">
              <p className="font-caption text-caption text-text-secondary uppercase tracking-wider mb-6">
                Focus on your purpose
              </p>

              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth="8"
                    className="stroke-border"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="stroke-primary"
                    style={{
                      strokeDasharray: circumference,
                      strokeDashoffset: dashOffset,
                      transition: 'stroke-dashoffset 1s linear',
                    }}
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-[40px] leading-none font-bold text-text-heading tabular-nums">
                    {formatTime(secondsLeft)}
                  </span>
                  <span className="font-caption text-caption text-text-secondary mt-1">remaining</span>
                </div>
              </div>

              <p className="mt-6 font-body text-body text-text-secondary px-2">
                Why are you reading this?
              </p>

              <button
                onClick={() => setTypingMode(true)}
                aria-label="Type your purpose instead"
                title="Type your purpose instead"
                className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-primary hover:border-primary/40 active:scale-95 transition-all"
              >
                <Icon name="keyboard" className="text-[20px]" />
              </button>
            </div>
          )}
        </section>
      </main>

      <footer className="fixed bottom-0 w-full z-50 px-padding-screen pb-base max-w-max-width left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm">
        <div className="py-padding-screen border-t border-border">
          <button
            onClick={start}
            className="w-full h-14 bg-primary text-on-primary font-button text-button uppercase rounded-xl transition-all duration-200 active:translate-y-1 flex items-center justify-center gap-2 group"
          >
            Start Reading
            <Icon name="bolt" className="text-[20px] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </footer>
    </div>
  )
}
