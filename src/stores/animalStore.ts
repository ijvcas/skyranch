import { create } from 'zustand';
import { getAllAnimals as fetchAllAnimals, getAnimal as fetchAnimal } from '@/services/animalService';

export interface Animal {
  id: string;
  name: string;
  tag: string;
  species: string;
  breed: string;
  birthDate: string;
  gender: string;
  weight: string;
  color: string;
  motherId: string;
  fatherId: string;
  maternalGrandmotherId?: string;
  maternalGrandfatherId?: string;
  paternalGrandmotherId?: string;
  paternalGrandfatherId?: string;
  maternalGreatGrandmotherMaternalId?: string;
  maternalGreatGrandfatherMaternalId?: string;
  maternalGreatGrandmotherPaternalId?: string;
  maternalGreatGrandfatherPaternalId?: string;
  paternalGreatGrandmotherMaternalId?: string;
  paternalGreatGrandfatherMaternalId?: string;
  paternalGreatGrandmotherPaternalId?: string;
  paternalGreatGrandfatherPaternalId?: string;
  // Generation 4 fields
  gen4PaternalGgggfP?: string;
  gen4PaternalGgggmP?: string;
  gen4PaternalGggmfP?: string;
  gen4PaternalGggmmP?: string;
  gen4PaternalGgfgfP?: string;
  gen4PaternalGgfgmP?: string;
  gen4PaternalGgmgfP?: string;
  gen4PaternalGgmgmP?: string;
  gen4MaternalGgggfM?: string;
  gen4MaternalGgggmM?: string;
  gen4MaternalGggmfM?: string;
  gen4MaternalGggmmM?: string;
  gen4MaternalGgfgfM?: string;
  gen4MaternalGgfgmM?: string;
  gen4MaternalGgmgfM?: string;
  gen4MaternalGgmgmM?: string;
  // Generation 5 fields
  gen5Paternal1?: string;
  gen5Paternal2?: string;
  gen5Paternal3?: string;
  gen5Paternal4?: string;
  gen5Paternal5?: string;
  gen5Paternal6?: string;
  gen5Paternal7?: string;
  gen5Paternal8?: string;
  gen5Paternal9?: string;
  gen5Paternal10?: string;
  gen5Paternal11?: string;
  gen5Paternal12?: string;
  gen5Paternal13?: string;
  gen5Paternal14?: string;
  gen5Paternal15?: string;
  gen5Paternal16?: string;
  gen5Maternal1?: string;
  gen5Maternal2?: string;
  gen5Maternal3?: string;
  gen5Maternal4?: string;
  gen5Maternal5?: string;
  gen5Maternal6?: string;
  gen5Maternal7?: string;
  gen5Maternal8?: string;
  gen5Maternal9?: string;
  gen5Maternal10?: string;
  gen5Maternal11?: string;
  gen5Maternal12?: string;
  gen5Maternal13?: string;
  gen5Maternal14?: string;
  gen5Maternal15?: string;
  gen5Maternal16?: string;
  healthStatus: string;
  notes: string;
  image: string | null;
  current_lot_id?: string;
  lifecycleStatus?: string;
  dateOfDeath?: string;
  causeOfDeath?: string;
}

interface AnimalStore {
  animals: Animal[];
  isLoading: boolean;
  addAnimal: (animal: Animal) => void;
  updateAnimal: (id: string, animal: Animal) => void;
  deleteAnimal: (id: string) => void;
  getAnimal: (id: string) => Animal | undefined;
  getAllAnimals: () => Animal[];
  loadAnimals: () => Promise<void>;
  setAnimals: (animals: Animal[]) => void;
}

export const useAnimalStore = create<AnimalStore>((set, get) => ({
  animals: [],
  isLoading: false,
  addAnimal: (animal) =>
    set((state) => ({ animals: [...state.animals, animal] })),
  updateAnimal: (id, updatedAnimal) =>
    set((state) => ({
      animals: state.animals.map((animal) =>
        animal.id === id ? updatedAnimal : animal
      ),
    })),
  deleteAnimal: (id) =>
    set((state) => ({
      animals: state.animals.filter((animal) => animal.id !== id),
    })),
  getAnimal: (id) => get().animals.find((animal) => animal.id === id),
  getAllAnimals: () => get().animals,
  loadAnimals: async () => {
    set({ isLoading: true });
    try {
      const animals = await fetchAllAnimals();
      set({ animals, isLoading: false });
    } catch (error) {
      console.error('Error loading animals:', error);
      set({ isLoading: false });
    }
  },
  setAnimals: (animals) => set({ animals }),
}));
