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
  maternal_grandmother_id?: string;
  maternal_grandfather_id?: string;
  paternal_grandmother_id?: string;
  paternal_grandfather_id?: string;
  maternal_great_grandmother_maternal_id?: string;
  maternal_great_grandfather_maternal_id?: string;
  maternal_great_grandmother_paternal_id?: string;
  maternal_great_grandfather_paternal_id?: string;
  paternal_great_grandmother_maternal_id?: string;
  paternal_great_grandfather_maternal_id?: string;
  paternal_great_grandmother_paternal_id?: string;
  paternal_great_grandfather_paternal_id?: string;
  // Generation 4 fields
  gen4_paternal_ggggf_p?: string;
  gen4_paternal_ggggm_p?: string;
  gen4_paternal_gggmf_p?: string;
  gen4_paternal_gggmm_p?: string;
  gen4_paternal_ggfgf_p?: string;
  gen4_paternal_ggfgm_p?: string;
  gen4_paternal_ggmgf_p?: string;
  gen4_paternal_ggmgm_p?: string;
  gen4_maternal_ggggf_m?: string;
  gen4_maternal_ggggm_m?: string;
  gen4_maternal_gggmf_m?: string;
  gen4_maternal_gggmm_m?: string;
  gen4_maternal_ggfgf_m?: string;
  gen4_maternal_ggfgm_m?: string;
  gen4_maternal_ggmgf_m?: string;
  gen4_maternal_ggmgm_m?: string;
  // Generation 5 fields
  gen5_paternal_1?: string;
  gen5_paternal_2?: string;
  gen5_paternal_3?: string;
  gen5_paternal_4?: string;
  gen5_paternal_5?: string;
  gen5_paternal_6?: string;
  gen5_paternal_7?: string;
  gen5_paternal_8?: string;
  gen5_paternal_9?: string;
  gen5_paternal_10?: string;
  gen5_paternal_11?: string;
  gen5_paternal_12?: string;
  gen5_paternal_13?: string;
  gen5_paternal_14?: string;
  gen5_paternal_15?: string;
  gen5_paternal_16?: string;
  gen5_maternal_1?: string;
  gen5_maternal_2?: string;
  gen5_maternal_3?: string;
  gen5_maternal_4?: string;
  gen5_maternal_5?: string;
  gen5_maternal_6?: string;
  gen5_maternal_7?: string;
  gen5_maternal_8?: string;
  gen5_maternal_9?: string;
  gen5_maternal_10?: string;
  gen5_maternal_11?: string;
  gen5_maternal_12?: string;
  gen5_maternal_13?: string;
  gen5_maternal_14?: string;
  gen5_maternal_15?: string;
  gen5_maternal_16?: string;
  pedigree_max_generation?: number;
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
