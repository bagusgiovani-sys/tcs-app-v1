'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string | null

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Email belum dikonfirmasi. Cek inbox kamu atau hubungi admin.' }
    }
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      return { error: 'Email atau password salah.' }
    }
    return { error: error.message }
  }

  redirect(redirectTo || '/')
}

export async function register(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'Email ini sudah terdaftar. Coba masuk.' }
    }
    return { error: error.message }
  }

  // If session exists immediately → email confirmation is OFF → auto logged in
  if (data.session) {
    return { success: true, confirmed: true }
  }

  // Email confirmation is ON → user needs to check email
  return { success: true, confirmed: false }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}
