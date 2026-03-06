"use client";

import { useRef, useEffect, useState } from "react";

/**
 * Hook for scroll-triggered fade + rise animation.
 * Returns a ref and isVisible boolean.
 * Elements below fold: fade + rise triggered when 20% enters viewport.
 */
export function useScrollReveal(options = {}) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(element);
                }
            },
            {
                threshold: options.threshold || 0.2,
                rootMargin: options.rootMargin || "0px",
            }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [options.threshold, options.rootMargin]);

    return { ref, isVisible };
}

/**
 * Animated counter hook — counts from 0 to target value.
 */
export function useCountUp(target, duration = 1000, start = false) {
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (!start || !target) return;

        let startTime;
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setValue(Math.floor(progress * target));

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }, [target, duration, start]);

    return value;
}
