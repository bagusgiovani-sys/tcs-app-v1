import Link from 'next/link'
import AdminProductForm from '../_components/AdminProductForm'

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/menu" className="text-brand-subtext hover:text-brand-text transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="font-sans font-bold text-2xl text-brand-text">Tambah Produk</h1>
      </div>
      <AdminProductForm />
    </div>
  )
}
