export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-mute">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
