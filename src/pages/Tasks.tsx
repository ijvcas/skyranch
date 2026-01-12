import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTasks, type Task } from '@/hooks/useTasks';
import { Calendar, CheckCircle2, Clock, Plus, Pencil, Trash2 } from 'lucide-react';
import QuickLogDialog from '@/components/activities/QuickLogDialog';
import TaskDialog from '@/components/activities/TaskDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Tasks() {
  const { t } = useTranslation('tasks');
  const { tasks, isLoading, updateTask, deleteTask } = useTasks();
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const pendingTasks = tasks.filter(task => ['pending', 'in_progress'].includes(task.status));
  const completedTasks = tasks.filter(task => task.status === 'completed');

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = async (data: Partial<Task>) => {
    await updateTask(data as any);
    setEditingTask(undefined);
  };

  const handleDeleteTask = async () => {
    if (deletingTaskId) {
      await deleteTask(deletingTaskId);
      setDeletingTaskId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <Card className="p-8 text-center">{t('loading')}</Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-6 space-y-4 sm:space-y-6">
      <PageHeader 
        title={t('title')} 
        subtitle={t('subtitle')}
      >
        <Button variant="gradient" onClick={() => setIsQuickLogOpen(true)} className="whitespace-nowrap text-sm sm:text-base px-3 sm:px-4">
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          {t('fieldTask')}
        </Button>
      </PageHeader>
      
      <Tabs defaultValue="planning" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="planning" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t('planning')}
          </TabsTrigger>
          <TabsTrigger value="worklog" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {t('workLog')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planning" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {t('plannedTasks')} ({pendingTasks.length})
            </h3>
            
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <div key={task.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {t(task.status)}
                        </span>
                        <span className="text-xs bg-secondary/10 text-secondary-foreground px-2 py-1 rounded">
                          {t(`priority.${task.priority}`)}
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {t(`type.${task.task_type}`)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditTask(task)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeletingTaskId(task.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {pendingTasks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {t('noPendingTasks')}
                </p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="worklog" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {t('completedWork')} ({completedTasks.length})
            </h3>
            
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <div key={task.id} className="p-4 border rounded-lg bg-accent/20">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        {task.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      {task.completion_notes && (
                        <p className="text-sm mt-2 p-2 bg-muted rounded">
                          {task.completion_notes}
                        </p>
                      )}
                      {task.actual_completion_date && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {t('completedOn')}: {new Date(task.actual_completion_date).toLocaleDateString()}
                        </p>
                      )}
                      {task.weather_conditions && (
                        <p className="text-xs text-muted-foreground">
                          {t('weather')}: {task.weather_conditions} {task.temperature ? `• ${task.temperature}°C` : ''}
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-4">
                      {t(`type.${task.task_type}`)}
                    </span>
                  </div>
                </div>
              ))}
              
              {completedTasks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {t('noCompletedWork')}
                </p>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <QuickLogDialog open={isQuickLogOpen} onOpenChange={setIsQuickLogOpen} />
      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={(open) => {
          setIsTaskDialogOpen(open);
          if (!open) setEditingTask(undefined);
        }}
        task={editingTask}
        onSave={handleSaveTask}
      />
      <AlertDialog open={!!deletingTaskId} onOpenChange={() => setDeletingTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDelete', 'Are you sure you want to delete this task? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}