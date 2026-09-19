import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const quickLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'Contact', href: '#contact' },
];

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
            <FooterCol title="Quick Links" links={quickLinks} />
            <FooterCol
              title="Legal"
              links={[
                { label: 'Privacy Policy', to: '/privacy-policy' },
                { label: 'Terms of Service', to: '/privacy-policy' },
                { label: 'Cookie Policy', to: '/privacy-policy' },
              ]}
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-6 md:flex-row">
          <span className="text-[13px] text-heading/45">
            &copy; {new Date().getFullYear()} MedHeritage. All rights reserved.
          </span>
          <span className="text-[13px] text-heading/55">Powered by MedHeritage</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  const scrollTo = (e, href) => {
    e.preventDefault();
    if (window.location.pathname !== '/') {
      window.location.assign('/#' + href.slice(1));
      return;
    }
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      <h4 className="mb-4 text-[13px] font-medium uppercase tracking-[0.06em] text-heading/55">{title}</h4>
      <ul className="flex flex-col gap-2.5">
        {links.map((l) =>
          l.to ? (
            <li key={l.label}>
              <Link
                to={l.to}
                className="text-sm text-heading/70 transition-colors hover:text-heading"
              >
                {l.label}
              </Link>
            </li>
          ) : (
            <li key={l.label}>
              <a
                href={l.href}
                onClick={(e) => scrollTo(e, l.href)}
                className="text-sm text-heading/70 transition-colors hover:text-heading"
              >
                {l.label}
              </a>
            </li>
          )
        )}
      </ul>
    </div>
  );
}