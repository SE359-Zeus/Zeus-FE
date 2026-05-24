import type { Metadata } from 'next'
import { UserAccessView } from '@/features/system/user-access/components/UserAccessView'

export const metadata: Metadata = {
  title: 'User Access — Zeus',
  description: 'Manage operator accounts, roles, and access privileges.',
}

export default function UserAccessPage() {
  return <UserAccessView />
}
