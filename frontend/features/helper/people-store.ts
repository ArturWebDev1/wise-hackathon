import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Extra people Nikita protects. Local to this device: the server only knows Maria's household. */
export type ProtectedPerson = {
  id: string;
  name: string;
  relationship: string;
  limit: number;
  checkNew: boolean;
  invitedAt: number;
};

type PeopleState = {
  people: ProtectedPerson[];
  add: (person: Omit<ProtectedPerson, 'id' | 'invitedAt'>) => void;
  remove: (id: string) => void;
};

export const usePeople = create<PeopleState>()(
  persist(
    (set) => ({
      people: [],
      add: (person) =>
        set((s) => ({
          people: [...s.people, { ...person, id: `person-${Date.now()}`, invitedAt: Date.now() }],
        })),
      remove: (id) => set((s) => ({ people: s.people.filter((p) => p.id !== id) })),
    }),
    { name: 'wise-lite-people-v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
