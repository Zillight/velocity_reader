import { NavLink } from 'react-router-dom'
import Icon from './Icon.jsx'
import { useLibrary } from '../hooks/useLibrary.js'

// Pick the document the reader should resume: most recently touched in-progress
// doc, otherwise the most recently touched doc overall.
function resumeTarget(docs) {
  if (!docs.length) return null
  const byRecent = [...docs].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  return byRecent.find((d) => !d.completed) || byRecent[0]
}

export default function BottomNav() {
  const { docs } = useLibrary()
  const resume = resumeTarget(docs)

  const items = [
    { to: '/home', label: 'Home', icon: 'home' },
    { to: '/archive', label: 'Library', icon: 'local_library' },
    ...(resume
      ? [{ to: `/read?id=${resume.id}`, label: 'Read', icon: 'menu_book' }]
      : []),
    { to: '/drills', label: 'Drills', icon: 'bolt' },
    { to: '/settings', label: 'Settings', icon: 'settings' },
  ]

  return (
    <nav className="fixed bottom-4 z-50 flex justify-around items-center h-[60px] w-[calc(100%-24px)] max-w-[456px] px-2 left-1/2 -translate-x-1/2 bg-bg-secondary border border-border rounded-full shadow-lg shadow-black/30">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center transition-transform duration-200 active:translate-y-[-2px] ${
              isActive ? 'text-primary font-bold' : 'text-text-secondary hover:text-primary-container'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={item.icon} fill={isActive} />
              <span className="font-caption text-caption mt-0.5">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
