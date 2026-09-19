import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import DashboardMockup from './DashboardMockup';

export default function Hero() {
  return (
    <section id="home" className="pt-[120px] pb-20 md:pt-[140px] md:pb-24">
      <div className="container-x grid items-center gap-14 md:grid-cols-[1fr_1.15fr] md:gap-24">
        <div className="text-center md:text-left">
          <h1 className="whitespace-nowrap text-[30px] font-bold leading-[1.1] tracking-tight text-heading md:text-[42px]">
            Pharmacy Management,
            <br />
            <span className="text-accent">Reimagined for Scale</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[16px] leading-[1.7] text-body md:mx-0">
      One secure platform to manage inventory, billing, suppliers, 
      and compliance — built for pharmacies that won't compromise on accuracy, efficiency, or control.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:justify-start sm:justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-lgx bg-accent px-7 py-3.5 text-[15px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center rounded-lgx border-[1.5px] border-line px-7 py-3.5 text-[15px] font-semibold text-heading transition-colors hover:border-accent hover:bg-accent-soft"
            >
              Explore Features
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 md:justify-start">
            {['Easy to use', 'Secure & reliable', 'Built for pharmacies'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-body">
                <CheckCircle2 size={15} className="text-accent" />
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}