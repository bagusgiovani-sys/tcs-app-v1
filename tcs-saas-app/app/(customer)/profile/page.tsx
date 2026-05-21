import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './_components/ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/profile')

  const { data: profile } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', user.id)
    .single()

  return (
    <ProfileClient
      name={profile?.name ?? user.email?.split('@')[0] ?? 'Kamu'}
      email={profile?.email ?? user.email ?? ''}
    />
  )
}
