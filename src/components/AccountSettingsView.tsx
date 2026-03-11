import React from 'react';
import NotificationSettings from './NotificationSettings';
import WeeklyEmailSettings from './WeeklyEmailSettings';

const AccountSettingsView: React.FC = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Paramètres</h2>
            <p className="text-slate-600">Rappels et résumé hebdomadaire par email.</p>
            <NotificationSettings />
            <WeeklyEmailSettings />
        </div>
    );
};

export default AccountSettingsView;
