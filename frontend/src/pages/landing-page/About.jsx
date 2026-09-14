import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function About() {
  return (
    <section id="about" className="bg-bgsecondary px-6 py-24 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-accent">Why MedHeritage</span>
          <h2 className="mt-3 text-4xl font-bold leading-snug text-heading md:text-[36px]">
            Built by Pharmacists,<br />
            <span className="text-accent">for Pharmacists</span>
          </h2>
          <p className="mt-5 max-w-[480px] text-base leading-relaxed text-body">
            MedHeritage was designed from the ground up to solve the real challenges
            medical shops face daily — expired stock on shelves, manual billing errors,
            lost customer records, and zero visibility into daily sales.
          </p>
          <p className="mt-4 max-w-[480px] text-base leading-relaxed text-body">
            Whether you run a single-counter pharmacy or manage multiple outlets,
            MedHeritage gives you complete control over medicines, customers, suppliers,
            and billing — all from one clean dashboard.
          </p>
          <Link
            to="/signup"
            className="mt-7 inline-flex items-center gap-2 rounded-lgx bg-accent px-7 py-3.5 text-[15px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
          >
            Start Managing Smarter
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-line bg-bgsecondary shadow-float">
            <img
              src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1400&h=1050&fit=crop&q=80"
              alt="Pharmacist arranging medicine bottles on shelves"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}