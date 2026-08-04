import { ReportStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/utils';

interface Props {
  status: ReportStatus;
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={STATUS_COLORS[status]}>
      {STATUS_LABELS[status]}
    </span>
  );
}
