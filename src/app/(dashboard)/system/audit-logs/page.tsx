import type { Metadata } from 'next'
import { AuditLogsView } from '@/features/system/audit-logs/components/AuditLogsView'

export const metadata: Metadata = {
  title: 'Audit Logs — Zeus',
  description: 'Complete activity trail and compliance record for all platform operations.',
}

export default function AuditLogsPage() {
  return <AuditLogsView />
}
