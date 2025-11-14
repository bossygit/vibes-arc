import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Smartphone, MessageCircle, Phone, Send } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { triggerNotificationTest } from '@/services/notificationService';

const HOURS = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i.toString().padStart(2, '0')}:00`,
}));

const TIMEZONES = [
    'Europe/Paris',
    'Europe/Brussels',
    'Europe/London',
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'Africa/Casablanca',
    'Asia/Dubai',
    'Asia/Singapore',
];

const NotificationSettings: React.FC = () => {
    const {
        userPrefs,
        setNotifEnabled,
        setNotifHour,
        setNotifTimezone,
        setNotifChannel,
        setTelegramContact,
        setWhatsappNumber,
    } = useAppStore();

    const [chatIdInput, setChatIdInput] = useState(userPrefs.telegramChatId ?? '');
    const [usernameInput, setUsernameInput] = useState(userPrefs.telegramUsername ?? '');
    const [whatsappInput, setWhatsappInput] = useState(userPrefs.whatsappNumber ?? '');
    const [telegramSaveStatus, setTelegramSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [whatsappSaveStatus, setWhatsappSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState<string>('');

    useEffect(() => {
        setChatIdInput(userPrefs.telegramChatId ?? '');
    }, [userPrefs.telegramChatId]);

    useEffect(() => {
        setUsernameInput(userPrefs.telegramUsername ?? '');
    }, [userPrefs.telegramUsername]);

    useEffect(() => {
        setWhatsappInput(userPrefs.whatsappNumber ?? '');
    }, [userPrefs.whatsappNumber]);

    const channelReady = useMemo(() => {
        if (userPrefs.notifChannel === 'telegram') {
            return Boolean(userPrefs.telegramChatId);
        }
        if (userPrefs.notifChannel === 'whatsapp') {
            return Boolean(userPrefs.whatsappNumber);
        }
        return false;
    }, [userPrefs.notifChannel, userPrefs.telegramChatId, userPrefs.whatsappNumber]);

    const canSendTest = userPrefs.notifEnabled && channelReady;
    const channelLabel = userPrefs.notifChannel === 'whatsapp' ? 'WhatsApp' : 'Telegram';

    const handleSaveTelegram = () => {
        if (!chatIdInput.trim()) {
            setTelegramSaveStatus('idle');
            return;
        }
        setTelegramSaveStatus('saving');
        setTelegramContact(chatIdInput.trim(), usernameInput.trim() || undefined);
        setTimeout(() => {
            setTelegramSaveStatus('saved');
            setTimeout(() => setTelegramSaveStatus('idle'), 2000);
        }, 400);
    };

    const handleSaveWhatsapp = () => {
        if (!whatsappInput.trim()) {
            setWhatsappSaveStatus('idle');
            return;
        }
        setWhatsappSaveStatus('saving');
        setWhatsappNumber(whatsappInput.trim());
        setTimeout(() => {
            setWhatsappSaveStatus('saved');
            setTimeout(() => setWhatsappSaveStatus('idle'), 2000);
        }, 400);
    };

    const handleSendTest = async () => {
        if (!canSendTest) return;
        setTestStatus('loading');
        setTestMessage('');
        const result = await triggerNotificationTest();
        if (result.status === 'sent') {
            setTestStatus('success');
            setTestMessage(result.message ?? `Message envoyé sur ${channelLabel} ✅`);
        } else if (result.status === 'skipped') {
            setTestStatus('error');
            setTestMessage(result.reason ?? 'Configuration incomplète.');
        } else {
            setTestStatus('error');
            setTestMessage(result.reason ?? 'Une erreur est survenue.');
        }
    };

    return (
        <div className="card border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 rounded-lg flex-shrink-0">
                    <Bell className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1 space-y-6">
                    <div>
                        <h3 className="font-semibold text-emerald-900 mb-1">Rappels intelligents</h3>
                        <p className="text-sm text-slate-600">
                            Recevez un message quotidien avec un rappel personnalisé directement sur Telegram ou WhatsApp.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input
                                type="checkbox"
                                checked={userPrefs.notifEnabled}
                                onChange={(e) => setNotifEnabled(e.target.checked)}
                                className="w-4 h-4"
                            />
                            Activer les rappels quotidiens
                        </label>
                        <span className={`text-xs px-2 py-1 rounded-full ${userPrefs.notifEnabled ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                            {userPrefs.notifEnabled ? 'Activé' : 'Désactivé'}
                        </span>
                    </div>

                    {userPrefs.notifEnabled && (
                        <div className="space-y-5 pl-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                                        Canal
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setNotifChannel('telegram')}
                                            className={`p-3 rounded-lg border text-left transition ${userPrefs.notifChannel === 'telegram'
                                                ? 'border-emerald-500 bg-white shadow-sm'
                                                : 'border-slate-200 hover:border-emerald-200'}`}
                                        >
                                            <div className="font-semibold text-slate-800">Telegram</div>
                                            <p className="text-xs text-slate-500">Envoi direct via bot</p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNotifChannel('whatsapp')}
                                            className={`p-3 rounded-lg border text-left transition ${userPrefs.notifChannel === 'whatsapp'
                                                ? 'border-emerald-500 bg-white shadow-sm'
                                                : 'border-slate-200 hover:border-emerald-200'}`}
                                        >
                                            <div className="font-semibold text-slate-800">WhatsApp</div>
                                            <p className="text-xs text-slate-500">Via Twilio ou Meta Cloud API</p>
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1">Heure locale</label>
                                        <select
                                            className="input-field"
                                            value={userPrefs.notifHour}
                                            onChange={(e) => setNotifHour(parseInt(e.target.value))}
                                        >
                                            {HOURS.map((hour) => (
                                                <option key={hour.value} value={hour.value}>
                                                    {hour.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1">Fuseau horaire</label>
                                        <select
                                            className="input-field"
                                            value={userPrefs.notifTimezone}
                                            onChange={(e) => setNotifTimezone(e.target.value)}
                                        >
                                            {TIMEZONES.map((tz) => (
                                                <option key={tz} value={tz}>
                                                    {tz}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {userPrefs.notifChannel === 'telegram' && (
                                <div className="rounded-lg border border-emerald-200 bg-white p-4 space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Smartphone className="w-4 h-4 text-emerald-600" />
                                        Connectez votre compte Telegram
                                    </div>
                                    <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                                        <li>Créez un bot avec <strong>@BotFather</strong> et enregistrez le token dans Supabase (variable <code>TELEGRAM_BOT_TOKEN</code>).</li>
                                        <li>Démarrez une conversation avec votre bot et envoyez-lui un message.</li>
                                        <li>Récupérez votre <strong>chat ID</strong> (via <strong>@RawDataBot</strong> ou <strong>@userinfobot</strong>) et indiquez-le ci-dessous.</li>
                                    </ol>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-slate-600 mb-1">Chat ID Telegram</label>
                                            <input
                                                className="input-field"
                                                placeholder="123456789"
                                                value={chatIdInput}
                                                onChange={(e) => setChatIdInput(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-600 mb-1">Pseudo (optionnel)</label>
                                            <input
                                                className="input-field"
                                                placeholder="@monpseudo"
                                                value={usernameInput}
                                                onChange={(e) => setUsernameInput(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            className="btn-primary"
                                            onClick={handleSaveTelegram}
                                            disabled={!chatIdInput.trim() || telegramSaveStatus === 'saving'}
                                        >
                                            {telegramSaveStatus === 'saving' ? 'Enregistrement...' : 'Sauvegarder mes infos Telegram'}
                                        </button>
                                        {telegramSaveStatus === 'saved' && (
                                            <span className="text-sm text-emerald-600">✅ Chat enregistré</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {userPrefs.notifChannel === 'whatsapp' && (
                                <div className="rounded-lg border border-lime-200 bg-white p-4 space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Phone className="w-4 h-4 text-lime-600" />
                                        Connectez votre numéro WhatsApp
                                    </div>
                                    <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                                        <li>Créez un numéro WhatsApp Business via Twilio ou Meta Cloud API.</li>
                                        <li>Ajoutez les variables <strong>TWILIO_ACCOUNT_SID</strong>, <strong>TWILIO_AUTH_TOKEN</strong> et <strong>TWILIO_WHATSAPP_FROM</strong> à votre fonction Supabase.</li>
                                        <li>Saisissez ci-dessous votre numéro WhatsApp (format international).</li>
                                    </ol>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-slate-600 mb-1">Numéro WhatsApp</label>
                                            <input
                                                className="input-field"
                                                placeholder="+33612345678"
                                                value={whatsappInput}
                                                onChange={(e) => setWhatsappInput(e.target.value)}
                                            />
                                        </div>
                                        <div className="text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg p-3">
                                            Utilisez le format <strong>+codePays</strong> (ex: +33...). L'app ajoutera automatiquement le préfixe <code>whatsapp:</code>.
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            className="btn-primary"
                                            onClick={handleSaveWhatsapp}
                                            disabled={!whatsappInput.trim() || whatsappSaveStatus === 'saving'}
                                        >
                                            {whatsappSaveStatus === 'saving' ? 'Enregistrement...' : 'Sauvegarder mon numéro'}
                                        </button>
                                        {whatsappSaveStatus === 'saved' && (
                                            <span className="text-sm text-emerald-600">✅ Numéro enregistré</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                <div className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                                    <Send className="w-4 h-4 text-emerald-600" />
                                    Test d'envoi
                                </div>
                                <p className="text-sm text-slate-500 mb-3">
                                    Vérifiez immédiatement que votre canal sélectionné peut vous envoyer un message.
                                </p>
                                <button
                                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleSendTest}
                                    disabled={!canSendTest || testStatus === 'loading'}
                                >
                                    {testStatus === 'loading' ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Envoi en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            {channelLabel === 'WhatsApp' ? 'Envoyer un test sur WhatsApp' : 'Envoyer un test sur Telegram'}
                                        </>
                                    )}
                                </button>
                                {!canSendTest && (
                                    <p className="text-xs text-slate-500 mt-2">
                                        Configurez d'abord votre canal {channelLabel.toLowerCase()} pour activer le test.
                                    </p>
                                )}
                                {testStatus === 'success' && (
                                    <div className="mt-3 p-2 rounded bg-emerald-100 text-emerald-800 text-sm">
                                        {testMessage}
                                    </div>
                                )}
                                {testStatus === 'error' && (
                                    <div className="mt-3 p-2 rounded bg-red-100 text-red-700 text-sm">
                                        {testMessage || 'Impossible d\'envoyer le message.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;

