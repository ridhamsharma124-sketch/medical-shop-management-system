const variants = {
  accent: {
    wrap: 'bg-accent text-white',
    iconWrap: 'bg-white/20 text-white',
    label: 'text-white/70',
  },
  mustard: {
    wrap: 'bg-mustard-soft',
    iconWrap: 'bg-mustard/15 text-mustard',
    label: 'text-mustard-deep/70',
    value: 'text-mustard-deep',
  },
  berry: {
    wrap: 'bg-berry-soft',
    iconWrap: 'bg-berry/15 text-berry',
    label: 'text-berry-deep/70',
    value: 'text-berry-deep',
  },
  olive: {
    wrap: 'bg-olive-soft',
    iconWrap: 'bg-olive/15 text-olive',
    label: 'text-olive-deep/70',
    value: 'text-olive-deep',
  },
};

export default function HighlightCard({ variant = 'accent', icon: Icon, value, label, sub }) {
  const v = variants[variant];
  return (
    <div className={`rounded-lgx p-3 shadow-card transition-all hover:-translate-y-px ${v.wrap}`}>
      <div className="flex items-start justify-between">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${v.iconWrap}`}>
          <Icon size={15} />
        </span>
        {sub && (
          <span className={`rounded px-1.5 py-0.5 text-[9.5px] font-semibold leading-none ${variant === 'accent' ? 'bg-white/15 text-white/90' : 'bg-black/5 ' + v.label}`}>
            {sub}
          </span>
        )}
      </div>
      <div className={`mt-2 font-display text-[20px] font-bold leading-none tracking-tight ${v.value || 'text-white'}`}>
        {value}
      </div>
      <div className={`mt-0.5 text-[11.5px] font-medium ${v.label}`}>{label}</div>
    </div>
  );
}