import { useEffect, useRef } from 'react';

const EDGE_ZONE = 90;
const MAX_SPEED = 16;

/**
 * Scrolls the page while dragging near the top/bottom viewport edge.
 */
export function useDragAutoScroll(active: boolean) {
    const clientYRef = useRef(0);
    const rafRef = useRef<number>();

    useEffect(() => {
        if (!active) return;

        const onDragOver = (e: DragEvent) => {
            clientYRef.current = e.clientY;
        };

        const tick = () => {
            const y = clientYRef.current;
            const viewport = window.innerHeight;
            let speed = 0;

            if (y > 0 && y < EDGE_ZONE) {
                speed = -MAX_SPEED * (1 - y / EDGE_ZONE);
            } else if (y > viewport - EDGE_ZONE) {
                speed = MAX_SPEED * (1 - (viewport - y) / EDGE_ZONE);
            }

            if (speed !== 0) {
                window.scrollBy({ top: speed, behavior: 'auto' });
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        document.addEventListener('dragover', onDragOver);
        rafRef.current = requestAnimationFrame(tick);

        return () => {
            document.removeEventListener('dragover', onDragOver);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [active]);
}
