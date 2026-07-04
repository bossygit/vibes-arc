export const IDENTITY_COLORS = [
    'blue',
    'green',
    'purple',
    'red',
    'yellow',
    'pink',
    'indigo',
    'teal',
] as const;

export type IdentityColorName = (typeof IDENTITY_COLORS)[number];

export interface IdentityColorStyle {
    dot: string;
    bg: string;
    border: string;
    ring: string;
    progress: string;
    text: string;
}

export const identityColorStyles: Record<IdentityColorName, IdentityColorStyle> = {
    blue: {
        dot: 'bg-blue-500',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        ring: 'ring-blue-400',
        progress: 'from-blue-500 to-blue-600',
        text: 'text-blue-800',
    },
    green: {
        dot: 'bg-green-500',
        bg: 'bg-green-50',
        border: 'border-green-200',
        ring: 'ring-green-400',
        progress: 'from-green-500 to-green-600',
        text: 'text-green-800',
    },
    purple: {
        dot: 'bg-purple-500',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        ring: 'ring-purple-400',
        progress: 'from-purple-500 to-purple-600',
        text: 'text-purple-800',
    },
    red: {
        dot: 'bg-red-500',
        bg: 'bg-red-50',
        border: 'border-red-200',
        ring: 'ring-red-400',
        progress: 'from-red-500 to-red-600',
        text: 'text-red-800',
    },
    yellow: {
        dot: 'bg-yellow-500',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        ring: 'ring-yellow-400',
        progress: 'from-yellow-500 to-yellow-600',
        text: 'text-yellow-800',
    },
    pink: {
        dot: 'bg-pink-500',
        bg: 'bg-pink-50',
        border: 'border-pink-200',
        ring: 'ring-pink-400',
        progress: 'from-pink-500 to-pink-600',
        text: 'text-pink-800',
    },
    indigo: {
        dot: 'bg-indigo-500',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        ring: 'ring-indigo-400',
        progress: 'from-indigo-500 to-indigo-600',
        text: 'text-indigo-800',
    },
    teal: {
        dot: 'bg-teal-500',
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        ring: 'ring-teal-400',
        progress: 'from-teal-500 to-teal-600',
        text: 'text-teal-800',
    },
};

export function getIdentityColorStyle(color: string): IdentityColorStyle {
    if (color in identityColorStyles) {
        return identityColorStyles[color as IdentityColorName];
    }
    return identityColorStyles.indigo;
}
