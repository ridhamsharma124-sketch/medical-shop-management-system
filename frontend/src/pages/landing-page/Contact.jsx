import { Mail, Phone, MapPin, Send } from 'lucide-react';

const contactInfo = [
  { icon: Mail, label: 'Email', value: 'hello@medheritage.app' },
  { icon: Phone, label: 'Phone', value: '+91 98765 43210' },
  { icon: MapPin, label: 'Address', value: 'Medical Hub, MG Road, Mumbai 400001' },
];

const inputClass =
  'h-[48px] w-full appearance-none rounded-[10px] border border-line bg-surface px-3.5 text-[15px] text-heading transition-colors outline-none placeholder:text-[#B5A99A] focus:border-accent focus:ring-[3px] focus:ring-accent/10';

export default function Contact() {
  return (
    <section id="contact" className="bg-bgprimary px-6 py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-accent">Get in touch</span>
          <h2 className="mt-3 text-4xl font-bold text-heading md:text-[36px]">We&apos;d Love to Hear From You</h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[17px] leading-relaxed text-body">
            Have questions about MedHeritage? Reach out and our team will get back to you within 24 hours.
          </p>
        </div>

        <div className="mt-16 grid items-stretch gap-8 md:grid-cols-[1.4fr_1fr] md:gap-10">
          {/* Form card */}
          <div className="rounded-2xl border border-line bg-surface p-8 shadow-card md:p-10">
            <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="c-name" className="text-[13px] font-medium text-heading">Name</label>
                  <input type="text" id="c-name" placeholder="Your name" className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="c-email" className="text-[13px] font-medium text-heading">Email</label>
                  <input type="email" id="c-email" placeholder="you@example.com" className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="c-phone" className="text-[13px] font-medium text-heading">Phone number</label>
                  <input type="tel" id="c-phone" placeholder="+91 98765 43210" className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="c-subject" className="text-[13px] font-medium text-heading">Inquiry Subject</label>
                  <input type="text" id="c-subject" placeholder="e.g. Pricing question" className={inputClass} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="c-msg" className="text-[13px] font-medium text-heading">Message</label>
                <textarea
                  id="c-msg"
                  rows={5}
                  placeholder="How can we help you?"
                  className="resize-y appearance-none rounded-[10px] border border-line bg-surface px-3.5 py-3 text-[15px] text-heading transition-colors outline-none placeholder:text-[#B5A99A] focus:border-accent focus:ring-[3px] focus:ring-accent/10"
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lgx bg-accent px-8 py-3.5 text-[15px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
                >
                  <Send size={16} />
                  Send Message
                </button>
              </div>
            </form>
          </div>

          {/* Address card */}
          <div className="flex flex-col rounded-2xl border border-line bg-surface p-8 shadow-card md:p-10">
            <div>
              <h3 className="text-2xl font-bold text-heading">Contact Information</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-body">
                Reach us any time — we&apos;re happy to help with setup, billing, or anything else.
              </p>
            </div>

            <div className="mt-4 flex flex-col divide-y divide-line">
              {contactInfo.map((c, i) => (
                <div key={i} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-accent-soft text-accent">
                    <c.icon size={20} />
                  </span>
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-body">{c.label}</div>
                    <div className="mt-0.5 text-[15px] font-semibold text-heading">{c.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}