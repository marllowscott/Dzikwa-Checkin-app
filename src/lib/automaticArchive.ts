import { supabase } from './supabase';
import { useToast } from '@/hooks/use-toast';

export interface ArchiveResult {
  success: boolean;
  error?: string;
  archivedRecord?: any;
}

/**
 * Automatic archival system for completed check-out records
 * Archives records immediately on checkout to domain-specific storage
 */
export class AutomaticArchive {
  private toast: any;

  constructor(toast: any) {
    this.toast = toast;
  }

  /**
   * Archive employee record on checkout
   */
  async archiveEmployeeRecord(employeeId: string): Promise<ArchiveResult> {
    try {
      console.log('🗄️ Archiving employee record:', employeeId);

      // 1. Get the most recent check-in record (regardless of checkout status)
      const { data: checkInRecord, error: fetchError } = await supabase
        .from('check_ins')
        .select(`
          *,
          employees!inner(full_name, email, department)
        `)
        .eq('employee_id', employeeId)
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !checkInRecord) {
        throw new Error('Employee check-in record not found');
      }

      // Skip if already checked out and archived
      if ('check_out_time' in checkInRecord && checkInRecord.check_out_time) {
        console.log('ℹ️ Employee record already checked out, skipping archive');
        return {
          success: true,
          archivedRecord: checkInRecord
        };
      }

      // 2. Finalize checkout time if not already set
      const checkoutTime = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('check_ins')
        .update({ check_out_time: checkoutTime })
        .eq('id', checkInRecord.id);

      if (updateError) {
        throw new Error(`Failed to update checkout time: ${updateError.message}`);
      }

      // 3. Prepare archival data
      const logData = [{
        ...checkInRecord,
        check_out_time: checkoutTime,
        duration: this.calculateDuration(checkInRecord.check_in_time, checkoutTime)
      }];

      const archivalData = {
        date: new Date().toISOString().split('T')[0],
        month: new Date().toISOString().slice(0, 7), // YYYY-MM
        total_records: 1,
        log_data: logData,
        json_content: JSON.stringify(logData, null, 2),
        csv_content: this.convertToCSV(logData),
        summary_content: `Employee: ${checkInRecord.employees?.full_name || 'Unknown'}\nCheck-in: ${new Date(checkInRecord.check_in_time).toLocaleString()}\nCheck-out: ${new Date(checkoutTime).toLocaleString()}\nDuration: ${this.calculateDuration(checkInRecord.check_in_time, checkoutTime)}`,
        saved_by: 'automatic'
      };

      // 4. Archive to saved_logs table
      const { error: archiveError } = await supabase
        .from('saved_logs')
        .insert(archivalData);

      if (archiveError) {
        throw new Error(`Failed to archive record: ${archiveError.message}`);
      }

      // 5. Remove from active check_ins (optional - could keep for audit)
      // For now, we'll keep the record with checkout_time marked

      console.log('✅ Employee record archived successfully');

      return {
        success: true,
        archivedRecord: archivalData.log_data[0]
      };

    } catch (error: any) {
      console.error('❌ Failed to archive employee record:', error);
      this.toast({
        title: "Archive Error",
        description: `Failed to archive employee record: ${error.message}`,
        variant: "destructive"
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Archive guest record on checkout
   */
  async archiveGuestRecord(checkInId: string): Promise<ArchiveResult> {
    try {
      console.log('🗄️ Archiving guest record:', checkInId);

      // 1. Get complete guest check-in record
      const { data: checkInRecord, error: fetchError } = await supabase
        .from('guest_check_ins')
        .select(`
          *,
          guests!inner(full_name, email, phone, company)
        `)
        .eq('id', checkInId)
        .single();

      if (fetchError || !checkInRecord) {
        throw new Error('Guest check-in record not found');
      }

      // 2. Finalize checkout time
      const checkoutTime = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('guest_check_ins')
        .update({ check_out_time: checkoutTime })
        .eq('id', checkInId);

      if (updateError) {
        throw new Error(`Failed to update checkout time: ${updateError.message}`);
      }

      // 3. Prepare archival data
      const logData = [{
        ...checkInRecord,
        check_out_time: checkoutTime,
        duration: this.calculateDuration(checkInRecord.check_in_time, checkoutTime)
      }];

      const archivalData = {
        date: new Date().toISOString().split('T')[0],
        month: new Date().toISOString().slice(0, 7), // YYYY-MM
        total_records: 1,
        log_data: logData,
        json_content: JSON.stringify(logData, null, 2),
        csv_content: this.convertToCSV(logData),
        summary_content: `Guest: ${checkInRecord.guests?.full_name || 'Unknown'}\nCompany: ${checkInRecord.guests?.company || 'N/A'}\nCheck-in: ${new Date(checkInRecord.check_in_time).toLocaleString()}\nCheck-out: ${new Date(checkoutTime).toLocaleString()}\nDuration: ${this.calculateDuration(checkInRecord.check_in_time, checkoutTime)}`,
        saved_by: 'automatic'
      };

      // 4. Archive to saved_guest_logs table
      const { error: archiveError } = await supabase
        .from('saved_guest_logs')
        .insert(archivalData);

      if (archiveError) {
        throw new Error(`Failed to archive record: ${archiveError.message}`);
      }

      console.log('✅ Guest record archived successfully');

      return {
        success: true,
        archivedRecord: archivalData.log_data[0]
      };

    } catch (error: any) {
      console.error('❌ Failed to archive guest record:', error);
      this.toast({
        title: "Archive Error",
        description: `Failed to archive guest record: ${error.message}`,
        variant: "destructive"
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Archive workshop record on checkout
   */
  async archiveWorkshopRecord(checkInId: string): Promise<ArchiveResult> {
    try {
      console.log('🗄️ Archiving workshop record:', checkInId);

      // 1. Get complete workshop check-in record
      const { data: checkInRecord, error: fetchError } = await supabase
        .from('workshop_check_ins')
        .select(`
          *,
          workshop_guests!inner(full_name, email, phone, company, workshop_type)
        `)
        .eq('id', checkInId)
        .single();

      if (fetchError || !checkInRecord) {
        throw new Error('Workshop check-in record not found');
      }

      // 2. Finalize checkout time
      const checkoutTime = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('workshop_check_ins')
        .update({ check_out_time: checkoutTime })
        .eq('id', checkInId);

      if (updateError) {
        throw new Error(`Failed to update checkout time: ${updateError.message}`);
      }

      // 3. Prepare archival data
      const logData = [{
        ...checkInRecord,
        check_out_time: checkoutTime,
        duration: this.calculateDuration(checkInRecord.check_in_time, checkoutTime)
      }];

      const archivalData = {
        date: new Date().toISOString().split('T')[0],
        month: new Date().toISOString().slice(0, 7), // YYYY-MM
        total_records: 1,
        log_data: logData,
        json_content: JSON.stringify(logData, null, 2),
        csv_content: this.convertToCSV(logData),
        summary_content: `Workshop Guest: ${checkInRecord.workshop_guests?.full_name || 'Unknown'}\nWorkshop: ${checkInRecord.workshop_type || 'Standard'}\nCheck-in: ${new Date(checkInRecord.check_in_time).toLocaleString()}\nCheck-out: ${new Date(checkoutTime).toLocaleString()}\nDuration: ${this.calculateDuration(checkInRecord.check_in_time, checkoutTime)}`,
        saved_by: 'automatic'
      };

      // 4. Archive to workshop_saved_logs table
      const { error: archiveError } = await supabase
        .from('workshop_saved_logs')
        .insert(archivalData);

      if (archiveError) {
        throw new Error(`Failed to archive record: ${archiveError.message}`);
      }

      console.log('✅ Workshop record archived successfully');

      return {
        success: true,
        archivedRecord: archivalData.log_data[0]
      };

    } catch (error: any) {
      console.error('❌ Failed to archive workshop record:', error);
      this.toast({
        title: "Archive Error",
        description: `Failed to archive workshop record: ${error.message}`,
        variant: "destructive"
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Archive child record on checkout
   */
  async archiveChildRecord(checkInId: string): Promise<ArchiveResult> {
    try {
      console.log('🗄️ Archiving child record:', checkInId);

      // 1. Get complete child check-in record
      const { data: checkInRecord, error: fetchError } = await supabase
        .from('child_check_ins')
        .select(`
          *,
          dzikwa_children!inner(full_name, parent_name, grade)
        `)
        .eq('id', checkInId)
        .single();

      if (fetchError || !checkInRecord) {
        throw new Error('Child check-in record not found');
      }

      // 2. Finalize checkout time
      const checkoutTime = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('child_check_ins')
        .update({ check_out_time: checkoutTime })
        .eq('id', checkInId);

      if (updateError) {
        throw new Error(`Failed to update checkout time: ${updateError.message}`);
      }

      // 3. Prepare archival data
      const logData = [{
        ...checkInRecord,
        check_out_time: checkoutTime,
        duration: this.calculateDuration(checkInRecord.check_in_time, checkoutTime)
      }];

      const archivalData = {
        date: new Date().toISOString().split('T')[0],
        month: new Date().toISOString().slice(0, 7), // YYYY-MM
        total_records: 1,
        log_data: logData,
        json_content: JSON.stringify(logData, null, 2),
        csv_content: this.convertToCSV(logData),
        summary_content: `Child: ${checkInRecord.dzikwa_children?.full_name || 'Unknown'}\nParent: ${checkInRecord.dzikwa_children?.parent_name || 'N/A'}\nGrade: ${checkInRecord.dzikwa_children?.grade || 'N/A'}\nCheck-in: ${new Date(checkInRecord.check_in_time).toLocaleString()}\nCheck-out: ${new Date(checkoutTime).toLocaleString()}\nDuration: ${this.calculateDuration(checkInRecord.check_in_time, checkoutTime)}`,
        saved_by: 'automatic'
      };

      // 4. Archive to saved_child_logs table (create if doesn't exist)
      const { error: archiveError } = await supabase
        .from('saved_child_logs')
        .insert(archivalData);

      if (archiveError) {
        // If table doesn't exist, create it automatically
        if (archiveError.code === 'PGRST116') {
          await this.createChildArchiveTable();
          // Retry archival
          const { error: retryError } = await supabase
            .from('saved_child_logs')
            .insert(archivalData);

          if (retryError) {
            throw new Error(`Failed to archive record after table creation: ${retryError.message}`);
          }
        } else {
          throw new Error(`Failed to archive record: ${archiveError.message}`);
        }
      }

      console.log('✅ Child record archived successfully');

      return {
        success: true,
        archivedRecord: archivalData.log_data[0]
      };

    } catch (error: any) {
      console.error('❌ Failed to archive child record:', error);
      this.toast({
        title: "Archive Error",
        description: `Failed to archive child record: ${error.message}`,
        variant: "destructive"
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create saved_child_logs table if it doesn't exist
   */
  private async createChildArchiveTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS saved_child_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        date TEXT NOT NULL,
        month TEXT NOT NULL,
        total_records INTEGER NOT NULL,
        log_data JSONB NOT NULL,
        summary_content TEXT NOT NULL,
        saved_at TIMESTAMPTZ DEFAULT NOW(),
        saved_by TEXT DEFAULT 'automatic'
      );
      
      ALTER TABLE saved_child_logs ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Enable all operations for saved_child_logs" ON saved_child_logs
        FOR ALL USING (true);
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      console.error('Failed to create saved_child_logs table:', error);
      throw error;
    }

    console.log('✅ saved_child_logs table created successfully');
  }

  /**
   * Calculate duration between check-in and check-out
   */
  private calculateDuration(checkInTime: string, checkOutTime: string): string {
    const start = new Date(checkInTime);
    const end = new Date(checkOutTime);
    const durationMs = end.getTime() - start.getTime();

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Convert log data to CSV format
   */
  private convertToCSV(logData: any[]): string {
    if (logData.length === 0) return '';

    // Get all unique keys from all records
    const allKeys = new Set<string>();
    logData.forEach(record => {
      Object.keys(record).forEach(key => allKeys.add(key));
      // Also add nested object keys (like guests, employees, etc.)
      Object.values(record).forEach(value => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.keys(value).forEach(key => allKeys.add(key));
        }
      });
    });

    const headers = Array.from(allKeys);

    // Create CSV header
    const csvRows = [headers.join(',')];

    // Add data rows
    logData.forEach(record => {
      const row = headers.map(header => {
        let value = record[header];

        // Handle nested objects (like guests.full_name becomes "full_name")
        if (!value && record.guests && record.guests[header]) {
          value = record.guests[header];
        }
        if (!value && record.employees && record.employees[header]) {
          value = record.employees[header];
        }
        if (!value && record.workshop_guests && record.workshop_guests[header]) {
          value = record.workshop_guests[header];
        }
        if (!value && record.dzikwa_children && record.dzikwa_children[header]) {
          value = record.dzikwa_children[header];
        }

        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }

        return value || '';
      });
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Universal archive function that routes to domain-specific archiving
   */
  async archiveRecordOnCheckout(domain: string, recordId: string): Promise<ArchiveResult> {
    console.log(`🎯 Starting automatic archival for domain: ${domain}, record: ${recordId}`);

    switch (domain) {
      case 'employee':
        return await this.archiveEmployeeRecord(recordId);

      case 'guest':
        return await this.archiveGuestRecord(recordId);

      case 'workshop':
        return await this.archiveWorkshopRecord(recordId);

      case 'children':
        return await this.archiveChildRecord(recordId);

      default:
        return {
          success: false,
          error: `Unknown domain: ${domain}`
        };
    }
  }
}

/**
 * Hook for using automatic archival in components
 */
export const useAutomaticArchive = () => {
  const { toast } = useToast();
  const archive = new AutomaticArchive(toast);

  return {
    archiveRecordOnCheckout: archive.archiveRecordOnCheckout.bind(archive)
  };
};
