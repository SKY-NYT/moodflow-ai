import type { JournalEntry } from '../../types/journal'
import { moodScore } from '../../lib/utils'

export function filterAndSortEntries(
  entries: JournalEntry[],
  search: string,
  selectedMood: string,
  sortOrder: string,
) {
  const normalizedSearch = search.trim().toLowerCase()

  const filtered = entries.filter((entry) => {
    const matchesMood = selectedMood === 'All' || entry.mood === selectedMood
    const haystack = `${entry.title} ${entry.note} ${entry.tags.join(' ')}`.toLowerCase()
    const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch)
    return matchesMood && matchesSearch
  })

  return [...filtered].sort((a, b) => {
    switch (sortOrder) {
      case 'oldest':
        return +new Date(a.createdAt) - +new Date(b.createdAt)
      case 'mood':
        return moodScore(b.mood) - moodScore(a.mood)
      case 'energy':
        return b.energy - a.energy
      case 'newest':
      default:
        return +new Date(b.createdAt) - +new Date(a.createdAt)
    }
  })
}
