const alerts = [
  { name: 'Cetirizine 10mg', batch: 'CT-0877', company: 'Cipla', status: 'Low stock', days: 'Only 8 left' },
  { name: 'Vitamin D3 60k', batch: 'VD-1120', company: 'Zydus', status: 'Expired', days: 'Expired 2 days ago' },
  { name: 'Metformin 500mg', batch: 'MF-4456', company: 'USV', status: 'Near expiry', days: 'Expires in 19 days' },
  { name: 'Amoxicillin 250mg', batch: 'AM-5541', company: 'Sun Pharma', status: 'Near expiry', days: 'Expires in 30 days' },
  { name: 'Azithromycin 500', batch: 'AZ-3345', company: "Dr. Reddy's", status: 'Low stock', days: 'Only 15 left' },
  { name: 'Ibuprofen 400mg', batch: 'IB-9901', company: 'Zydus', status: 'Expired', days: 'Expired 5 days ago' },
  { name: 'Omeprazole 20mg', batch: 'OM-7890', company: 'Alkem', status: 'Near expiry', days: 'Expires in 45 days' },
];

const badgeStyles = {
  'Low stock': 'bg-mustard-soft text-mustard-deep',
  'Expired': 'bg-berry-soft text-berry-deep',
  'Near expiry': 'bg-olive-soft text-olive-deep',
};

export default function AlertsList() {
  return (
    <div className="max-h-[300px] overflow-y-auto pr-1">
      <ul className="flex flex-col gap-2.5">
        {alerts.map((a) => (
          <li
            key={`${a.batch}-${a.status}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bgprimary/60 px-4 py-3 transition-colors hover:bg-bgsecondary/60"
          >
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-heading">{a.name}</p>
              <p className="truncate text-[12px] text-body">
                Batch {a.batch} · {a.company}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span className={`inline-block rounded-lg px-2.5 py-1 text-[11.5px] font-semibold ${badgeStyles[a.status]}`}>
                {a.status}
              </span>
              <p className="mt-1 text-[11px] text-body/80">{a.days}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}