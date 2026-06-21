import { Routes, Route } from 'react-router-dom'
import Splash from './pages/Splash.jsx'
import Home from './pages/Home.jsx'
import Import from './pages/Import.jsx'
import Purpose from './pages/Purpose.jsx'
import Reader from './pages/Reader.jsx'
import Archive from './pages/Archive.jsx'
import Drills from './pages/Drills.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/home" element={<Home />} />
      <Route path="/import" element={<Import />} />
      <Route path="/purpose" element={<Purpose />} />
      <Route path="/read" element={<Reader />} />
      <Route path="/archive" element={<Archive />} />
      <Route path="/drills" element={<Drills />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  )
}
