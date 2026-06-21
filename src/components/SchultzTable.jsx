import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { useStreak } from '../hooks/useStreak.js'

const BEST_TIME_KEY = 'schultz_best_time'
const CENTER_INDEX = 12 // row 3, col 3 in a 5x5 grid (0-indexed)

// Fisher–Yates shuffle of 1..25.
function shuffledGrid() {
  const a = Array.from({ length: 25 }, (_, i) => i + 1)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// MM:SS.s (tenths of a second).
function formatTime(ms) {
  const totalTenths = Math.floor(ms / 100)
  const tenths = totalTenths % 10
  const totalSeconds = Math.floor(totalTenths / 10)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(minutes)}:${pad(seconds)}.${tenths}`
}

// Compact "34.2s" form used for the stored best comparison.
function formatSeconds(ms) {
  return `${(ms / 1000).toFixed(1)}s`
}

function loadBestTime() {
  const raw = localStorage.getItem(BEST_TIME_KEY)
  const n = raw == null ? NaN : Number(raw)
  return Number.isFinite(n) ? n : null
}

export default function SchultzTable({ onExit }) {
  const [grid, setGrid] = useState(shuffledGrid)
  const [nextTarget, setNextTarget] = useState(1)
  const [found, setFound] = useState(() => new Set())
  const [flashingCell, setFlashingCell] = useState(null)
  const [isComplete, setIsComplete] = useState(false)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [bestTime, setBestTime] = useState(null)
  const [roundId, setRoundId] = useState(0)

  const { addPracticeSeconds } = useStreak()
  const startRef = useRef(0)
  const intervalRef = useRef(null)
  const flashTimeoutRef = useRef(null)

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    startRef.current = performance.now()
    setElapsedTime(0)
    intervalRef.current = setInterval(() => {
      setElapsedTime(performance.now() - startRef.current)
    }, 100)
  }, [stopTimer])

  const startRound = useCallback(() => {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
    setGrid(shuffledGrid())
    setNextTarget(1)
    setFound(new Set())
    setFlashingCell(null)
    setIsComplete(false)
    setIsNewRecord(false)
    setRoundId((id) => id + 1)
    startTimer()
  }, [startTimer])

  // Count active play-time toward the daily reading streak. Time accrues while a
  // round is in progress and is committed when it ends or the drill is exited.
  useEffect(() => {
    if (isComplete) return
    const start = Date.now()
    return () => {
      const secs = (Date.now() - start) / 1000
      if (secs >= 0.5) addPracticeSeconds(secs)
    }
  }, [roundId, isComplete, addPracticeSeconds])

  // Load best time and kick off the first round on mount.
  useEffect(() => {
    setBestTime(loadBestTime())
    startRound()
    return () => {
      stopTimer()
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const completeRound = useCallback(() => {
    const finalMs = performance.now() - startRef.current
    stopTimer()
    setElapsedTime(finalMs)
    setBestTime((prevBest) => {
      const record = prevBest == null || finalMs < prevBest
      setIsNewRecord(record)
      if (record) {
        localStorage.setItem(BEST_TIME_KEY, String(finalMs))
        return finalMs
      }
      return prevBest
    })
    setIsComplete(true)
  }, [stopTimer])

  const handleTap = useCallback(
    (index) => {
      if (isComplete) return
      const num = grid[index]
      if (num === nextTarget) {
        setFound((prev) => {
          const next = new Set(prev)
          next.add(num)
          return next
        })
        if (num === 25) completeRound()
        else setNextTarget(num + 1)
      } else {
        setFlashingCell(index)
        if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
        flashTimeoutRef.current = setTimeout(() => setFlashingCell(null), 200)
      }
    },
    [grid, nextTarget, isComplete, completeRound]
  )

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center">
      <div className="w-full max-w-max-width mx-auto h-full flex flex-col px-padding-screen">
        {/* Top bar: back chevron, centered title, timer */}
        <div className="grid grid-cols-3 items-center h-16 pt-2 flex-shrink-0">
          <div className="flex justify-start">
            <button
              type="button"
              aria-label="Go back"
              onClick={onExit}
              className="flex items-center justify-center w-10 h-10 -ml-2 text-text-secondary active:scale-95 transition-transform"
            >
              <Icon name="chevron_left" className="text-[24px]" />
            </button>
          </div>
          <h1 className="text-center text-[18px] font-semibold text-text-heading">
            Schultz Table
          </h1>
          <div className="flex justify-end">
            <span className="text-[18px] font-semibold text-warning tabular-nums">
              {formatTime(elapsedTime)}
            </span>
          </div>
        </div>

        {/* Grid: vertically centered in the available space */}
        <div className="flex-1 flex items-center justify-center">
          <div
            role="grid"
            aria-label="Schultz table"
            className="grid grid-cols-5 gap-1 w-full"
          >
            {grid.map((num, index) => {
              const isFound = found.has(num)
              const isFlashing = flashingCell === index
              const isCenter = index === CENTER_INDEX

              let stateClasses
              if (isFlashing) {
                stateClasses = 'bg-error text-white'
              } else if (isFound) {
                stateClasses =
                  'bg-[#4ECDC4]/[0.15] text-[#4ECDC4] transition-colors duration-150'
              } else {
                stateClasses =
                  'bg-bg-tertiary text-text-primary transition-colors duration-200'
              }

              return (
                <button
                  key={index}
                  type="button"
                  role="gridcell"
                  aria-label={`Number ${num}`}
                  onPointerDown={() => handleTap(index)}
                  disabled={isComplete}
                  className={`aspect-square min-h-[44px] flex items-center justify-center rounded-lg text-[20px] font-semibold select-none ${stateClasses} ${
                    isCenter ? 'border-2 border-[#6C63FF]' : ''
                  }`}
                >
                  {num}
                </button>
              )
            })}
          </div>
        </div>

        {/* Find indicator */}
        <div
          aria-live="polite"
          className="flex items-center justify-center gap-2 pb-6 pt-2 flex-shrink-0"
        >
          {!isComplete && (
            <>
              <span className="text-[16px] text-text-heading">Find:</span>
              <span className="text-[22px] font-bold text-[#6C63FF] tabular-nums">
                {nextTarget}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Completion overlay */}
      {isComplete && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-padding-screen bg-black/60 schultz-overlay-backdrop">
          <div className="schultz-overlay-card w-full max-w-xs bg-bg-secondary border border-border rounded-2xl p-6 text-center shadow-2xl shadow-black/50">
            <h2 className="text-h1 font-h1 text-text-heading mb-4">Complete!</h2>

            <p className="text-[40px] leading-none font-bold text-[#6C63FF] tabular-nums mb-3">
              {formatTime(elapsedTime)}
            </p>

            {isNewRecord ? (
              <p className="text-warning font-semibold text-body mb-6">
                New Record! {formatSeconds(elapsedTime)}
              </p>
            ) : (
              <p className="text-text-secondary text-body mb-6">
                Best: {bestTime != null ? formatSeconds(bestTime) : '—'}
              </p>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={startRound}
                className="w-full py-3 rounded-xl bg-[#6C63FF] text-white font-button text-button active:scale-[0.98] transition-transform"
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={onExit}
                className="w-full py-2 text-text-secondary font-button text-button active:scale-[0.98] transition-transform"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
