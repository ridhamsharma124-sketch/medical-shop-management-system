import { Hammer } from 'lucide-react';

export default function PlaceholderPage({ title }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <Hammer size={30} />
      </span>
      <h2 className="mt-5 text-2xl font-bold text-heading">{title}</h2>
      <p className="mt-2 max-w-md text-center text-[14px] leading-relaxed text-body">
        This module is under construction. We're working on it — it'll be ready soon.
      </p>
    </div>
  );
}