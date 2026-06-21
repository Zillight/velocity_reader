import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TopAppBar from '../components/TopAppBar.jsx'
import Icon from '../components/Icon.jsx'
import JumpToPages from '../components/JumpToPages.jsx'
import { useLibrary } from '../hooks/useLibrary.js'
import { useStreak } from '../hooks/useStreak.js'
import { useChunkSize } from '../hooks/useChunkSize.js'
import { useWpm } from '../hooks/useWpm.js'
import { tokenize, getPivotIndex, delayForWord, buildChunk, punctuationPause } from '../lib/rsvp.js'

export default function Reader() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const id = params.get('id')
  const { getDocument, updateDocument } = useLibrary()
  const { addPracticeSeconds } = useStreak()
  const { chunkSize, setChunkSize, breakOnPunctuation } = useChunkSize()
  const { defaultWpm } = useWpm()

  const doc = useMemo(() => getDocument(id), [getDocument, id])
  const words = useMemo(() => (doc ? tokenize(doc.text) : []), [doc])

  const [index, setIndex] = useState(doc?.wordIndex || 0)
  const [playing, setPlaying] = useState(false)
  const [wpm, setWpm] = useState(doc?.wpm || defaultWpm)
  const [showJump, setShowJump] = useState(false)
  const [showQuickEdit, setShowQuickEdit] = useState(false)

  const timerRef = useRef(null)
  const indexRef = useRef(index)
  const secondsRef = useRef(doc?.secondsRead || 0)
  const playStartRef = useRef(null)
  indexRef.current = index

  const persist = useCallback(
    (patch) => {
      if (!doc) return
      updateDocument(doc.id, patch)
    },
    [doc, updateDocument],
  )

  // Accumulate real practice time eagerly: record start when playing, commit when paused/stopped.
  useEffect(() => {
    if (playing) {
      playStartRef.current = Date.now()
    } else {
      if (playStartRef.current !== null) {
        const secs = (Date.now() - playStartRef.current) / 1000
        if (secs >= 0.5) addPracticeSeconds(secs)
        playStartRef.current = null
      }
    }
  }, [playing, addPracticeSeconds])

  // RSVP loop
  useEffect(() => {
    if (!playing) return
    if (index >= words.length) {
      setPlaying(false)
      return
    }
    const chunk = buildChunk(words, index, chunkSize, breakOnPunctuation)
    const advance = chunk.length || 1
    let delay = chunk.reduce((sum, w) => sum + delayForWord(w, wpm), 0)
    if (breakOnPunctuation && chunk.length) {
      delay += punctuationPause(chunk[chunk.length - 1], wpm)
    }
    timerRef.current = setTimeout(() => {
      secondsRef.current += delay / 1000
      setIndex((i) => i + advance)
    }, delay)
    return () => clearTimeout(timerRef.current)
  }, [playing, index, words, wpm, chunkSize, breakOnPunctuation])

  // Detect completion
  useEffect(() => {
    if (doc && index >= words.length && words.length > 0) {
      setPlaying(false)
      persist({
        wordIndex: words.length,
        wpm,
        completed: true,
        secondsRead: Math.round(secondsRef.current),
      })
    }
  }, [index, words.length, doc, persist, wpm])

  // Save on unmount — commit any in-flight practice time first.
  useEffect(() => {
    return () => {
      if (playStartRef.current !== null) {
        const secs = (Date.now() - playStartRef.current) / 1000
        if (secs >= 0.5) addPracticeSeconds(secs)
        playStartRef.current = null
      }
      if (!doc) return
      updateDocument(doc.id, {
        wordIndex: Math.min(indexRef.current, words.length),
        wpm,
        secondsRead: Math.round(secondsRef.current),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!doc) {
    return (
      <div className="min-h-screen max-w-max-width mx-auto flex flex-col items-center justify-center gap-4 px-padding-screen text-center">
        <Icon name="error" className="text-[48px] text-text-secondary" />
        <p className="font-body text-text-secondary">Document not found.</p>
        <button
          onClick={() => navigate('/home')}
          className="px-6 py-3 bg-primary text-on-primary rounded-lg font-button text-button uppercase"
        >
          Go Home
        </button>
      </div>
    )
  }

  const finished = index >= words.length
  const chunkWords = finished ? [] : buildChunk(words, index, chunkSize, breakOnPunctuation)
  // Anchor the eye on the centre word of the chunk (keeps the focus point central).
  const anchorPos = Math.floor((chunkWords.length - 1) / 2)
  const anchorWord = chunkWords[anchorPos] || ''
  const anchorPivot = getPivotIndex(anchorWord)
  const progress = Math.round((Math.min(index, words.length) / words.length) * 100)

  // Shrink type as the chunk grows so multi-word flashes fit the column.
  const chunkTextClass =
    chunkSize >= 4
      ? 'text-[22px] leading-[30px]'
      : chunkSize === 3
        ? 'text-[26px] leading-[34px]'
        : chunkSize === 2
          ? 'text-[30px] leading-[38px]'
          : 'font-reader-chunk-mobile text-reader-chunk-mobile'

  const commitAndSave = useCallback(() => {
    if (playStartRef.current !== null) {
      const secs = (Date.now() - playStartRef.current) / 1000
      if (secs >= 0.5) addPracticeSeconds(secs)
      playStartRef.current = null
    }
    if (doc) {
      updateDocument(doc.id, {
        wordIndex: Math.min(indexRef.current, words.length),
        wpm,
        secondsRead: Math.round(secondsRef.current),
      })
    }
  }, [addPracticeSeconds, doc, updateDocument, words.length, wpm])

  const reset = () => {
    setPlaying(false)
    setIndex(0)
    persist({ wordIndex: 0, completed: false })
  }

  const jumpTo = (wordIndex) => {
    const clamped = Math.max(0, Math.min(wordIndex, words.length))
    setPlaying(false)
    setIndex(clamped)
    indexRef.current = clamped
    persist({ wordIndex: clamped, completed: false })
    setShowJump(false)
  }

  return (
    <div className="fixed inset-0 max-w-max-width mx-auto flex flex-col bg-background overflow-hidden">
      <TopAppBar title={doc.title} showBack onBack={() => { setPlaying(false); commitAndSave(); navigate('/home') }} />

      <main className="flex-grow min-h-0 flex flex-col pt-16 pb-0 px-padding-screen">
        {/* Jump to page + Quick edit */}
        <div className="flex justify-between items-center pt-3">
          <button
            onClick={() => {
              setPlaying(false)
              setShowQuickEdit(true)
            }}
            aria-label="Quick settings"
            title="Quick settings"
            className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-bg-secondary border border-border text-text-secondary hover:text-primary hover:border-primary/40 active:scale-95 transition-all"
          >
            <Icon name="tune" className="text-[18px]" />
            <span className="font-caption text-caption">Settings</span>
          </button>
          <button
            onClick={() => {
              setPlaying(false)
              setShowJump(true)
            }}
            aria-label="Jump to a page to start reading from"
            title="Jump to page"
            className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-bg-secondary border border-border text-text-secondary hover:text-primary hover:border-primary/40 active:scale-95 transition-all"
          >
            <Icon name="auto_stories" className="text-[18px]" />
            <span className="font-caption text-caption">Jump to page</span>
          </button>
        </div>

        {/* Reading purpose reminder */}
        {doc.purpose && (
          <p className="mt-6 mb-2 text-center font-caption text-caption text-text-secondary italic">
            “{doc.purpose}”
          </p>
        )}

        {/* RSVP word display */}
        <div className="flex-grow flex flex-col items-center justify-center">
          {finished ? (
            <div className="text-center space-y-4 fade-in-up">
              <Icon name="check_circle" className="text-[56px] text-secondary" fill />
              <p className="font-h2 text-h2 text-text-heading">Session complete</p>
              <p className="font-caption text-caption text-text-secondary">
                {words.length} words at {wpm} WPM
              </p>
            </div>
          ) : (
            <div className="relative w-full flex items-center justify-center">
              {/* Fixation guides */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-3 bg-primary/40" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-3 bg-primary/40" />
              <p
                className={`${chunkTextClass} font-semibold tracking-tight text-text-heading text-center px-2 flex flex-wrap items-center justify-center gap-x-[0.35em] gap-y-1`}
              >
                {chunkWords.map((w, i) =>
                  i === anchorPos ? (
                    <span key={i} className="whitespace-pre">
                      <span className="text-text-secondary">{w.slice(0, anchorPivot)}</span>
                      <span className="text-primary">{w.charAt(anchorPivot)}</span>
                      <span className="text-text-secondary">{w.slice(anchorPivot + 1)}</span>
                    </span>
                  ) : (
                    <span key={i} className="text-text-heading/90">
                      {w}
                    </span>
                  ),
                )}
              </p>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between font-caption text-caption text-text-secondary mb-1">
            <span>{progress}%</span>
            <span>
              {Math.min(index, words.length)} / {words.length}
            </span>
          </div>
          <div className="w-full h-1 bg-bg-tertiary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </main>

      {/* Controls */}
      <footer className="px-padding-screen pb-8 pt-2 max-w-max-width mx-auto w-full">
        {/* WPM control */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => setWpm((w) => Math.max(100, w - 50))}
            className="w-10 h-10 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-primary active:scale-95"
          >
            <Icon name="remove" />
          </button>
          <div className="text-center w-24">
            <p className="font-h2 text-h2 text-text-heading">{wpm}</p>
            <p className="font-caption text-caption text-text-secondary">WPM</p>
          </div>
          <button
            onClick={() => setWpm((w) => Math.min(900, w + 50))}
            className="w-10 h-10 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-primary active:scale-95"
          >
            <Icon name="add" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={reset}
            className="w-14 h-14 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-text-secondary active:scale-95"
          >
            <Icon name="replay" />
          </button>
          <button
            onClick={() => !finished && setPlaying((p) => !p)}
            className="w-20 h-20 rounded-full bg-primary text-on-primary flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
            disabled={finished}
          >
            <Icon name={playing ? 'pause' : 'play_arrow'} className="text-[40px]" fill />
          </button>
          <button
            onClick={() => { setPlaying(false); commitAndSave(); navigate('/home') }}
            className="w-14 h-14 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-text-secondary active:scale-95"
          >
            <Icon name="done" />
          </button>
        </div>
      </footer>

      {showJump && (
        <JumpToPages
          words={words}
          currentIndex={index}
          onStartHere={jumpTo}
          onClose={() => setShowJump(false)}
        />
      )}

      {showQuickEdit && (
        <QuickEditSheet
          wpm={wpm}
          setWpm={setWpm}
          chunkSize={chunkSize}
          setChunkSize={setChunkSize}
          onClose={() => setShowQuickEdit(false)}
        />
      )}
    </div>
  )
}

const WPM_PRESETS = [200, 300, 400, 500, 600]
const CHUNK_LABELS = ['1 word', '2 words', '3 words', '4 words']

function QuickEditSheet({ wpm, setWpm, chunkSize, setChunkSize, onClose }) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="Quick reading settings"
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-max-width bg-bg-secondary rounded-t-2xl px-padding-screen pt-5 pb-10 shadow-2xl"
      >
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-6" />

        <p className="font-h2 text-h2 text-text-heading mb-5">Quick settings</p>

        {/* WPM */}
        <p className="font-caption text-caption text-text-secondary uppercase tracking-wider mb-2">Speed</p>
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setWpm((w) => Math.max(100, w - 50))}
            className="w-10 h-10 rounded-full bg-bg-tertiary border border-border flex items-center justify-center text-primary active:scale-95"
          >
            <Icon name="remove" />
          </button>
          <div className="flex-1 text-center">
            <span className="font-h1 text-h1 text-text-heading tabular-nums">{wpm}</span>
            <span className="font-caption text-caption text-text-secondary ml-1">WPM</span>
          </div>
          <button
            onClick={() => setWpm((w) => Math.min(900, w + 50))}
            className="w-10 h-10 rounded-full bg-bg-tertiary border border-border flex items-center justify-center text-primary active:scale-95"
          >
            <Icon name="add" />
          </button>
        </div>
        <div className="flex gap-2 flex-wrap mb-6">
          {WPM_PRESETS.map((n) => (
            <button
              key={n}
              onClick={() => setWpm(n)}
              className={`px-3 py-1.5 rounded-full font-caption text-caption border transition-colors ${
                wpm === n
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-bg-tertiary text-text-secondary border-border'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Chunk size */}
        <p className="font-caption text-caption text-text-secondary uppercase tracking-wider mb-2">Words per flash</p>
        <div className="flex gap-2 flex-wrap mb-6">
          {CHUNK_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => setChunkSize(i + 1)}
              className={`px-3 py-1.5 rounded-full font-caption text-caption border transition-colors ${
                chunkSize === i + 1
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-bg-tertiary text-text-secondary border-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full h-12 bg-primary text-on-primary rounded-xl font-button text-button uppercase tracking-widest active:scale-[0.98] transition-transform"
        >
          Done
        </button>
      </div>
    </>
  )
}
