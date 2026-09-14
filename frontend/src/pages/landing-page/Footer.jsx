import { Shield } from 'lucide-react';

const productLinks = ['Features', 'Pricing', 'Integrations', 'API Docs'];
const companyLinks = ['About Us', 'Careers', 'Blog', 'Contact'];
const legalLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Policy'];

export default function Footer() {
  return (
    <footer className="bg-tan px-6 pb-8 pt-16 text-heading">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-8 border-b border-heading/10 pb-10 lg:flex-row lg:gap-12">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
                <Shield size={18} />
              </span>
              <span className="text-lg font-bold text-heading">MedHeritage</span>
            </div>
            <p className="mt-3 max-w-[260px] text-sm leading-relaxed text-heading/60">
              Smart pharmacy management for modern medical shops.
            </p>
          </div>

          <div className="flex flex-wrap gap-10 lg:gap-14">
            <FooterCol title="Product" links={productLinks} />
            <FooterCol title="Company" links={companyLinks} />
            <FooterCol title="Legal" links={legalLinks} />
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-6 md:flex-row">
          <span className="text-[13px] text-heading/45">
            &copy; {new Date().getFullYear()} MedHeritage. All rights reserved.
          </span>
          <div className="flex gap-5 text-[13px] text-heading/55">
            {['Twitter', 'LinkedIn', 'GitHub'].map((s) => (
              <a key={s} href="#" className="transition-colors hover:text-accent">
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="mb-4 text-[13px] font-medium uppercase tracking-[0.06em] text-heading/55">{title}</h4>
      <ul className="flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="text-sm text-heading/70 transition-colors hover:text-heading">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}