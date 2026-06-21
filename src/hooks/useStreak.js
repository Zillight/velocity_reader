import { useCallback, useEffect, useState } from 'react'

const ACTIVITY_KEY = 'velocity.activity' // { 'YYYY-MM-DD': secondsPracticed }
const GOAL_KEY = 'velocity.goal' // daily goal in minutes
const DEFAULT_GOAL_MIN = 1

export function fmtDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function loadActivity() {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    // Migrate legacy array-of-dates format -> seconds map (treat as goal met).
    if (Array.isArray(parsed)) {
      const obj = {}
      parsed.forEach((d) => {
        obj[d] = 86400
      })
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(obj))
      return obj
    }
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function loadGoal() {
  try {
    const n = parseInt(localStorage.getItem(GOAL_KEY) || '', 10)
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_GOAL_MIN
  } catch {
    return DEFAULT_GOAL_MIN
  }
}

// Consecutive days meeting the goal, ending today (or yesterday if today not yet met).
export function computeStreak(activity, goalSeconds) {
  const met = (date) => (activity[fmtDate(date)] || 0) >= goalSeconds
  const cursor = new Date()
  if (!met(cursor)) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (met(cursor)) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

let listeners = []
let activityCache = null
let goalCache = null

function getActivity() {
  if (activityCache === null) activityCache = loadActivity()
  return activityCache
}

function getGoal() {
  if (goalCache === null) goalCache = loadGoal()
  return goalCache
}

function notify() {
  listeners.forEach((l) => l())
}

function persistActivity(next) {
  activityCache = next
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next))
  notify()
}

function persistGoal(minutes) {
  goalCache = minutes
  localStorage.setItem(GOAL_KEY, String(minutes))
  notify()
}

export function useStreak() {
  const [, force] = useState(0)

  useEffect(() => {
    const l = () => force((x) => x + 1)
    listeners.push(l)
    return () => {
      listeners = listeners.filter((x) => x !== l)
    }
  }, [])

  const activity = getActivity()
  const goalMinutes = getGoal()
  const goalSeconds = goalMinutes * 60
  const today = fmtDate(new Date())
  const secondsToday = activity[today] || 0

  const addPracticeSeconds = useCallback((seconds) => {
    if (!seconds || seconds <= 0) return
    const key = fmtDate(new Date())
    const current = getActivity()
    persistActivity({ ...current, [key]: (current[key] || 0) + seconds })
  }, [])

  const setGoalMinutes = useCallback((minutes) => {
    const n = Math.max(1, Math.round(minutes))
    persistGoal(n)
  }, [])

  return {
    activity,
    goalMinutes,
    goalSeconds,
    secondsToday,
    metToday: secondsToday >= goalSeconds,
    streak: computeStreak(activity, goalSeconds),
    addPracticeSeconds,
    setGoalMinutes,
  }
}
