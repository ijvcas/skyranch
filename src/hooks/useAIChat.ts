import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  role: 'user' | 'assistant' | 'system';
  metadata: any;
  created_at: string;
}

export const useAIChat = () => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (error) throw error;
      return data as ChatMessage[];
    },
  });

  const sendMessage = async (message: string, file?: File) => {
    try {
      setIsLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Save user message to history
      const { data: userMessage, error: saveError } = await supabase
        .from('chat_history')
        .insert([{
          user_id: user.id,
          message,
          role: 'user',
          metadata: {},
        }])
        .select()
        .single();

      if (saveError) throw saveError;

      // Invalidate to show user message immediately
      queryClient.invalidateQueries({ queryKey: ['chat-history'] });

      // Call AI edge function
      console.log('🚀 Calling AI chat function...');
      
      let aiResponse, aiError;
      
      if (file) {
        // If file is provided, use multipart/form-data
        const formData = new FormData();
        formData.append('message', message);
        formData.append('file', file);
        formData.append('fileType', file.type);

        const response = await supabase.functions.invoke('ai-chat', {
          body: formData,
        });
        
        aiResponse = response.data;
        aiError = response.error;
      } else {
        // Regular JSON request
        const response = await supabase.functions.invoke('ai-chat', {
          body: { message },
        });
        
        aiResponse = response.data;
        aiError = response.error;
      }

      console.log('AI Response:', aiResponse);
      console.log('AI Error:', aiError);

      if (aiError) {
        console.error('Edge function error:', aiError);
        throw new Error(aiError.message || 'Error al llamar al servicio de IA');
      }

      if (aiResponse?.error) {
        throw new Error(aiResponse.error);
      }

      // Save assistant response to history
      const { error: assistantError } = await supabase
        .from('chat_history')
        .insert([{
          user_id: user.id,
          message: aiResponse.response,
          role: 'assistant',
          metadata: aiResponse.metadata || {},
        }]);

      if (assistantError) throw assistantError;

      // Refresh chat history
      queryClient.invalidateQueries({ queryKey: ['chat-history'] });

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo enviar el mensaje',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['chat-history'] });
      
      toast({
        title: 'Historial borrado',
        description: 'Se ha eliminado el historial de chat',
      });
    } catch (error: any) {
      console.error('Error clearing history:', error);
      toast({
        title: 'Error',
        description: 'No se pudo borrar el historial',
        variant: 'destructive',
      });
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearHistory,
  };
};
