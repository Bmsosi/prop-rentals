import { useEffect, useState, useRef } from "react";

export const useIntersectionObserver = (refs, options = {}) => {
    const [visibilityStates, setVisibilityStates] = useState({});
    const [animationKeys, setAnimationKeys] = useState({});
    const visibilityRef = useRef({});

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const refName = entry.target.dataset.refName;
                    if (!refName) return;

                    if (entry.isIntersecting) {
                        const wasVisible = visibilityRef.current[refName] || false;
                        visibilityRef.current[refName] = true;
                        setVisibilityStates(prev => ({ ...prev, [refName]: true }));
                        // Increment key to force animation replay for specific sections
                        if (['pricing', 'contact', 'team'].includes(refName) && !wasVisible) {
                            setAnimationKeys(prev => ({
                                ...prev,
                                [refName]: (prev[refName] || 0) + 1
                            }));
                        }
                    } else {
                        // Reset visibility when element leaves viewport (for replayable animations)
                        if (['features', 'dashboard', 'pricing', 'contact', 'team'].includes(refName)) {
                            visibilityRef.current[refName] = false;
                            setVisibilityStates(prev => ({ ...prev, [refName]: false }));
                        }
                    }
                });
            },
            {
                threshold: options.threshold || 0.2,
                rootMargin: options.rootMargin || '0px 0px -50px 0px'
            }
        );

        refs.forEach(({ ref, name }) => {
            if (ref.current) {
                ref.current.dataset.refName = name;
                observer.observe(ref.current);
            }
        });

        return () => {
            refs.forEach(({ ref }) => {
                if (ref.current) {
                    observer.unobserve(ref.current);
                }
            });
        };
    }, [refs, options.threshold, options.rootMargin]);

    return { visibilityStates, animationKeys };
};

