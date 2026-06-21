import { useState } from 'react'
import Icon from './Icon.jsx'

const WORDS_PER_PAGE = 250

// A lightweight page viewer over the extracted reading text. The reader can flip
// through "pages" and choose where speed reading should begin ("Start here").
export default function JumpToPages({ words, currentIndex = 0, onStartHere, onClose }) {
  const totalPages = Math.max(1, Math.ceil(words.length / WORDS_PER_PAGE))
  const [page, setPage] = useState(
    Math.min(totalPages - 1, Math.floor(currentIndex / WORDS_PER_PAGE)),
  )

  const startWordIndex = page * WORDS_PER_PAGE
  const pageWords = words.slice(startWordIndex, startWordIndex + WORDS_PER_PAGE)
  const pageText = pageWords.join(' ')
  const startPercent = words.length
    ? Math.round((startWordIndex / words.length) * 100)
    : 0
  const isCurrent =
    currentIndex >= startWordIndex && currentIndex < startWordIndex + WORDS_PER_PAGE

  const go = (delta) => {
    setPage((p) => Math.max(0, Math.min(totalPages - 1, p + delta)))
  }

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col max-w-max-width mx-auto left-1/2 -translate-x-1/2">
      {/* Header */}
      <header className="flex items-center justify-between h-14 px-padding-screen border-b border-border flex-shrink-0">
        <button
          onClick={onClose}
          aria-label="Close page viewer"
          className="flex items-center justify-center w-10 h-10 -ml-2 text-primary active:scale-95"
        >
          <Icon name="close" />
        </button>
        <h2 className="font-h2 text-h2 text-text-heading">Jump to page</h2>
        <span className="w-10" />
      </header>

      {/* Page content */}
      <div className="flex-grow overflow-y-auto px-padding-screen py-6">
        <div className="bg-bg-secondary border border-border rounded-xl p-6 min-h-full">
          {pageText ? (
            <p className="font-body text-body text-text-primary leading-relaxed whitespace-pre-wrap">
              {pageText}
            </p>
          ) : (
            <p className="font-body text-body text-text-secondary text-center pt-12">
              This page is empty.
            </p>
          )}
        </div>
      </div>

      {/* Footer controls */}
      <footer className="flex-shrink-0 border-t border-border px-padding-screen pt-3 pb-8 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => go(-1)}
            disabled={page === 0}
            aria-label="Previous page"
            className="w-11 h-11 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-primary active:scale-95 disabled:opacity-30"
          >
            <Icon name="chevron_left" />
          </button>

          <div className="text-center">
            <p className="font-button text-button text-text-heading">
              Page {page + 1}{' '}
              <span className="text-text-secondary font-normal">/ {totalPages}</span>
            </p>
            <p className="font-caption text-caption text-text-secondary">
              {isCurrent ? 'You are here' : `~${startPercent}% in`}
            </p>
          </div>

          <button
            onClick={() => go(1)}
            disabled={page === totalPages - 1}
            aria-label="Next page"
            className="w-11 h-11 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-primary active:scale-95 disabled:opacity-30"
          >
            <Icon name="chevron_right" />
          </button>
        </div>

        <button
          onClick={() => onStartHere(startWordIndex)}
          className="w-full h-14 bg-primary text-on-primary font-button text-button uppercase rounded-xl transition-all duration-200 active:translate-y-1 flex items-center justify-center gap-2 group"
        >
          Start here
          <Icon name="play_arrow" className="text-[20px]" fill />
        </button>
      </footer>
    </div>
  )
}
