import BottomNav from '@/components/customer/BottomNav'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-brand-bg">
      <main className="max-w-[430px] mx-auto" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
        {children}
      </main>
      <div className="max-w-[430px] mx-auto">
        <BottomNav />
      </div>
    </div>
  )
}
