import './ui.css';

type Status = 'active' | 'completed' | 'canceled';

const LABELS: Record<Status, string> = {
  active: 'Streaming',
  completed: 'Completed',
  canceled: 'Canceled',
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`status-badge status-${status}`}>{LABELS[status]}</span>;
}
