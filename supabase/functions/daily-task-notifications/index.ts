import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Task {
  id: string;
  title: string;
  description?: string;
  task_type: string;
  priority: string;
  status: string;
  due_date?: string;
  assigned_to?: string;
  user_id: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  preferred_language?: string;
}

const translations: Record<string, Record<string, string>> = {
  en: {
    overdue_title: "Overdue Task",
    overdue_message: "Task '{title}' was due on {dueDate} and is still pending",
    today_title: "Task Due Today",
    today_message: "Task '{title}' is due today",
    reminder_title: "Task Reminder",
    reminder_message: "Task '{title}' is assigned to you and still pending",
  },
  es: {
    overdue_title: "Tarea Atrasada",
    overdue_message: "La tarea '{title}' venció el {dueDate} y sigue pendiente",
    today_title: "Tarea para Hoy",
    today_message: "La tarea '{title}' vence hoy",
    reminder_title: "Recordatorio de Tarea",
    reminder_message: "La tarea '{title}' está asignada a ti y sigue pendiente",
  },
  pt: {
    overdue_title: "Tarefa Atrasada",
    overdue_message: "A tarefa '{title}' venceu em {dueDate} e ainda está pendente",
    today_title: "Tarefa para Hoje",
    today_message: "A tarefa '{title}' vence hoje",
    reminder_title: "Lembrete de Tarefa",
    reminder_message: "A tarefa '{title}' está atribuída a você e ainda está pendente",
  },
  fr: {
    overdue_title: "Tâche en retard",
    overdue_message: "La tâche '{title}' était due le {dueDate} et est toujours en attente",
    today_title: "Tâche pour aujourd'hui",
    today_message: "La tâche '{title}' est due aujourd'hui",
    reminder_title: "Rappel de tâche",
    reminder_message: "La tâche '{title}' vous est assignée et est toujours en attente",
  },
};

function t(key: string, lang: string, vars?: Record<string, string>): string {
  const langTranslations = translations[lang] || translations.es;
  let text = langTranslations[key] || translations.es[key] || key;
  
  if (vars) {
    Object.entries(vars).forEach(([varKey, value]) => {
      text = text.replace(`{${varKey}}`, value);
    });
  }
  
  return text;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('🔄 Starting daily task notifications check...');

    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    console.log(`📅 Today: ${todayString}`);

    // Get all pending/in_progress tasks that have a due date
    const { data: pendingTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true });

    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError);
      throw tasksError;
    }

    console.log(`🔍 Found ${pendingTasks?.length || 0} pending tasks with due dates`);

    if (!pendingTasks || pendingTasks.length === 0) {
      console.log('📋 No pending tasks requiring notifications');
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending tasks requiring notifications',
        tasksChecked: 0,
        notificationsSent: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all active users
    const { data: users, error: usersError } = await supabase
      .from('app_users')
      .select('id, name, email, preferred_language')
      .eq('is_active', true);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      throw usersError;
    }

    const userMap: Record<string, User> = {};
    (users || []).forEach((user: User) => {
      userMap[user.id] = user;
    });

    console.log(`👥 Found ${users?.length || 0} active users`);

    let notificationsSent = 0;
    let notificationsFailed = 0;

    for (const task of pendingTasks) {
      // Determine who should receive the notification
      const recipientId = task.assigned_to || task.user_id;
      const recipient = userMap[recipientId];
      
      if (!recipient) {
        console.log(`⚠️ No recipient found for task ${task.id}`);
        continue;
      }

      const lang = recipient.preferred_language || 'es';
      const dueDate = new Date(task.due_date);
      const dueDateString = dueDate.toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : lang === 'fr' ? 'fr-FR' : 'es-ES');
      
      let notificationType: 'overdue' | 'today' | 'reminder';
      let title: string;
      let message: string;

      if (dueDate < today) {
        // Overdue task
        notificationType = 'overdue';
        title = t('overdue_title', lang);
        message = t('overdue_message', lang, { title: task.title, dueDate: dueDateString });
      } else if (dueDate.toISOString().split('T')[0] === todayString) {
        // Due today
        notificationType = 'today';
        title = t('today_title', lang);
        message = t('today_message', lang, { title: task.title });
      } else {
        // Future task - still send reminder if assigned
        notificationType = 'reminder';
        title = t('reminder_title', lang);
        message = t('reminder_message', lang, { title: task.title });
      }

      // Check if notification was already sent today
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', recipientId)
        .eq('type', 'task_reminder')
        .gte('created_at', todayString)
        .ilike('message', `%${task.title}%`)
        .limit(1);

      if (existingNotification && existingNotification.length > 0) {
        console.log(`⏭️ Notification already sent today for task ${task.id} to user ${recipientId}`);
        continue;
      }

      // Create notification in database
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          title: title,
          message: message,
          type: 'task_reminder',
          priority: task.priority === 'urgent' ? 'high' : task.priority === 'high' ? 'high' : 'medium',
          read: false,
          action_required: true,
          metadata: {
            task_id: task.id,
            task_type: task.task_type,
            due_date: task.due_date,
            notification_type: notificationType,
          },
        });

      if (notificationError) {
        console.error(`❌ Error creating notification for task ${task.id}:`, notificationError);
        notificationsFailed++;
      } else {
        console.log(`✅ Notification created for task "${task.title}" to ${recipient.name}`);
        notificationsSent++;
      }
    }

    console.log(`📊 Summary: ${notificationsSent} sent, ${notificationsFailed} failed`);

    return new Response(JSON.stringify({
      success: true,
      tasksChecked: pendingTasks.length,
      notificationsSent,
      notificationsFailed,
      date: todayString,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Error in daily task notifications:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
