export default function EmptyState({ icon: Icon, label, action, onAction }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card-muted">
          <Icon size={24} className="text-ink-mute" strokeWidth={1.5} />
        </div>
      )}
      <p className="text-sm font-medium text-ink-mute">{label}</p>
      {action && (
        <button
          onClick={onAction}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-4 py-2 text-xs font-bold text-[var(--ts-accent)] transition-transform active:scale-95"
        >
          {action}
        </button>
      )}
    </div>
  );
}
