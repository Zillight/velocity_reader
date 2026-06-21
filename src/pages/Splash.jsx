import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'

export default function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => navigate('/home'), 2200)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <main className="relative w-full max-w-max-width mx-auto h-screen flex flex-col items-center justify-center px-padding-screen overflow-hidden">
      <div className="flex flex-col items-center space-y-6 fade-in-up">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-primary/20 rounded-xl rotate-45" />
          <Icon
            name="bolt"
            className="text-[64px] text-primary"
            style={{ fontVariationSettings: "'wght' 700, 'FILL' 0" }}
          />
        </div>
        <div className="text-center space-y-2">
          <h1 className="font-h1 text-h1 text-text-heading tracking-tight">Velocity Reader</h1>
          <p className="font-caption text-caption text-text-secondary tracking-wide uppercase">
            Read faster. Remember more.
          </p>
        </div>
      </div>

      <div className="absolute -z-10 w-64 h-64 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute bottom-16 w-32 h-[1.5px] bg-bg-tertiary overflow-hidden rounded-full">
        <div className="h-full bg-primary animate-progress-infinite" />
      </div>
    </main>
  )
}
