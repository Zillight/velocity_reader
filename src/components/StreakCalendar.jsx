import { useState } from 'react'
import Icon from './Icon.jsx'
import { useStreak, fmtDate } from '../hooks/useStreak.js'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function StreakCalendar() {
  const { activity, goalSeconds, goalMinutes, streak, secondsToday, metToday } = useStreak()
  const [view, setView] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const todayKey = fmtDate(new Date())
  const now = new Date()
  const firstWeekday = new Date(view.year, view.month, 1).getDay()
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const isCurrentMonth = view.year === now.getFullYear() && view.month === now.getMonth()

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(day)

  const shift = (delta) => {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  return (
    <div className="absolute right-0 top-12 z-50 w-[300px] bg-bg-secondary border border-border rounded-xl shadow-2xl p-4 fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon
              name="local_fire_department"
              fill={metToday}
              className={`text-[22px] ${streak > 0 ? 'text-tertiary' : 'text-text-secondary'}`}
            />
            <div>
              <p className="font-h2 text-h2 text-text-heading leading-none">{streak}</p>
              <p className="font-caption text-caption text-text-secondary">
                day{streak === 1 ? '' : 's'} streak
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-caption text-caption text-text-secondary">Goal {goalMinutes}m</p>
            <p className={`font-caption text-caption ${metToday ? 'text-secondary' : 'text-text-secondary'}`}>
              {metToday ? 'Done today' : `${Math.floor(secondsToday / 60)}/${goalMinutes}m today`}
            </p>
          </div>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => shift(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-text-secondary hover:text-primary active:scale-95"
          >
            <Icon name="chevron_left" className="text-[20px]" />
          </button>
          <span className="font-button text-button text-text-heading">
            {MONTHS[view.month]} {view.year}
          </span>
          <button
            onClick={() => shift(1)}
            disabled={isCurrentMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full text-text-secondary hover:text-primary active:scale-95 disabled:opacity-30 disabled:hover:text-text-secondary"
          >
            <Icon name="chevron_right" className="text-[20px]" />
          </button>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((w, i) => (
            <div key={i} className="text-center font-caption text-caption text-text-secondary/60">
              {w}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`b${i}`} />
            const key = fmtDate(new Date(view.year, view.month, day))
            const seconds = activity[key] || 0
            const met = seconds >= goalSeconds
            const partial = seconds > 0 && !met
            const isToday = key === todayKey
            const isFuture = new Date(view.year, view.month, day) > now && !isToday

            return (
              <div key={key} className="flex items-center justify-center">
                <div
                  title={seconds ? `${Math.round(seconds / 60)} min practiced` : 'No practice'}
                  className={`relative w-8 h-8 flex items-center justify-center rounded-full font-caption text-caption transition-colors ${
                    met
                      ? 'bg-tertiary text-on-tertiary font-semibold'
                      : partial
                        ? 'bg-tertiary/20 text-tertiary'
                        : isFuture
                          ? 'text-text-secondary/30'
                          : 'text-text-secondary'
                  } ${isToday && !met ? 'ring-1 ring-primary' : ''}`}
                >
                  {met ? <Icon name="local_fire_department" fill className="text-[16px]" /> : day}
                </div>
              </div>
            )
          })}
        </div>

      <p className="mt-3 pt-3 border-t border-border font-caption text-caption text-text-secondary text-center">
        Practice {goalMinutes} min a day to keep your streak.
      </p>
    </div>
  )
}
