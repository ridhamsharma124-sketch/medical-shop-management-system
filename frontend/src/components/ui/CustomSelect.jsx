import { useCallback, useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

const SIZE_CLS = {
  sm: 'h-9 text-[12.5px]',
  md: 'h-10 text-[14px]',
  lg: 'h-[46px] text-[15px]',
};

const OPTION_CLS = {
  sm: 'py-1.5 text-[12.5px]',
  md: 'py-2 text-[14px]',
  lg: 'py-2 text-[14px]',
};

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select',
  size = 'md',
  className = '',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const applyPos = useCallback(() => {
    const node = popRef.current;
    const btn = btnRef.current;
    if (!node || !btn) return;
    const rect = btn.getBoundingClientRect();
    const h = node.offsetHeight;
    const margin = 6;
    const up = rect.bottom + margin + h > window.innerHeight - 8 && rect.top - margin - h >= 8;
    node.style.position = 'fixed';
    node.style.top = `${up ? rect.top - margin : rect.bottom + margin}px`;
    node.style.left = `${rect.left}px`;
    node.style.width = `${rect.width}px`;
    node.style.transform = up ? 'translateY(-100%)' : 'none';
    node.style.zIndex = '9999';
    node.style.visibility = 'visible';
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    applyPos();
    document.addEventListener('scroll', applyPos, true);
    window.addEventListener('resize', applyPos);
    return () => {
      document.removeEventListener('scroll', applyPos, true);
      window.removeEventListener('resize', applyPos);
    };
  }, [open, applyPos]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target) && popRef.current && !popRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    const onEscape = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const selected = options.find((o) => String(o.value) === String(value));
  const btnCls = SIZE_CLS[size];

  return (
    <div ref={btnRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`${btnCls} flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border bg-bgprimary px-3.5 text-heading transition-colors focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10 disabled:opacity-60 ${
          open ? 'border-accent' : 'border-line hover:border-accent/40'
        }`}
      >
        <span className={`truncate ${selected ? 'text-heading' : 'text-body/50'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={15} className={`shrink-0 text-body/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open &&
        createPortal(
          <div
            ref={popRef}
            style={{ position: 'fixed', visibility: 'hidden' }}
            className="max-h-56 overflow-auto rounded-lg border border-line bg-surface p-1.5 shadow-xl"
          >
            {options.length === 0 && <div className="px-3 py-2 text-[12.5px] text-body/60">No options</div>}
            {options.map((o) => {
              const isSel = String(o.value) === String(value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`${OPTION_CLS[size]} flex w-full items-center justify-between gap-2 rounded-md px-3 transition-colors hover:bg-bgsecondary ${
                    isSel ? 'font-semibold text-accent' : 'text-heading'
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {isSel && <Check size={15} className="shrink-0 text-accent" />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}