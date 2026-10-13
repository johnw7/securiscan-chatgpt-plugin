import { STATUS_LABELS, STATUS_STYLES } from '../lib/orders';
import type { OrderStatus } from '../types';

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>;
}
