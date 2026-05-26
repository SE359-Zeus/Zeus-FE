import type { Metadata } from 'next'
import { RegisterView } from '@/features/auth/components/RegisterView'

export const metadata: Metadata = {
  title: 'Create Account — Zeus',
  description: 'Register for a new account in the Zeus system.',
}

export default function RegisterPage() {
  return <RegisterView />
}
