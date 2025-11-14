import SupabaseDatabaseClient from '@/database/supabase-client';

export interface NotificationTestResult {
    status: 'sent' | 'skipped' | 'error';
    message?: string;
    reason?: string;
}

export async function triggerNotificationTest(): Promise<NotificationTestResult> {
    const client = SupabaseDatabaseClient.getInstance();
    try {
        const result = await client.triggerNotificationTest();
        return {
            status: (result?.status as NotificationTestResult['status']) || 'sent',
            message: result?.message,
        };
    } catch (error: any) {
        return {
            status: 'error',
            reason: error?.message || 'Erreur inconnue',
        };
    }
}

