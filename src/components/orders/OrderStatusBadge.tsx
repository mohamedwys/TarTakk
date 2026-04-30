import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/src/components/ui';

type Status = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

type Props = {
  status: Status;
  size?: 'sm' | 'md';
};

const STATUS_VARIANT: Record<Status, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  pending: 'warning',
  paid: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'error',
  refunded: 'default',
};

export function OrderStatusBadge({ status, size = 'sm' }: Props) {
  const { t } = useTranslation();
  const variant = STATUS_VARIANT[status] ?? 'default';
  const label = t(`orders.status.${status}`);

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
}
