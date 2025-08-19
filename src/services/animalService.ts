
// Re-export everything from the animal service modules for backward compatibility
export * from './animal/animalQueries';
export * from './animal/animalMutations';

// Specifically export the createAnimal function with the correct name
export { addAnimal as createAnimal } from './animal/animalMutations';
