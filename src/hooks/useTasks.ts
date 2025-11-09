import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTaskStore, Task } from '@/stores/taskStore';
import { toast } from 'sonner';

export const useTasks = () => {
  const queryClient = useQueryClient();
  const { setTasks, addTask, updateTask: updateTaskStore, deleteTask: deleteTaskStore } = useTaskStore();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;
      const tasks = (data || []) as Task[];
      setTasks(tasks);
      return tasks;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newTask: Partial<Task>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...newTask, user_id: user.id } as any])
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: (data) => {
      addTask(data);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create task: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: (data) => {
      updateTaskStore(data.id, data);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update task: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      deleteTaskStore(id);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete task: ' + error.message);
    }
  });

  const completeTask = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await updateMutation.mutateAsync({
      id,
      updates: {
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: user.id
      }
    });
  };

  return {
    tasks: tasks || [],
    isLoading,
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    completeTask,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};
