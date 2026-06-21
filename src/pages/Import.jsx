import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../components/TopAppBar.jsx'
import Icon from '../components/Icon.jsx'
import { extractPdfText } from '../lib/pdf.js'

export default function Import() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('upload')
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef(null)

  const ready = text.trim().length > 0 && !loading

  const handleFile = async (file) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Please choose a PDF file.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const extracted = await extractPdfText(file)
      if (!extracted) {
        setError('No selectable text found in this PDF.')
      } else {
        setText(extracted)
        setTitle(file.name.replace(/\.pdf$/i, ''))
      }
    } catch (e) {
      console.error(e)
      setError('Could not read this PDF.')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (!ready) return
    const payload = {
      title: title || (tab === 'paste' ? 'Pasted Text' : 'Document'),
      text,
    }
    sessionStorage.setItem('velocity.pending', JSON.stringify(payload))
    navigate('/purpose')
  }

  return (
    <div className="relative h-dvh max-w-max-width mx-auto flex flex-col bg-background overflow-hidden">
      <TopAppBar title="Velocity" showBack />

      <main className="flex-grow pt-20 pb-28 px-padding-screen flex flex-col">
        <div className="mb-8">
          <h2 className="font-h1 text-h1 text-text-heading">Choose Your Material</h2>
        </div>

        <div className="flex p-1 bg-bg-secondary rounded-lg mb-8 border border-border">
          <button
            onClick={() => setTab('upload')}
            className={`flex-1 py-2 text-center font-button text-button rounded-md transition-all duration-200 ${
              tab === 'upload' ? 'bg-bg-tertiary text-primary' : 'text-text-secondary hover:text-primary'
            }`}
          >
            Upload PDF
          </button>
          <button
            onClick={() => setTab('paste')}
            className={`flex-1 py-2 text-center font-button text-button rounded-md transition-all duration-200 ${
              tab === 'paste' ? 'bg-bg-tertiary text-primary' : 'text-text-secondary hover:text-primary'
            }`}
          >
            Paste Text
          </button>
        </div>

        {tab === 'upload' ? (
          <div className="flex-grow flex flex-col">
            <div
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                handleFile(e.dataTransfer.files?.[0])
              }}
              className="flex-grow flex flex-col items-center justify-center border-[1.5px] border-dashed border-border bg-bg-secondary rounded-xl cursor-pointer hover:bg-bg-tertiary transition-colors group min-h-[260px]"
            >
              <div className="w-full flex flex-col items-center text-center px-8">
                <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-bg-tertiary border border-border group-hover:border-primary transition-colors">
                  <Icon
                    name={loading ? 'hourglass_top' : text ? 'description' : 'cloud_upload'}
                    className="text-[48px] text-text-secondary group-hover:text-primary transition-colors"
                  />
                </div>
                <p className="font-h2 text-h2 text-text-heading mb-2 max-w-full break-words line-clamp-3">
                  {loading ? 'Reading PDF…' : text ? title : 'Tap to upload a PDF'}
                </p>
                <p className="font-caption text-caption text-text-secondary">
                  {text ? `${text.trim().split(/\s+/).length} words extracted` : 'PDF with selectable text'}
                </p>
              </div>
              <input
                ref={fileInput}
                accept=".pdf"
                className="hidden"
                type="file"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full p-3 bg-bg-secondary border border-border rounded-lg font-body text-body text-text-primary focus:border-primary focus:ring-0 outline-none"
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full flex-grow min-h-[220px] p-4 bg-bg-secondary border border-border rounded-xl font-body text-body text-text-primary focus:border-primary focus:ring-0 outline-none resize-none custom-scrollbar"
              placeholder="Paste your text here to begin speed reading..."
            />
          </div>
        )}

        {error && <p className="mt-4 font-caption text-caption text-error">{error}</p>}
      </main>

      <footer className="fixed bottom-0 w-full z-40 max-w-max-width left-1/2 -translate-x-1/2 p-padding-screen bg-background/90 backdrop-blur-sm">
        <button
          onClick={handleNext}
          disabled={!ready}
          className={`w-full py-4 bg-primary text-on-primary font-button text-button uppercase tracking-widest rounded-lg transition-all duration-300 active:scale-[0.98] ${
            ready ? 'opacity-100' : 'opacity-40 cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </footer>
    </div>
  )
}
