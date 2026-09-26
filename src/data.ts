export type Appointment = {
  id: string
  pet: string
  initials: string
  breed: string
  owner: string
  date: string
  service: string
  history: string
  tone: string
}

export type Turn = { id: string; role: 'groomer' | 'assistant'; text: string }

export type Note = {
  appointmentId: string
  services: string
  details: string
  behavior: string
  ownerRequests: string
  handling: string
  nextVisit: string
  approvedAt?: string
}

export const appointments: Appointment[] = [
  {
    id: 'bella-0926', pet: 'Bella', initials: 'BE', breed: 'Golden Retriever',
    owner: 'Sarah M.', date: 'Sep 26, 2026', service: 'Bath, brush & nail trim',
    history: 'Previous visit: sensitive to loud dryers. This is historical context, not a new observation.',
    tone: 'peach',
  },
  {
    id: 'milo-0926', pet: 'Milo', initials: 'MI', breed: 'Miniature Schnauzer',
    owner: 'James R.', date: 'Sep 26, 2026', service: 'Full groom',
    history: 'Previous visit: owner preferred a shorter face trim.',
    tone: 'lavender',
  },
  {
    id: 'luna-0925', pet: 'Luna', initials: 'LU', breed: 'Cavapoo',
    owner: 'Emma K.', date: 'Sep 25, 2026', service: 'Bath & tidy',
    history: 'No previous grooming note available.',
    tone: 'mint',
  },
]

export const emptyNote = (appointmentId: string): Note => ({
  appointmentId, services: '', details: '', behavior: '',
  ownerRequests: '', handling: '', nextVisit: '',
})

const splitSentences = (value: string) =>
  value.split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter(Boolean)

// Conservative text-preview helper. It is deliberately not labeled as AI extraction.
export function draftFromTurns(appointmentId: string, turns: Turn[]): Note {
  const text = turns.filter((turn) => turn.role === 'groomer').map((turn) => turn.text).join(' ')
  const sentences = splitSentences(text)
  const correction = /(?:actually|correction|didn't|did not|no nail trim|not trim)/i.test(text)
  const services: string[] = []
  if (/\b(bath|bathed|washed)\b/i.test(text)) services.push('Bath')
  if (/\b(brush|brushed|brushing)\b/i.test(text)) services.push('Brushing')
  if (/\b(nail|nails)\b/i.test(text) && !correction) services.push('Nail trim')
  if (/\b(haircut|trimmed (?:the |his |her )?(?:coat|hair)|full groom)\b/i.test(text)) services.push('Haircut / trim')

  const observed = sentences.filter((s) => /pulled away|shook|trembled|barked|settled|relaxed/i.test(s))
  const handling = sentences.filter((s) => /lower setting|short break|slower|pause|towel|helped/i.test(s) && !/next (?:time|visit)/i.test(s))
  const requests = sentences.filter((s) => /owner (?:asked|requested|wanted)|client (?:asked|requested|wanted)/i.test(s))
  const future = sentences.filter((s) => /next (?:time|visit)|remember to|follow up/i.test(s))
  return {
    ...emptyNote(appointmentId),
    services: services.join(', '),
    behavior: observed.at(-1) ?? '',
    handling: handling.at(-1) ?? '',
    ownerRequests: requests.at(-1) ?? '',
    nextVisit: future.at(-1) ?? '',
  }
}
