const TONES = {
  cyan:   'bg-cyan-500/12 text-cyan-600 dark:text-cyan-300',
  violet: 'bg-violet-500/12 text-violet-600 dark:text-violet-300',
  amber:  'bg-amber-500/14 text-amber-600 dark:text-amber-300',
  emerald:'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
  rose:   'bg-rose-500/12 text-rose-500 dark:text-rose-300',
  slate:  'bg-navy-500/10 text-ink-soft',
};

export default function Badge({ tone = 'slate', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export const PRIORITY_TONE = { high: 'rose', medium: 'amber', low: 'emerald' };
