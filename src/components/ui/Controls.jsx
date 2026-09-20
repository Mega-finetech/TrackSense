export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange?.(!checked)}
      className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-cyan-500' : 'bg-line'
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all duration-200 ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

export function SegmentedControl({ options, value, onChange, className = '' }) {
  return (
    <div className={`inline-flex items-center gap-1 rounded-xl border border-line bg-card-muted p-1 ${className}`}>
      {options.map((opt) => {
        const active = value === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange?.(opt.value)}
            className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all duration-200 ${
              active
                ? 'bg-card text-ink shadow-sm'
                : 'text-ink-mute hover:text-ink-soft'
            }`}
          >
            {Icon && <Icon size={13} strokeWidth={2} />}
            {opt.label && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
