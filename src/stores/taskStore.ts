import { create } from 'zustand';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'feeding' | 'health' | 'maintenance' | 'breeding' | 'custom';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  task_type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  assigned_to?: string;
  animal_ids?: string[];
  lot_id?: string;
  recurring: boolean;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  completed_at?: string;
  completed_by?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

interface TaskStore {
  tasks: Task[];
  filteredTasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  filterByStatus: (status?: TaskStatus) => void;
  filterByPriority: (priority?: TaskPriority) => void;
  filterByType: (type?: TaskType) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  filteredTasks: [],
  
  setTasks: (tasks) => set({ tasks, filteredTasks: tasks }),
  
  addTask: (task) => set((state) => ({
    tasks: [task, ...state.tasks],
    filteredTasks: [task, ...state.filteredTasks]
  })),
  
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
    filteredTasks: state.filteredTasks.map(t => t.id === id ? { ...t, ...updates } : t)
  })),
  
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter(t => t.id !== id),
    filteredTasks: state.filteredTasks.filter(t => t.id !== id)
  })),
  
  filterByStatus: (status) => set((state) => ({
    filteredTasks: status ? state.tasks.filter(t => t.status === status) : state.tasks
  })),
  
  filterByPriority: (priority) => set((state) => ({
    filteredTasks: priority ? state.tasks.filter(t => t.priority === priority) : state.tasks
  })),
  
  filterByType: (type) => set((state) => ({
    filteredTasks: type ? state.tasks.filter(t => t.task_type === type) : state.tasks
  }))
}));
