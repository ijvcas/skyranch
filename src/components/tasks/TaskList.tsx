import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, CheckCircle } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { format } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onComplete: (task: Partial<Task> & { id: string }) => void;
}

export function TaskList({ tasks, isLoading, onEdit, onDelete, onComplete }: TaskListProps) {
  const { t } = useTranslation('tasks');

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
    }
  };

  const handleComplete = (task: Task) => {
    onComplete({
      id: task.id,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('loading')}...</div>;
  }

  if (tasks.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        {t('noTasks')}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                <h3 className="font-semibold">{task.title}</h3>
                <Badge variant="outline">{t(`type.${task.type}`)}</Badge>
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {task.due_date && (
                  <span>Due: {format(new Date(task.due_date), 'PPP')}</span>
                )}
                <Badge>{t(task.status)}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {task.status !== 'completed' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleComplete(task)}
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(task.id)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}