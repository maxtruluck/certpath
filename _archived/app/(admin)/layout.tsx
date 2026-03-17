import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/get-user'
import { DEMO_MODE } from '@/lib/demo'
import AdminSidebar from './components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, userId } = await getAuthUser()

  if (!userId && !DEMO_MODE) {
    redirect('/login')
  }

  // Check admin role
  if (!DEMO_MODE && userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profile?.role !== 'admin') {
      redirect('/home')
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 ml-[220px]">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
