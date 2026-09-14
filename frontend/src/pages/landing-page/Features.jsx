import { Pill, Package, Receipt, Users, BarChart3, ShieldCheck, Bell, FileBarChart } from 'lucide-react';

const features = [
  {
    icon: Pill,
    title: 'Medicine Management',
    desc: 'Full CRUD with search, filter by category, company, and expiry status. Batch tracking included.',
  },
  {
    icon: Package,
    title: 'Inventory Control',
    desc: 'Real-time stock tracking, low-stock alerts, expiry monitoring, and complete stock movement history.',
  },
  {
    icon: Receipt,
    title: 'Smart Billing',
    desc: 'Auto-calculated GST, discounts, and grand totals. Instant invoice generation with print and PDF export.',
  },
  {
    icon: Users,
    title: 'Customers & Suppliers',
    desc: 'Manage customer profiles with reward points. Track supplier purchases and payment history.',
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    desc: 'Daily, weekly, and monthly sales. Profit reports, best sellers, and expiry alerts — all exportable.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Access',
    desc: 'Admin and Pharmacist roles with JWT security. Admins monitor every action in real time.',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    desc: 'Automatic low-stock warnings, near-expiry notifications, and out-of-stock flags across the system.',
  },
  {
    icon: FileBarChart,
    title: 'Activity Logs',
    desc: 'Complete audit trail — Admins see every action performed by pharmacists with timestamp and details.',
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-bgprimary px-6 py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-accent">Powerful features</span>
          <h2 className="mt-3 text-4xl font-bold text-heading md:text-[36px]">Everything Your Pharmacy Needs</h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[17px] leading-relaxed text-body">
            From inventory to invoicing, MedHeritage handles every aspect of your medical shop operations.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="rounded-lgx border border-line bg-surface p-6 transition-all hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(43,33,27,0.06)]"
            >
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <f.icon size={22} />
              </span>
              <h3 className="mb-2 text-xl font-semibold text-heading">{f.title}</h3>
              <p className="text-sm leading-relaxed text-body">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}