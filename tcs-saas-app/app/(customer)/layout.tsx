import BottomNav from '@/components/customer/BottomNav'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-brand-bg">
      <main className="pb-24 max-w-[430px] mx-auto">
        {children}
      </main>
      <div className="max-w-[430px] mx-auto">
        <BottomNav />
      </div>
    </div>
  )
}
