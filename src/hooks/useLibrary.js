import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'velocity.documents'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(docs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
}

// Shared in-memory mirror so multiple hook instances stay in sync within a session.
let listeners = []
let cache = null

function getCache() {
  if (cache === null) cache = load()
  return cache
}

function setCache(next) {
  cache = next
  save(cache)
  listeners.forEach((l) => l(cache))
}

export function useLibrary() {
  const [docs, setDocs] = useState(getCache)

  useEffect(() => {
    const listener = (next) => setDocs(next)
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  const addDocument = useCallback(({ title, text, purpose = '', wpm = 350 }) => {
    const now = Date.now()
    const doc = {
      id: String(now) + Math.random().toString(36).slice(2, 7),
      title: title || 'Untitled',
      text,
      wordCount: text.trim().split(/\s+/).filter(Boolean).length,
      wordIndex: 0,
      wpm,
      purpose,
      createdAt: now,
      updatedAt: now,
      completed: false,
      secondsRead: 0,
    }
    setCache([doc, ...getCache()])
    return doc
  }, [])

  const updateDocument = useCallback((id, patch) => {
    setCache(
      getCache().map((d) => (d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d)),
    )
  }, [])

  const removeDocument = useCallback((id) => {
    setCache(getCache().filter((d) => d.id !== id))
  }, [])

  const getDocument = useCallback((id) => getCache().find((d) => d.id === id), [])

  return { docs, addDocument, updateDocument, removeDocument, getDocument }
}

export function getStats(docs) {
  const totalSeconds = docs.reduce((acc, d) => acc + (d.secondsRead || 0), 0)
  const withWpm = docs.filter((d) => d.wpm)
  const avgWpm = withWpm.length
    ? Math.round(withWpm.reduce((a, d) => a + d.wpm, 0) / withWpm.length)
    : 0
  const completed = docs.filter((d) => d.completed).length
  return {
    avgWpm,
    readTimeMinutes: Math.round(totalSeconds / 60),
    completed,
    total: docs.length,
  }
}
