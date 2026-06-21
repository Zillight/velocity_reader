import { useCallback, useEffect, useState } from 'react'

const CHUNK_KEY = 'velocity.chunkSize' // words shown per RSVP flash
const SMART_KEY = 'velocity.smartChunk' // break chunks at punctuation
const DEFAULT_CHUNK = 1
const DEFAULT_SMART = true
export const MIN_CHUNK = 1
export const MAX_CHUNK = 4

function loadChunk() {
  try {
    const n = parseInt(localStorage.getItem(CHUNK_KEY) || '', 10)
    if (!Number.isFinite(n)) return DEFAULT_CHUNK
    return Math.min(MAX_CHUNK, Math.max(MIN_CHUNK, n))
  } catch {
    return DEFAULT_CHUNK
  }
}

function loadSmart() {
  try {
    const raw = localStorage.getItem(SMART_KEY)
    if (raw === null) return DEFAULT_SMART
    return raw === 'true'
  } catch {
    return DEFAULT_SMART
  }
}

let listeners = []
let chunkCache = null
let smartCache = null

function getChunk() {
  if (chunkCache === null) chunkCache = loadChunk()
  return chunkCache
}

function getSmart() {
  if (smartCache === null) smartCache = loadSmart()
  return smartCache
}

function notify() {
  listeners.forEach((l) => l())
}

function persistChunk(n) {
  chunkCache = n
  localStorage.setItem(CHUNK_KEY, String(n))
  notify()
}

function persistSmart(on) {
  smartCache = on
  localStorage.setItem(SMART_KEY, String(on))
  notify()
}

export function useChunkSize() {
  const [, force] = useState(0)

  useEffect(() => {
    const l = () => force((x) => x + 1)
    listeners.push(l)
    return () => {
      listeners = listeners.filter((x) => x !== l)
    }
  }, [])

  const chunkSize = getChunk()
  const breakOnPunctuation = getSmart()

  const setChunkSize = useCallback((n) => {
    const clamped = Math.min(MAX_CHUNK, Math.max(MIN_CHUNK, Math.round(n)))
    persistChunk(clamped)
  }, [])

  const setBreakOnPunctuation = useCallback((on) => {
    persistSmart(Boolean(on))
  }, [])

  return { chunkSize, setChunkSize, breakOnPunctuation, setBreakOnPunctuation }
}
