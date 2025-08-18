
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type FieldReport = Database['public']['Tables']['field_reports']['Row'] & {
  createdByName?: string;
};
export type FieldReportInsert = Database['public']['Tables']['field_reports']['Insert'];
export type FieldReportEntry = Database['public']['Tables']['field_report_entries']['Row'];
export type FieldReportEntryInsert = Database['public']['Tables']['field_report_entries']['Insert'];

export interface CreateFieldReportData {
  title: string;
  report_type: string;
  status?: string;
  location_coordinates?: string;
  weather_conditions?: string;
  temperature?: number;
  notes?: string;
  entries: Omit<FieldReportEntryInsert, 'field_report_id'>[];
}

export const fieldReportService = {
  async createFieldReport(data: CreateFieldReportData): Promise<FieldReport> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { entries, ...reportData } = data;

    // Create the field report
    const { data: report, error: reportError } = await supabase
      .from('field_reports')
      .insert({
        ...reportData,
        user_id: user.id,
      })
      .select()
      .single();

    if (reportError) throw reportError;

    // Create the entries
    if (entries.length > 0) {
      const { error: entriesError } = await supabase
        .from('field_report_entries')
        .insert(
          entries.map(entry => ({
            ...entry,
            field_report_id: report.id,
          }))
        );

      if (entriesError) throw entriesError;
    }

    return report;
  },

  async getFieldReports(): Promise<FieldReport[]> {
    const { data, error } = await supabase
      .from('field_reports')
      .select(`
        *,
        app_users (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(report => ({
      ...report,
      createdByName: (report.app_users as any)?.name
    }));
  },

  async getFieldReportWithEntries(reportId: string) {
    const { data: report, error: reportError } = await supabase
      .from('field_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError) throw reportError;

    const { data: entries, error: entriesError } = await supabase
      .from('field_report_entries')
      .select('*')
      .eq('field_report_id', reportId)
      .order('created_at');

    if (entriesError) throw entriesError;

    return {
      ...report,
      entries: entries || [],
    };
  },

  async updateFieldReportStatus(reportId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('field_reports')
      .update({ status })
      .eq('id', reportId);

    if (error) throw error;
  },
};
