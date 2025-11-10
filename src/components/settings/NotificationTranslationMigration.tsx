import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Languages, Loader2, CheckCircle } from 'lucide-react';

export const NotificationTranslationMigration = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ updated: number; errors: number; total: number } | null>(null);

  const runMigration = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      console.log('🔄 [MIGRATION] Starting notification translation migration...');
      
      const { data, error } = await supabase.functions.invoke('migrate-notification-translations', {
        method: 'POST'
      });

      if (error) {
        throw error;
      }

      console.log('✅ [MIGRATION] Migration completed:', data);
      setResult(data);

      toast({
        title: t('common:success'),
        description: `${data.updated} notifications updated successfully`,
      });
    } catch (error: any) {
      console.error('❌ [MIGRATION] Error:', error);
      toast({
        title: t('common:error'),
        description: error.message || 'Failed to run migration',
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="w-5 h-5" />
          Notification Translation Migration
        </CardTitle>
        <CardDescription>
          Translate existing notifications to match user language preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">This will:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Review all existing notifications in the database</li>
            <li>Translate Spanish notifications to each user's preferred language</li>
            <li>Update notification titles and messages accordingly</li>
          </ul>
        </div>

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Migration Completed</span>
            </div>
            <div className="text-sm text-green-600 space-y-1">
              <p>Total notifications: {result.total}</p>
              <p>Successfully updated: {result.updated}</p>
              <p>Errors: {result.errors}</p>
            </div>
          </div>
        )}

        <Button 
          onClick={runMigration} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Migration...
            </>
          ) : (
            <>
              <Languages className="w-4 h-4 mr-2" />
              Run Translation Migration
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
