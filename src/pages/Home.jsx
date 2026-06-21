import { useNavigate } from 'react-router-dom'
import TopAppBar from '../components/TopAppBar.jsx'
import BottomNav from '../components/BottomNav.jsx'
import Icon from '../components/Icon.jsx'
import { useLibrary, getStats } from '../hooks/useLibrary.js'

export default function Home() {
  const navigate = useNavigate()
  const { docs } = useLibrary()
  const stats = getStats(docs)

  const resume = docs.find((d) => !d.completed)
  const progress = resume ? Math.round((resume.wordIndex / resume.wordCount) * 100) : 0

  return (
    <div className="h-dvh flex flex-col overflow-hidden max-w-max-width mx-auto">
      <TopAppBar />

      <main className="relative flex-1 overflow-y-auto pt-20 pb-24 px-padding-screen">
        <section className="mb-8 fade-in-up">
          <h2 className="font-h1 text-h1 text-text-heading mb-1">Ready to read?</h2>
          <p className="font-body text-text-secondary text-[14px]">
            Pick up where you left off or start fresh.
          </p>
        </section>

        {resume && (
          <section className="mb-8 animate-float">
            <div
              onClick={() => navigate(`/read?id=${resume.id}`)}
              className="bg-bg-secondary border border-border rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full">
                <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-caption text-caption text-text-secondary uppercase tracking-wider mb-1">
                    {progress > 0 ? 'Resume Reading' : 'Start Reading'}
                  </span>
                  <h3 className="font-h2 text-h2 text-text-heading leading-tight truncate max-w-[200px]">
                    {resume.title}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="font-h2 text-h2 text-primary">{progress}%</p>
                  <p className="font-caption text-caption text-text-secondary">
                    {resume.wpm} WPM
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end mt-1">
                <span className="bg-primary text-on-primary-container px-6 py-2 rounded-full font-button text-button uppercase">
                  {progress > 0 ? 'Continue' : 'Begin'}
                </span>
              </div>
            </div>
          </section>
        )}

        <section className="mb-8 grid grid-cols-2 gap-3">
          <div className="bg-bg-secondary border border-border rounded-xl p-4 flex flex-col justify-between h-32">
            <Icon name="speed" className="text-primary" />
            <div>
              <p className="font-h1 text-h1 text-text-heading">{stats.avgWpm || '—'}</p>
              <p className="font-caption text-caption text-text-secondary">WPM AVG</p>
            </div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-xl p-4 flex flex-col justify-between h-32">
            <Icon name="timer" className="text-secondary" />
            <div>
              <p className="font-h1 text-h1 text-text-heading">{stats.readTimeMinutes}m</p>
              <p className="font-caption text-caption text-text-secondary">READ TIME</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-h2 text-h2 text-text-heading mb-4">Library</h2>
          <div className="grid grid-cols-1 gap-3">
            <ActionCard
              icon="upload_file"
              color="text-primary"
              title="Import Document"
              subtitle="PDF or paste text"
              onClick={() => navigate('/import')}
            />
            <ActionCard
              icon="auto_stories"
              color="text-secondary"
              title="Reading History"
              subtitle={`${stats.total} document${stats.total === 1 ? '' : 's'}`}
              onClick={() => navigate('/archive')}
            />
            <ActionCard
              icon="bolt"
              color="text-tertiary"
              title="Quick Drill"
              subtitle="Focus & peripheral vision"
              onClick={() => navigate('/drills')}
            />
          </div>
        </section>
      </main>

      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[100px]" />
      </div>

      <BottomNav />
    </div>
  )
}

function ActionCard({ icon, color, title, subtitle, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-bg-secondary hover:bg-bg-tertiary transition-colors border border-border rounded-xl p-5 flex items-center justify-between group cursor-pointer active:translate-y-[-2px]"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center ${color}`}>
          <Icon name={icon} />
        </div>
        <div>
          <p className="font-body text-body text-text-heading font-semibold">{title}</p>
          <p className="font-caption text-caption text-text-secondary">{subtitle}</p>
        </div>
      </div>
      <Icon name="chevron_right" className="text-text-secondary" />
    </div>
  )
}
