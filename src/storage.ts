import type { Note } from './data'

const KEY = 'groomnote-demo-records-v1'

export function readRecords(): Record<string, Note> {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return typeof value === 'object' && value !== null ? value : {}
  } catch {
    return {}
  }
}

export function saveRecord(note: Note): Record<string, Note> {
  const records = { ...readRecords(), [note.appointmentId]: note }
  localStorage.setItem(KEY, JSON.stringify(records))
  return records
}
