import type { PropsWithChildren } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

/** Enter/exit-animated transaction feedback panel (a confirmed create/
 * withdraw/cancel, linking to the transaction). AnimatePresence lets the
 * exit transition actually play instead of the panel just vanishing the
 * instant `show` flips to false. */
export function TxFeedback({ show, children }: PropsWithChildren<{ show: boolean }>) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="create-success"
          role="status"
          style={{ overflow: 'hidden' }}
          initial={prefersReducedMotion ? false : { opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8, height: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
