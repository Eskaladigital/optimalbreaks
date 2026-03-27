// ============================================
// OPTIMAL BREAKS — Login Page
// ============================================

import type { Locale } from '@/lib/i18n-config'
import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = { title: 'Login' }

export default async function LoginPage({ params }: { params: { lang: Locale } }) {
  const { lang } = await params
  return <LoginForm lang={lang} />
}
