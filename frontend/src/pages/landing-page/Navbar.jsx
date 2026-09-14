import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('#home');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
      const ids = navLinks.map((l) => l.href.slice(1));
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i]);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActive('#' + ids[i]);
          return;
        }
      }
      setActive('#home');
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = (e, href) => {
    e.preventDefault();
    setOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }), 100);
      return;
    }
    setActive(href);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 border-b transition-shadow ${
        scrolled ? 'border-line bg-bgprimary/90 shadow-sm backdrop-blur-md' : 'border-transparent bg-bgprimary/90 backdrop-blur-md'
      }`}
    >
      <div className="container-x flex h-[72px] items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent text-white">
            <Shield size={20} strokeWidth={2.5} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[18px] font-bold tracking-tight text-heading">MedHeritage</span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-body">Pharmacy Management</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={(e) => handleClick(e, l.href)}
                className={`relative py-1 text-sm font-medium transition-colors ${
                  active === l.href ? 'text-accent' : 'text-body hover:text-heading'
                }`}
              >
                {l.label}
                {active === l.href && (
                  <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-accent" />
                )}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-heading transition-colors hover:bg-accent-soft">
            Log In
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
          >
            Get Started
          </Link>
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} className="text-heading" /> : <Menu size={24} className="text-heading" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-surface md:hidden">
          <div className="container-x flex flex-col gap-4 py-6">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => handleClick(e, l.href)}
                className={`text-base font-medium ${active === l.href ? 'text-accent' : 'text-heading'}`}
              >
                {l.label}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="flex-1 rounded-lg border border-line py-2.5 text-center text-sm font-semibold text-heading">
                Log In
              </Link>
              <Link to="/signup" className="flex-1 rounded-lg bg-accent py-2.5 text-center text-sm font-semibold text-white">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
