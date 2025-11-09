import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTasks } from '@/hooks/useTasks';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskCreateDialog } from '@/components/tasks/TaskCreateDialog';
import { TaskStatus } from '@/stores/taskStore';

export default function Tasks() {
  const { tasks, isLoading } = useTasks();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');

  const filteredTasks = selectedStatus === 'all' 
    ? tasks 
    : tasks.filter(t => t.status === selectedStatus);

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage your farm tasks and activities</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setSelectedStatus(v as any)}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({inProgressTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No tasks yet. Create your first task!
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No pending tasks</div>
          ) : (
            <div className="grid gap-4">
              {pendingTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          {inProgressTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No tasks in progress</div>
          ) : (
            <div className="grid gap-4">
              {inProgressTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No completed tasks</div>
          ) : (
            <div className="grid gap-4">
              {completedTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TaskCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
