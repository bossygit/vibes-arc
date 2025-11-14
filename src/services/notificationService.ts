import SupabaseDatabaseClient from '@/database/supabase-client';

export interface NotificationTestResult {
    status: 'sent' | 'skipped' | 'error';
    message?: string;
    reason?: string;
}

export async function triggerNotificationTest(): Promise<NotificationTestResult> {
    const client = SupabaseDatabaseClient.getInstance();
    try {
        console.log('🔔 Déclenchement du test de notification...');
        const result = await client.triggerNotificationTest();
        console.log('📨 Résultat de la fonction Edge:', result);
        
        if (!result || typeof result.status === 'undefined') {
            console.error('❌ Réponse invalide de la fonction Edge:', result);
            return {
                status: 'error',
                reason: 'Réponse invalide du serveur',
            };
        }
        
        return {
            status: (result.status as NotificationTestResult['status']) || 'error',
            message: result.message,
            reason: result.reason,
        };
    } catch (error: any) {
        console.error('❌ Erreur lors du test de notification:', error);
        return {
            status: 'error',
            reason: error?.message || 'Erreur inconnue',
        };
    }
}

