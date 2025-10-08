import React from 'react';
import { Identity } from '@/types';

interface IdentityCardProps {
    identity: Identity;
    score: number;
}

const IdentityCard: React.FC<IdentityCardProps> = ({ identity, score }) => {
    return (
        <div className="card">
            <h3 className="font-semibold text-slate-800 mb-2">{identity.name}</h3>
            {identity.description && (
                <p className="text-sm text-slate-600 mb-4">{identity.description}</p>
            )}
            <div className="flex items-center gap-3">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${score}%` }}
                    />
                </div>
                <span className="text-lg font-bold text-indigo-600">{score}%</span>
            </div>
        </div>
    );
};

export default IdentityCard;
