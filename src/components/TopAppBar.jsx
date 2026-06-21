import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import StreakCalendar from './StreakCalendar.jsx'
import { useStreak } from '../hooks/useStreak.js'

const STAR_ANGLES = [0, 52, 104, 156, 208, 260, 312]

export default function TopAppBar({ title = 'Velocity', showBack = false, onBack }) {
  const navigate = useNavigate()
  const { streak, metToday } = useStreak()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const streakRef = useRef(null)
  const prevMet = useRef(metToday)

  // Fire a brief star burst the moment the daily goal is first reached.
  useEffect(() => {
    if (metToday && !prevMet.current) {
      setCelebrate(true)
      const t = setTimeout(() => setCelebrate(false), 2200)
      prevMet.current = metToday
      return () => clearTimeout(t)
    }
    prevMet.current = metToday
  }, [metToday])

  // Close the streak calendar on outside click or Escape.
  useEffect(() => {
    if (!calendarOpen) return
    const onPointerDown = (e) => {
      if (streakRef.current && !streakRef.current.contains(e.target)) {
        setCalendarOpen(false)
      }
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setCalendarOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [calendarOpen])

  const handleBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }

  return (
    <header className="fixed top-2 z-50 flex justify-between items-center px-4 h-14 w-[calc(100%-24px)] max-w-[456px] left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-md border border-border rounded-full shadow-lg shadow-black/30">
      {showBack ? (
        <button
          aria-label="Go back"
          onClick={handleBack}
          className="flex items-center justify-center w-10 h-10 -ml-2 text-primary active:scale-95 transition-transform"
        >
          <Icon name="chevron_left" />
        </button>
      ) : (
        <h1 className="font-h1 text-h1 text-primary font-bold">{title}</h1>
      )}
      {showBack && (
        <h1 className="font-h2 text-h2 text-primary font-bold truncate max-w-[50%]">{title}</h1>
      )}
      <div className="relative" ref={streakRef}>
        {celebrate && (
          <span className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
            {STAR_ANGLES.map((a, i) => (
              <span
                key={i}
                className="streak-star absolute left-1/2 top-1/2 text-tertiary"
                style={{ '--a': `${a}deg`, animationDelay: `${(i % 4) * 0.22}s` }}
              >
                <Icon name="star" fill className="text-[11px]" />
              </span>
            ))}
          </span>
        )}
        <button
          aria-label={`Reading streak: ${streak} day${streak === 1 ? '' : 's'}. Open calendar.`}
          onClick={() => setCalendarOpen((o) => !o)}
          className={`flex items-center gap-1 h-8 px-3 rounded-full border transition-colors active:scale-95 ${
            metToday
              ? 'bg-tertiary/10 border-tertiary/30'
              : 'bg-bg-secondary border-border'
          } ${celebrate ? 'streak-glow' : ''}`}
        >
          <Icon
            name="local_fire_department"
            fill={metToday}
            className={`text-[18px] ${streak > 0 ? 'text-tertiary' : 'text-text-secondary'}`}
          />
          <span
            className={`font-button text-button ${streak > 0 ? 'text-text-heading' : 'text-text-secondary'}`}
          >
            {streak}
          </span>
        </button>
        {calendarOpen && <StreakCalendar />}
      </div>
    </header>
  )
}
