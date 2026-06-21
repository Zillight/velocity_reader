import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../components/TopAppBar.jsx'
import BottomNav from '../components/BottomNav.jsx'
import Icon from '../components/Icon.jsx'
import { useLibrary } from '../hooks/useLibrary.js'

export default function Archive() {
  const navigate = useNavigate()
  const { docs, removeDocument, updateDocument } = useLibrary()
  const [openMenu, setOpenMenu] = useState(null)
  const [query, setQuery] = useState('')

  // Close the row menu on any click outside it (kebab/menu clicks stop propagation).
  useEffect(() => {
    if (openMenu === null) return
    const close = () => setOpenMenu(null)
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenMenu(null)
    }
    document.addEventListener('click', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [openMenu])

  const rename = (doc) => {
    const next = window.prompt('Rename document', doc.title)
    if (next && next.trim()) updateDocument(doc.id, { title: next.trim() })
    setOpenMenu(null)
  }

  const remove = (doc) => {
    if (window.confirm(`Delete "${doc.title}"?`)) removeDocument(doc.id)
    setOpenMenu(null)
  }

  const filtered = docs.filter((d) =>
    d.title.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <div className="h-dvh flex flex-col overflow-hidden max-w-max-width mx-auto bg-background">
      <TopAppBar title="Library" />

      <main className="flex-1 overflow-y-auto pt-20 pb-24 px-padding-screen custom-scrollbar" onClick={() => setOpenMenu(null)}>
        {docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center pt-24">
            <div className="relative w-40 h-40 flex items-center justify-center mb-8 bg-bg-secondary border border-border rounded-full">
              <Icon name="auto_stories" className="text-[56px] text-outline opacity-50" />
              <div className="absolute inset-2 border border-border/30 rounded-full" />
              <div className="absolute inset-6 border border-border/20 rounded-full" />
            </div>
            <p className="font-body text-body text-text-secondary mb-6">No documents yet</p>
            <button
              onClick={() => navigate('/import')}
              className="px-8 py-3 bg-primary-container/10 border border-primary-container/20 rounded-lg hover:bg-primary-container/20 transition-all active:scale-95"
            >
              <span className="font-button text-button text-primary uppercase tracking-widest flex items-center gap-2">
                Start Reading
                <Icon name="arrow_forward" className="text-[18px]" />
              </span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-grow">
                <Icon
                  name="search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-text-secondary pointer-events-none"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search documents"
                  className="w-full h-11 pl-10 pr-3 bg-bg-secondary border border-border rounded-xl font-body text-body text-text-primary placeholder:text-text-secondary/50 focus:border-primary outline-none transition-colors"
                />
              </div>
              <button
                onClick={() => navigate('/import')}
                aria-label="Add document — upload PDF or paste text"
                title="Add document"
                className="w-11 h-11 flex-shrink-0 bg-primary text-on-primary rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              >
                <Icon name="add" />
              </button>
            </div>

            {filtered.length === 0 ? (
              <p className="text-center font-body text-body text-text-secondary pt-12">
                No documents match “{query.trim()}”.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filtered.map((doc) => {
                  const progress = Math.round((doc.wordIndex / doc.wordCount) * 100) || 0
              return (
                <div key={doc.id} className="relative">
                  <div
                    onClick={() => navigate(`/read?id=${doc.id}`)}
                    className="bg-bg-secondary p-4 rounded-xl border border-border flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-bg-tertiary rounded-lg flex items-center justify-center border border-border">
                      <Icon
                        name={doc.completed ? 'task_alt' : 'menu_book'}
                        className={doc.completed ? 'text-secondary' : 'text-primary'}
                      />
                    </div>
                    <div className="flex-grow min-w-0 overflow-hidden">
                      <h3 className="font-body text-body text-text-primary truncate">{doc.title}</h3>
                      <p className="font-caption text-caption text-text-secondary">
                        {doc.completed ? 'Completed' : `${progress}% read`} • {doc.wpm} WPM
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenu(openMenu === doc.id ? null : doc.id)
                      }}
                      className="p-2 text-text-secondary hover:text-primary transition-colors"
                    >
                      <Icon name="more_vert" />
                    </button>
                  </div>

                  {openMenu === doc.id && (
                    <div
                      className="absolute right-2 top-14 z-20 w-48 bg-bg-tertiary rounded-lg border border-border shadow-2xl overflow-hidden py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => rename(doc)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors text-left font-body text-body text-text-primary"
                      >
                        <Icon name="edit" className="text-on-surface-variant" />
                        <span>Rename</span>
                      </button>
                      <button
                        onClick={() => remove(doc)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors text-left font-body text-body text-error"
                      >
                        <Icon name="delete" className="text-error" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
