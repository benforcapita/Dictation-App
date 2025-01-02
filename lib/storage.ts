import { Note } from './types';

const STORAGE_KEY = 'dictation-notes';

export const loadNotes = (): Note[] => {
  if (typeof window === 'undefined') return [];
  const savedNotes = localStorage.getItem(STORAGE_KEY);
  return savedNotes ? JSON.parse(savedNotes) : [];
};

export const saveNotes = (notes: Note[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
};

export const clearNotes = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};