import { motion, useReducedMotion } from 'motion/react';

const PATH = 'M0,60 C 90,10 180,110 270,60 C 360,10 450,110 540,60 C 630,10 720,110 810,60 C 870,60 900,60 900,60';
const PARTICLE_OFFSETS = [0, 0.33, 0.66];

/** The page's one signature visual: a drawn flow-line rather than a
 * blurred gradient blob, reinforcing the "money flows continuously"
 * concept literally -- small particles travel the line the same way
 * value moves through a stream. */
export function FlowLine() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <svg
      className="flow-line"
      viewBox="0 0 900 120"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <motion.path
        d={PATH}
        stroke="var(--accent)"
        strokeOpacity={0.55}
        strokeWidth={2}
        strokeLinecap="round"
        initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 1.6, ease: 'easeInOut' }}
      />
      {!prefersReducedMotion &&
        PARTICLE_OFFSETS.map((offset, i) => (
          <motion.circle
            key={offset}
            r={4}
            fill="var(--accent)"
            style={{ offsetPath: `path('${PATH}')` }}
            initial={{ offsetDistance: `${offset * 100}%`, opacity: 0 }}
            animate={{ offsetDistance: [`${offset * 100}%`, `${offset * 100 + 100}%`], opacity: 1 }}
            transition={{
              offsetDistance: { duration: 4.5, repeat: Infinity, ease: 'linear', delay: 1.4 + i * 0.3 },
              opacity: { duration: 0.4, delay: 1.4 + i * 0.3 },
            }}
          />
        ))}
    </svg>
  );
}
