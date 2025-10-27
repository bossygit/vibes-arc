import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface CelebrationProps {
    visible: boolean;
    message?: string;
    durationMs?: number;
    onClose?: () => void;
}

const emojis = ['🎉', '✨', '🔥', '💪', '⭐', '🎯', '🏆'];

const Celebration: React.FC<CelebrationProps> = ({ visible, message = 'Bravo !', durationMs = 1600, onClose }) => {
    useEffect(() => {
        if (!visible) return;
        const t = setTimeout(() => onClose && onClose(), durationMs);
        return () => clearTimeout(t);
    }, [visible, durationMs, onClose]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
                >
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0" />

                    {/* Floating emojis */}
                    <div className="absolute inset-0 overflow-hidden">
                        {Array.from({ length: 18 }).map((_, i) => {
                            const emoji = emojis[i % emojis.length];
                            const startX = Math.random() * 100; // vw
                            const delay = (i % 6) * 0.08;
                            const size = 18 + (i % 5) * 4;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ y: '-10%', x: `${startX}vw`, rotate: 0, opacity: 0 }}
                                    animate={{ y: '110%', rotate: 180 + i * 20, opacity: 1 }}
                                    transition={{
                                        duration: 1.4 + (i % 5) * 0.1,
                                        delay,
                                        ease: 'easeOut',
                                    }}
                                    className="absolute"
                                    style={{ fontSize: size }}
                                >
                                    {emoji}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Center message */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="relative px-6 py-3 rounded-full bg-white/90 backdrop-blur shadow-xl border border-indigo-100"
                    >
                        <span className="text-indigo-700 font-bold">{message}</span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Celebration;


