import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/src/components/ui';
import type { AdminKycStatus } from '@/lib/services/adminKycService';

type Props = {
  status: AdminKycStatus;
  size?: 'sm' | 'md';
};

const STATUS_VARIANT: Record<
  AdminKycStatus,
  'success' | 'warning' | 'error' | 'info' | 'default'
> = {
  pending: 'warning',
  under_review: 'info',
  approved: 'success',
  rejected: 'error',
};

export function KycStatusBadge({ status, size = 'sm' }: Props) {
  const { t } = useTranslation();
  const variant = STATUS_VARIANT[status] ?? 'default';
  const label = t(`proPortal.admin.filter.${status}`);

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
}
