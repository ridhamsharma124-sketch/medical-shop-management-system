import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

const sections = [
  {
    title: '1. Information We Collect',
    body: 'We collect information you provide directly when creating an account, such as your name, email address, phone number, and pharmacy details. When you use MedHeritage to manage your medical shop, we also store business data you enter — including medicines, inventory, suppliers, customers, billing records, and purchase orders.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'Your information is used to operate and improve MedHeritage: to create and authenticate your account, to provide billing, inventory and reporting features, to send service emails such as OTP verification and important account notifications, and to keep the platform secure and compliant.',
  },
  {
    title: '3. Customer & Patient Data',
    body: 'Customer records entered by you (names, phone numbers, purchase history) are treated as confidential business data. We do not sell, rent, or share this data with third parties. It is used solely to deliver the feature set you rely on, such as billing, rewards, and repeat-customer reports.',
  },
  {
    title: '4. Data Storage & Security',
    body: 'All data is stored on secured servers and is protected using industry-standard measures including encryption in transit. Access to your account is protected by passwords; we encourage you to use a strong, unique password and to keep your credentials private.',
  },
  {
    title: '5. Cookies',
    body: 'MedHeritage uses cookies and similar technologies to keep you signed in, remember your preferences, and understand how the platform is used so we can improve it. You can disable cookies in your browser settings, although some features may not work as intended.',
  },
  {
    title: '6. Sharing of Information',
    body: 'We do not share your personal or business information with third parties except: (a) when required by law, (b) to protect the rights and safety of MedHeritage, our users, or the public, or (c) with service providers who assist us in operating the platform and who are bound by confidentiality obligations.',
  },
  {
    title: '7. Your Rights',
    body: 'You may access, correct, or delete the personal information associated with your account at any time. If you have any questions about your data, or wish to request deletion of your account data, please contact us using the details below.',
  },
  {
    title: '8. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. Any changes will be reflected on this page, and where appropriate, we will notify you. Continued use of MedHeritage after changes means you accept the updated policy.',
  },
  {
    title: '9. Contact Us',
    body: 'If you have any questions or concerns about this Privacy Policy, you can reach us through the Contact section on our website, or by writing to us at support@medheritage.com.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
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
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-[13px] font-semibold text-heading transition-colors hover:border-accent hover:bg-accent-soft"
          >
            <ArrowLeft size={15} />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="container-x py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight text-heading md:text-4xl">Privacy Policy</h1>
          <p className="mt-2 text-[14px] text-body">
            Last updated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <p className="mt-6 text-[15px] leading-relaxed text-body">
            MedHeritage ("we", "our" or "us") is committed to protecting the privacy of every pharmacy that manages its
            operations with us. This Privacy Policy explains what information we collect, how we use it, and the choices
            available to you. By creating an account or using MedHeritage, you agree to the practices described below.
          </p>

          <div className="mt-10 flex flex-col gap-6">
            {sections.map((s) => (
              <section key={s.title} className="rounded-2xl border border-line bg-surface p-6 shadow-card">
                <h2 className="text-[16px] font-bold text-heading">{s.title}</h2>
                <p className="mt-2 text-[14.5px] leading-relaxed text-body">{s.body}</p>
              </section>
            ))}
          </div>

          <p className="mt-10 text-center text-[13px] text-body/70">
            Powered by MedHeritage · Pharmacy Management Platform
          </p>
        </div>
      </main>
    </div>
  );
}