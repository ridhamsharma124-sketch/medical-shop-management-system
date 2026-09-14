import { Pill, Users, FileText, TrendingUp } from 'lucide-react';

const stats = [
  { icon: Pill, value: '500+', label: 'Medicines managed' },
  { icon: Users, value: '2M+', label: 'Prescriptions processed' },
  { icon: FileText, value: '99.9%', label: 'System uptime' },
  { icon: TrendingUp, value: '10K+', label: 'Pharmacies trust us' },
];

export default function StatsBar() {
  return (
    <section className="border-y border-line bg-bgsecondary px-6 py-10">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
        {stats.map((s, i) => (
          <div key={i} className="text-center">
            <s.icon size={20} className="mx-auto mb-2 text-accent" />
            <div className="text-[26px] font-bold leading-none text-heading md:text-[32px]">{s.value}</div>
            <div className="mt-1.5 text-xs font-medium uppercase tracking-[0.06em] text-body">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}