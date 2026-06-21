import { useState } from 'react'
import TopAppBar from '../components/TopAppBar.jsx'
import BottomNav from '../components/BottomNav.jsx'
import Icon from '../components/Icon.jsx'
import SchultzTable from '../components/SchultzTable.jsx'
import RainingLetters from '../components/RainingLetters.jsx'

export default function Drills() {
  const [activeDrill, setActiveDrill] = useState(null)

  if (activeDrill === 'schultz') {
    return <SchultzTable onExit={() => setActiveDrill(null)} />
  }

  if (activeDrill === 'raining') {
    return <RainingLetters onExit={() => setActiveDrill(null)} />
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden max-w-max-width mx-auto bg-background">
      <TopAppBar title="Drills" />
      <main className="flex-1 overflow-y-auto pt-20 pb-24 px-padding-screen flex flex-col">
        <h2 className="font-h2 text-h2 text-text-heading mb-1">Training Drills</h2>
        <p className="font-body text-body text-text-secondary mb-6">
          Sharpen your focus and peripheral vision.
        </p>

        <button
          type="button"
          onClick={() => setActiveDrill('schultz')}
          className="bg-bg-secondary border border-border rounded-xl p-5 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-bg-tertiary border border-border rounded-full">
            <Icon name="grid_on" className="text-[24px] text-tertiary" />
          </div>
          <div className="flex-1">
            <p className="font-body text-body text-text-heading font-semibold">Schultz Table</p>
            <p className="font-caption text-caption text-text-secondary">
              Tap 1–25 in order while fixing your gaze on the center.
            </p>
          </div>
          <Icon name="chevron_right" className="text-[24px] text-text-secondary" />
        </button>

        <button
          type="button"
          onClick={() => setActiveDrill('raining')}
          className="mt-3 bg-bg-secondary border border-border rounded-xl p-5 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-bg-tertiary border border-border rounded-full">
            <Icon name="rainy" className="text-[24px] text-secondary" />
          </div>
          <div className="flex-1">
            <p className="font-body text-body text-text-heading font-semibold">Raining Letters</p>
            <p className="font-caption text-caption text-text-secondary">
              Fix your gaze on the center, tap the side where the target letter falls.
            </p>
          </div>
          <Icon name="chevron_right" className="text-[24px] text-text-secondary" />
        </button>
      </main>
      <BottomNav />
    </div>
  )
}
