// Splits text into readable word tokens for RSVP presentation.
export function tokenize(text) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
}

// Optimal Recognition Point: index of the letter to align/highlight (pivot).
export function getPivotIndex(word) {
  const len = word.length
  if (len <= 1) return 0
  if (len <= 5) return 1
  if (len <= 9) return 2
  return 3
}

// Delay in ms for a word at a given WPM. Longer words get slightly more time.
export function delayForWord(word, wpm) {
  const base = 60000 / wpm
  let factor = 1
  if (word.length > 8) factor += 0.4
  if (/[.,!?;:]$/.test(word)) factor += 0.5
  return base * factor
}

// True if a word ends a clause/sentence (carries trailing punctuation).
export function endsWithPunctuation(word) {
  return /[.,!?;:]["')\]]*$/.test(word)
}

// Builds the next chunk of up to `size` words starting at `start`.
// When `breakOnPunctuation` is on, the chunk ends right after a word carrying
// clause/sentence punctuation so the following word starts a fresh chunk.
export function buildChunk(words, start, size, breakOnPunctuation) {
  const chunk = []
  for (let i = start; i < words.length && chunk.length < size; i++) {
    chunk.push(words[i])
    if (breakOnPunctuation && endsWithPunctuation(words[i])) break
  }
  return chunk
}

// Extra "breath" pause (ms) after a chunk that ends on punctuation.
export function punctuationPause(word, wpm) {
  if (!endsWithPunctuation(word)) return 0
  const base = 60000 / wpm
  // Sentence enders get a longer breath than clause separators.
  return /[.!?]["')\]]*$/.test(word) ? base * 0.9 : base * 0.4
}
