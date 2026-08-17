import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, animate } from 'motion/react';

interface AnimatedNumberProps {
  /** Target value in display units (e.g. XLM, not stroops). */
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

/** Smoothly ticks a displayed number from its previous value to a new one,
 * rather than snapping. This is the single most important animated element
 * in the app -- it's the visual proof that a stream's balance is actually
 * flowing continuously. Writes to the DOM directly on each animation frame
 * (a standard Motion pattern) instead of triggering a React re-render per
 * frame. */
export function AnimatedNumber({ value, decimals = 7, suffix = '', className }: AnimatedNumberProps) {
  const motionValue = useMotionValue(value);
  const displayRef = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.textContent = `${value.toFixed(decimals)}${suffix}`;
    }
  }, [decimals, suffix, value]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      motionValue.set(value);
      return;
    }
    if (prefersReducedMotion) {
      motionValue.jump(value);
      return;
    }
    const controls = animate(motionValue, value, { duration: 0.6, ease: 'easeOut' });
    return () => controls.stop();
  }, [value, prefersReducedMotion, motionValue]);

  useEffect(() => {
    const unsubscribe = motionValue.on('change', (latest) => {
      if (displayRef.current) {
        displayRef.current.textContent = `${latest.toFixed(decimals)}${suffix}`;
      }
    });
    return unsubscribe;
  }, [motionValue, decimals, suffix]);

  return (
    <motion.span ref={displayRef} className={className}>
      {value.toFixed(decimals)}
      {suffix}
    </motion.span>
  );
}
