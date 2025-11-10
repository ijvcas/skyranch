import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { useTasks } from '@/hooks/useTasks';

export default function Tasks() {
  const { t } = useTranslation('tasks');
  const { tasks, isLoading } = useTasks();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <Card className="p-8 text-center">Loading tasks...</Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Task Management System</h3>
        <p className="text-muted-foreground mb-4">
          Found {tasks.length} tasks in the database.
        </p>
        
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="p-4 border rounded-lg">
              <h4 className="font-medium">{task.title}</h4>
              <p className="text-sm text-muted-foreground">{task.description}</p>
              <div className="mt-2 flex gap-2">
                <span className="text-xs bg-primary/10 px-2 py-1 rounded">{task.status}</span>
                <span className="text-xs bg-secondary/10 px-2 py-1 rounded">{task.priority}</span>
              </div>
            </div>
          ))}
          
          {tasks.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No tasks yet. Database is ready!
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}