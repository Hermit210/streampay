import type { PropsWithChildren } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';

function useRevealVariants(): { container: Variants; item: Variants } {
  const prefersReducedMotion = useReducedMotion();
  return {
    container: {
      hidden: {},
      visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.12 } },
    },
    item: {
      hidden: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeOut' },
      },
    },
  };
}

/** Wraps a section so its RevealItem children fade + slide in, staggered,
 * the first time it scrolls into view. A no-op (instant, no motion) when
 * the user has prefers-reduced-motion set. */
export function RevealGroup({ children, className }: PropsWithChildren<{ className?: string }>) {
  const { container } = useRevealVariants();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={container}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  interactive = false,
}: PropsWithChildren<{ className?: string; interactive?: boolean }>) {
  const { item } = useRevealVariants();
  const prefersReducedMotion = useReducedMotion();
  const hoverProps =
    interactive && !prefersReducedMotion
      ? { whileHover: { y: -3, scale: 1.01 }, whileTap: { scale: 0.99 } }
      : {};
  return (
    <motion.div className={className} variants={item} {...hoverProps}>
      {children}
    </motion.div>
  );
}
