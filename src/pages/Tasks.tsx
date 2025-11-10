import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTasks } from '@/hooks/useTasks';
import { Calendar, CheckCircle2, Clock, Plus } from 'lucide-react';
import QuickLogDialog from '@/components/activities/QuickLogDialog';

export default function Tasks() {
  const { t } = useTranslation('tasks');
  const { tasks, isLoading } = useTasks();
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);

  const pendingTasks = tasks.filter(task => ['pending', 'in_progress'].includes(task.status));
  const completedTasks = tasks.filter(task => task.status === 'completed');

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <Card className="p-8 text-center">Loading activities...</Card>
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
          {t('quickLog')}
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
              Planned Tasks ({pendingTasks.length})
            </h3>
            
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <div key={task.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded whitespace-nowrap">
                        {task.status}
                      </span>
                      <span className="text-xs bg-secondary/10 text-secondary-foreground px-2 py-1 rounded whitespace-nowrap">
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {pendingTasks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No pending tasks. Create one to get started!
                </p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="worklog" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Completed Work ({completedTasks.length})
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
                          Completed: {new Date(task.actual_completion_date).toLocaleDateString()}
                        </p>
                      )}
                      {task.weather_conditions && (
                        <p className="text-xs text-muted-foreground">
                          Weather: {task.weather_conditions} {task.temperature ? `• ${task.temperature}°C` : ''}
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-4">
                      {task.type}
                    </span>
                  </div>
                </div>
              ))}
              
              {completedTasks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No completed work yet. Use Quick Log to document your work!
                </p>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <QuickLogDialog open={isQuickLogOpen} onOpenChange={setIsQuickLogOpen} />
    </div>
  );
}