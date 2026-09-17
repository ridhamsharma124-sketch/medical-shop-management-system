import {
  AlertTriangle,
  PackageX,
  Clock,
  Flame,
  ShoppingCart,
  Receipt,
  Info,
} from 'lucide-react';

const META = {
  low_stock: { icon: AlertTriangle, tone: 'mustard', label: 'Low stock' },
  out_of_stock: { icon: PackageX, tone: 'red', label: 'Out of stock' },
  near_expiry: { icon: Clock, tone: 'olive', label: 'Near expiry' },
  expired: { icon: Flame, tone: 'berry', label: 'Expired' },
  new_order: { icon: ShoppingCart, tone: 'teal', label: 'Stock update' },
  new_bill: { icon: Receipt, tone: 'accent', label: 'New bill' },
  other: { icon: Info, tone: 'body', label: 'Update' },
};

const TONES = {
  accent: 'bg-accent-soft text-accent',
  mustard: 'bg-mustard-soft text-mustard-deep',
  olive: 'bg-olive-soft text-olive-deep',
  berry: 'bg-berry-soft text-berry-deep',
  red: 'bg-red-50 text-red-600',
  teal: 'bg-teal-50 text-teal-700',
  body: 'bg-bgsecondary text-body',
};

export function notificationMeta(type) {
  const meta = META[type] || META.other;
  return {
    ...meta,
    toneClass: TONES[meta.tone],
  };
}

export function timeAgo(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '—';
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return 'just now';
  const min = Math.floor(secs / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const SEEN_KEY = (role) => `medheritage_notif_seen_${role}`;

export function getUnreadCount(items, role) {
  if (!role || !Array.isArray(items)) return 0;
  const lastSeen = Number(localStorage.getItem(SEEN_KEY(role))) || 0;
  return items.filter((n) => {
    const t = new Date(n.createdAt).getTime();
    return Number.isFinite(t) && t > lastSeen;
  }).length;
}

export function markNotificationsRead(role) {
  if (role) localStorage.setItem(SEEN_KEY(role), String(Date.now()));
}

export function notificationDetail(notification = {}) {
  const type = notification.type;
  const msg = notification.message || '';
  const title = notification.title || '';
  const d = { badge: null, tone: null, note: null };

  if (type === 'low_stock') {
    const left = msg.match(/\((\d+)\s*left\)/i);
    d.badge = left ? `${left[1]} left` : 'Low';
    d.tone = 'bg-mustard-soft text-mustard-deep';
  } else if (type === 'out_of_stock') {
    d.badge = '0 left';
    d.tone = 'bg-red-50 text-red-600';
  } else if (type === 'near_expiry') {
    const days = msg.match(/expires in\s*(\d+)\s*day/i);
    d.badge = days ? `${days[1]} ${days[1] === '1' ? 'day' : 'days'}` : 'Expiring soon';
    d.tone = 'bg-olive-soft text-olive-deep';
  } else if (type === 'expired') {
    d.badge = 'Expired';
    d.tone = 'bg-berry-soft text-berry-deep';
  } else if (type === 'new_order' || title === 'Stock updated') {
    const inc = msg.match(/increased by\s*(\d+)/i);
    const nq = msg.match(/new (?:stock )?quantity:?\s*(\d+)/i);
    if (inc) {
      d.badge = `+${inc[1]}`;
      d.tone = 'bg-teal-50 text-teal-700';
      if (nq) d.note = `New quantity: ${nq[1]}`;
    } else if (nq) {
      d.badge = nq[1];
      d.tone = 'bg-teal-50 text-teal-700';
      d.note = 'New stock level';
    }
  } else if (type === 'other') {
    const red = msg.match(/reduced by\s*(\d+)/i);
    const nq = msg.match(/new (?:stock )?quantity:?\s*(\d+)/i);
    if (red) {
      d.badge = `-${red[1]}`;
      d.tone = 'bg-red-50 text-red-600';
      if (nq) d.note = `New quantity: ${nq[1]}`;
    }
  }

  return d;
}