import { Clock, CheckCircle2, Circle, AlertCircle, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Task } from '@/stores/taskStore';
import { useTasks } from '@/hooks/useTasks';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { completeTask } = useTasks();

  const priorityColors = {
    low: 'bg-blue-500/10 text-blue-500',
    medium: 'bg-yellow-500/10 text-yellow-500',
    high: 'bg-orange-500/10 text-orange-500',
    urgent: 'bg-red-500/10 text-red-500'
  };

  const statusIcons = {
    pending: <Circle className="h-5 w-5 text-muted-foreground" />,
    in_progress: <Clock className="h-5 w-5 text-primary" />,
    completed: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    cancelled: <AlertCircle className="h-5 w-5 text-destructive" />
  };

  const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5">
            {statusIcons[task.status]}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge className={priorityColors[task.priority]}>
                {task.priority}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {task.task_type.replace('_', ' ')}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive">Overdue</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {format(new Date(task.due_date), 'MMM dd, yyyy')}
          </div>
          {task.assigned_to && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Assigned
            </div>
          )}
        </div>

        {task.status === 'pending' && (
          <Button 
            size="sm" 
            onClick={() => completeTask(task.id)}
          >
            Complete
          </Button>
        )}
      </div>
    </Card>
  );
}
