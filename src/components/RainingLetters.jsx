import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { useStreak } from '../hooks/useStreak.js'

const HIGH_SCORE_KEY = 'raining_letters_high_score'
const GAME_DURATION = 60 // seconds
const FALL_SPEED = 0.12 // px per ms (~120px/s)
const MAX_LETTERS = 18
const COLUMNS = ['left', 'center', 'right']
const COLUMN_X = { left: '22%', center: '50%', right: '78%' }
const COLORS = {
  letter: '#C8C8C8',
  hit: '#4ECDC4',
  miss: '#FF6B6B',
}

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randBetween = (min, max) => Math.random() * (max - min) + min

function randChar(exclude) {
  let c
  do {
    c = String.fromCharCode(65 + Math.floor(Math.random() * 26))
  } while (c === exclude)
  return c
}

function loadHighScore() {
  const raw = localStorage.getItem(HIGH_SCORE_KEY)
  const n = raw == null ? NaN : Number(raw)
  return Number.isFinite(n) ? n : 0
}

export default function RainingLetters({ onExit }) {
  const [gamePhase, setGamePhase] = useState('countdown') // 'countdown' | 'playing' | 'results'
  const [countdownValue, setCountdownValue] = useState(3)
  const [score, setScore] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION)
  const [targetLetter, setTargetLetter] = useState(() => randChar(null))
  const [, setTargetSide] = useState(null)
  const [floats, setFloats] = useState([])
  const [edgeFlash, setEdgeFlash] = useState(null)
  const [highScore, setHighScore] = useState(0)
  const [result, setResult] = useState(null)

  const { addPracticeSeconds } = useStreak()

  // Mutable game state kept in refs so the rAF loop never re-renders the tree.
  const gameAreaRef = useRef(null)
  const heightRef = useRef(0)
  const lettersRef = useRef(new Map())
  const letterIdRef = useRef(0)
  const rafRef = useRef(null)
  const lastTsRef = useRef(0)
  const phaseRef = useRef('countdown')
  const scoreRef = useRef(0)
  const playStartRef = useRef(0)

  const spawnAccumRef = useRef({ left: 0, center: 0, right: 0 })
  const spawnIntervalRef = useRef({
    left: randBetween(800, 1200),
    center: randBetween(800, 1200),
    right: randBetween(800, 1200),
  })

  const targetLetterRef = useRef(targetLetter)
  const targetActiveRef = useRef(false)
  const targetPendingRef = useRef(true)
  const targetTimerRef = useRef(randBetween(2000, 3500))
  const targetCooldownRef = useRef(0)
  const targetSideRef = useRef(null)
  const targetIdRef = useRef(null)

  const statsRef = useRef({ totalTargetsShown: 0, correctHits: 0, totalTaps: 0 })
  const timeoutsRef = useRef([])

  const trackTimeout = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((t) => t !== id)
      fn()
    }, ms)
    timeoutsRef.current.push(id)
    return id
  }, [])

  const removeLetter = useCallback((id) => {
    const letter = lettersRef.current.get(id)
    if (letter && letter.el && letter.el.parentNode) {
      letter.el.parentNode.removeChild(letter.el)
    }
    lettersRef.current.delete(id)
  }, [])

  const spawnLetter = useCallback((column, { isTarget = false, char } = {}) => {
    const area = gameAreaRef.current
    if (!area) return null
    if (lettersRef.current.size >= MAX_LETTERS) return null

    const id = letterIdRef.current++
    const ch = char || randChar(targetLetterRef.current)
    const el = document.createElement('span')
    el.textContent = ch
    el.style.position = 'absolute'
    el.style.top = '0'
    el.style.left = COLUMN_X[column]
    el.style.fontSize = '24px'
    el.style.fontWeight = '500'
    el.style.color = COLORS.letter
    el.style.willChange = 'transform'
    el.style.transform = 'translate(-50%, -30px)'
    el.style.pointerEvents = 'none'
    el.setAttribute('aria-hidden', 'true')
    area.appendChild(el)

    lettersRef.current.set(id, { id, char: ch, column, y: -30, isTarget, resolved: false, el })
    return id
  }, [])

  const spawnTarget = useCallback(() => {
    const side = Math.random() < 0.5 ? 'left' : 'right'
    const id = spawnLetter(side, { isTarget: true, char: targetLetterRef.current })
    if (id == null) {
      // Grid full; retry shortly.
      targetTimerRef.current = 400
      return
    }
    targetActiveRef.current = true
    targetSideRef.current = side
    targetIdRef.current = id
    setTargetSide(side)
    statsRef.current.totalTargetsShown += 1
  }, [spawnLetter])

  const resolveTarget = useCallback(() => {
    targetActiveRef.current = false
    targetPendingRef.current = false
    targetIdRef.current = null
    targetSideRef.current = null
    targetCooldownRef.current = randBetween(1000, 2000)
    setTargetSide(null)
  }, [])

  const addScore = useCallback((delta) => {
    scoreRef.current = Math.max(0, scoreRef.current + delta)
    setScore(scoreRef.current)
  }, [])

  const spawnFloat = useCallback(
    (text, x, y, color) => {
      const id = letterIdRef.current++
      setFloats((prev) => [...prev, { id, text, x, y, color }])
      trackTimeout(() => {
        setFloats((prev) => prev.filter((f) => f.id !== id))
      }, 500)
    },
    [trackTimeout]
  )

  const flashEdge = useCallback(
    (side) => {
      const id = letterIdRef.current++
      setEdgeFlash({ side, id })
      trackTimeout(() => {
        setEdgeFlash((cur) => (cur && cur.id === id ? null : cur))
      }, 200)
    },
    [trackTimeout]
  )

  const handleMiss = useCallback(
    (letter) => {
      letter.resolved = true
      letter.isTarget = false
      letter.el.style.color = COLORS.miss
      letter.y = heightRef.current - 28
      letter.el.style.transform = `translate(-50%, ${letter.y}px)`
      addScore(-5)
      const rect = gameAreaRef.current?.getBoundingClientRect()
      const x = rect ? (letter.column === 'left' ? rect.width * 0.22 : rect.width * 0.78) : 0
      spawnFloat('-5', x, heightRef.current - 40, COLORS.miss)
      resolveTarget()
      const id = letter.id
      trackTimeout(() => removeLetter(id), 300)
    },
    [addScore, spawnFloat, resolveTarget, removeLetter, trackTimeout]
  )

  // ---- Main game loop -------------------------------------------------------
  const tick = useCallback(
    (ts) => {
      if (phaseRef.current !== 'playing') return
      const dt = lastTsRef.current ? ts - lastTsRef.current : 16
      lastTsRef.current = ts
      const height = heightRef.current

      // Regular column spawns.
      for (const col of COLUMNS) {
        spawnAccumRef.current[col] += dt
        if (spawnAccumRef.current[col] >= spawnIntervalRef.current[col]) {
          spawnAccumRef.current[col] = 0
          spawnIntervalRef.current[col] = randBetween(800, 1200)
          spawnLetter(col)
        }
      }

      // Target lifecycle.
      if (!targetActiveRef.current) {
        if (targetPendingRef.current) {
          targetTimerRef.current -= dt
          if (targetTimerRef.current <= 0) {
            spawnTarget()
            targetPendingRef.current = false
          }
        } else {
          targetCooldownRef.current -= dt
          if (targetCooldownRef.current <= 0) {
            const nt = randChar(targetLetterRef.current)
            targetLetterRef.current = nt
            setTargetLetter(nt)
            targetPendingRef.current = true
            targetTimerRef.current = randBetween(3000, 5000)
          }
        }
      }

      // Move letters and cull off-screen ones.
      lettersRef.current.forEach((letter, id) => {
        if (letter.resolved) return
        letter.y += FALL_SPEED * dt
        letter.el.style.transform = `translate(-50%, ${letter.y}px)`
        if (letter.y >= height) {
          if (letter.isTarget && id === targetIdRef.current) {
            handleMiss(letter)
          } else {
            removeLetter(id)
          }
        }
      })

      rafRef.current = requestAnimationFrame(tick)
    },
    [spawnLetter, spawnTarget, handleMiss, removeLetter]
  )

  // ---- Input ----------------------------------------------------------------
  const handleTap = useCallback(
    (side, clientX, clientY) => {
      if (phaseRef.current !== 'playing') return
      const rect = gameAreaRef.current?.getBoundingClientRect()
      const x = rect ? clientX - rect.left : 0
      const y = rect ? clientY - rect.top : 0
      const present = targetActiveRef.current

      if (present && targetSideRef.current === side) {
        statsRef.current.correctHits += 1
        statsRef.current.totalTaps += 1
        addScore(10)
        spawnFloat('+10', x, y, COLORS.hit)
        const letter = lettersRef.current.get(targetIdRef.current)
        if (letter) {
          letter.resolved = true
          letter.isTarget = false
          letter.el.style.color = COLORS.hit
          const id = letter.id
          trackTimeout(() => removeLetter(id), 300)
        }
        resolveTarget()
      } else if (present) {
        // Target on screen but wrong side: counts toward accuracy as a missed tap.
        statsRef.current.totalTaps += 1
        addScore(-5)
        spawnFloat('-5', x, y, COLORS.miss)
        flashEdge(side)
      } else {
        // No target present: false tap, excluded from accuracy denominator.
        addScore(-5)
        spawnFloat('-5', x, y, COLORS.miss)
        flashEdge(side)
      }
    },
    [addScore, spawnFloat, flashEdge, resolveTarget, removeLetter, trackTimeout]
  )

  // ---- Lifecycle ------------------------------------------------------------
  const cleanupLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    lettersRef.current.forEach((_, id) => removeLetter(id))
    lettersRef.current.clear()
  }, [removeLetter])

  const endGame = useCallback(() => {
    phaseRef.current = 'results'
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null

    // Commit play-time to the streak.
    const secs = (Date.now() - playStartRef.current) / 1000
    if (secs >= 0.5) addPracticeSeconds(secs)

    const s = statsRef.current
    const finalScore = scoreRef.current
    const accuracy = s.totalTaps > 0 ? Math.round((s.correctHits / s.totalTaps) * 100) : 0
    const prevHigh = loadHighScore()
    const isNewHigh = finalScore > prevHigh
    if (isNewHigh) localStorage.setItem(HIGH_SCORE_KEY, String(finalScore))
    setHighScore(isNewHigh ? finalScore : prevHigh)
    setResult({
      score: finalScore,
      correctHits: s.correctHits,
      totalTargetsShown: s.totalTargetsShown,
      accuracy,
      isNewHigh,
    })

    // Freeze remaining letters in place.
    lettersRef.current.forEach((letter) => {
      letter.resolved = true
    })
    setGamePhase('results')
  }, [addPracticeSeconds])

  const startGame = useCallback(() => {
    // Reset all game state.
    cleanupLoop()
    scoreRef.current = 0
    setScore(0)
    setTimeRemaining(GAME_DURATION)
    setFloats([])
    setEdgeFlash(null)
    setResult(null)
    statsRef.current = { totalTargetsShown: 0, correctHits: 0, totalTaps: 0 }
    spawnAccumRef.current = { left: 0, center: 0, right: 0 }
    spawnIntervalRef.current = {
      left: randBetween(800, 1200),
      center: randBetween(800, 1200),
      right: randBetween(800, 1200),
    }
    const firstTarget = randChar(null)
    targetLetterRef.current = firstTarget
    setTargetLetter(firstTarget)
    targetActiveRef.current = false
    targetPendingRef.current = true
    targetTimerRef.current = randBetween(2000, 3500)
    targetCooldownRef.current = 0
    targetSideRef.current = null
    targetIdRef.current = null
    setTargetSide(null)

    heightRef.current = gameAreaRef.current?.clientHeight || 0
    playStartRef.current = Date.now()
    lastTsRef.current = 0
    phaseRef.current = 'playing'
    setGamePhase('playing')
    rafRef.current = requestAnimationFrame(tick)
  }, [cleanupLoop, tick])

  // Pre-game 3-2-1-GO countdown, then start.
  const runCountdown = useCallback(() => {
    phaseRef.current = 'countdown'
    setGamePhase('countdown')
    setCountdownValue(3)
    trackTimeout(() => setCountdownValue(2), 1000)
    trackTimeout(() => setCountdownValue(1), 2000)
    trackTimeout(() => setCountdownValue('GO!'), 3000)
    trackTimeout(() => startGame(), 3700)
  }, [trackTimeout, startGame])

  useEffect(() => {
    setHighScore(loadHighScore())
    heightRef.current = gameAreaRef.current?.clientHeight || 0
    runCountdown()
    const onResize = () => {
      heightRef.current = gameAreaRef.current?.clientHeight || 0
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      // Commit any in-progress play-time on unmount (skip if endGame already did).
      if (phaseRef.current === 'playing' && playStartRef.current) {
        const secs = (Date.now() - playStartRef.current) / 1000
        if (secs >= 0.5) addPracticeSeconds(secs)
      }
      phaseRef.current = 'results'
      cleanupLoop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 1-second countdown timer during play.
  useEffect(() => {
    if (gamePhase !== 'playing') return
    const id = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          clearInterval(id)
          endGame()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [gamePhase, endGame])

  const onZonePointerDown = (side) => (e) => {
    handleTap(side, e.clientX, e.clientY)
  }

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div
      className="fixed inset-0 z-50 bg-[#121212] flex flex-col items-center overflow-hidden"
      aria-label="Raining Letters peripheral vision game. Keep your eyes on the center dot and tap the side where the target letter appears."
    >
      <div className="w-full max-w-max-width mx-auto h-full flex flex-col relative">
        {/* Top bar */}
        <div className="grid grid-cols-3 items-center h-12 px-3 flex-shrink-0 z-30">
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
          <div className="flex items-center justify-center gap-2">
            <span className="text-[16px] text-text-heading">Find:</span>
            <span className="text-[22px] font-bold text-[#6C63FF]">{targetLetter}</span>
          </div>
          <div className="flex items-center justify-end gap-3">
            <span className="text-[16px] font-semibold text-[#C8C8C8] tabular-nums">{score}</span>
            <span className="text-[16px] font-semibold text-warning tabular-nums">
              {fmtTime(timeRemaining)}
            </span>
          </div>
        </div>

        {/* Game area */}
        <div ref={gameAreaRef} className="relative flex-1 overflow-hidden">
          {/* Center focus dot (always on top) */}
          <div
            className="raining-dot absolute left-1/2 top-1/2 w-[10px] h-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6C63FF] z-20 pointer-events-none"
            aria-hidden="true"
          />

          {/* Target letter display in center */}
          {gamePhase === 'playing' && (
            <div
              className="absolute left-1/2 top-1/2 z-20 pointer-events-none -translate-x-1/2 translate-y-3 flex flex-col items-center"
              aria-hidden="true"
            >
              <span className="text-[12px] text-[#C8C8C8] font-medium tracking-wide">FIND</span>
              <span
                key={targetLetter}
                className="text-[32px] font-bold text-[#6C63FF] raining-target-letter"
              >
                {targetLetter}
              </span>
            </div>
          )}

          {/* Tap zones (invisible) */}
          {gamePhase === 'playing' && (
            <>
              <div
                role="button"
                aria-label="Tap left side"
                onPointerDown={onZonePointerDown('left')}
                className="absolute left-0 top-0 h-full w-1/2 z-10"
              />
              <div
                role="button"
                aria-label="Tap right side"
                onPointerDown={onZonePointerDown('right')}
                className="absolute right-0 top-0 h-full w-1/2 z-10"
              />
            </>
          )}

          {/* False-tap edge flash */}
          {edgeFlash && (
            <div
              key={edgeFlash.id}
              className={`raining-edge-flash absolute top-0 h-full w-[30px] bg-[#FF6B6B] z-20 pointer-events-none ${
                edgeFlash.side === 'left' ? 'left-0' : 'right-0'
              }`}
              aria-hidden="true"
            />
          )}

          {/* Score floats */}
          {floats.map((f) => (
            <span
              key={f.id}
              className="raining-score-float absolute z-20 text-[16px] font-semibold pointer-events-none"
              style={{ left: f.x, top: f.y, color: f.color }}
              aria-hidden="true"
            >
              {f.text}
            </span>
          ))}

          {/* Countdown overlay */}
          {gamePhase === 'countdown' && (
            <span
              key={String(countdownValue)}
              className={`raining-countdown-pop absolute left-1/2 top-1/2 z-30 text-[48px] font-bold pointer-events-none ${
                countdownValue === 'GO!' ? 'text-[#6C63FF]' : 'text-text-heading'
              }`}
              aria-hidden="true"
            >
              {countdownValue}
            </span>
          )}
        </div>
      </div>

      {/* Results overlay */}
      {gamePhase === 'results' && result && (
        <div className="absolute inset-0 z-40 flex items-center justify-center px-padding-screen bg-black/60 schultz-overlay-backdrop">
          <div className="schultz-overlay-card w-full max-w-xs bg-[#1E1E1E] border border-border rounded-2xl p-6 text-center shadow-2xl shadow-black/50">
            <h2 className="text-[24px] font-bold text-text-heading mb-5">Time&rsquo;s Up!</h2>

            <p className="text-[28px] font-bold text-[#6C63FF] tabular-nums leading-none mb-4">
              {result.score}
            </p>

            <div className="space-y-1 mb-5">
              <p className="text-[16px] text-[#C8C8C8]">
                Hits: {result.correctHits} / {result.totalTargetsShown}
              </p>
              <p className="text-[16px] text-[#C8C8C8]">Accuracy: {result.accuracy}%</p>
            </div>

            {result.isNewHigh ? (
              <p className="text-warning font-semibold text-body mb-6">New High Score!</p>
            ) : (
              <p className="text-text-secondary text-body mb-6">Best: {highScore}</p>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={runCountdown}
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
