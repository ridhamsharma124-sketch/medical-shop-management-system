const tones = {
  accent: 'bg-accent-soft text-accent',
  mustard: 'bg-mustard-soft text-mustard-deep',
  berry: 'bg-berry-soft text-berry-deep',
  olive: 'bg-olive-soft text-olive-deep',
  teal: 'bg-teal/10 text-teal',
};

export default function CardPanel({ title, subtitle, icon: Icon, tone = 'accent', right, children, className = '' }) {
  const iconTone = tones[tone] || tones.accent;

  return (
    <div className={`card-hover flex flex-col overflow-hidden rounded-lgx border border-line bg-surface shadow-card ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-line bg-bgsecondary/50 px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconTone}`}>
            {Icon && <Icon size={16} strokeWidth={2.1} />}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[14px] font-semibold text-heading">{title}</h3>
            {subtitle && <p className="truncate text-[11.5px] text-body">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-5">{children}</div>
    </div>
  );
}