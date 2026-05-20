import Link from 'next/link'

export default function HomeHeader({ userName }: { userName: string | null }) {
  return (
    <div className="bg-brand-surface px-5 pt-12 pb-6 flex items-center justify-between">
      <div>
        <p className="font-sans text-brand-subtext text-sm">Selamat datang 👋</p>
        <h1 className="font-sans font-bold text-xl text-brand-text mt-0.5">
          {userName ?? 'Tamu'}
        </h1>
      </div>
      <Link
        href="/auth/login"
        className="w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center"
      >
        <span className="font-display font-semibold text-brand-on-accent text-sm">
          {userName ? userName[0].toUpperCase() : '?'}
        </span>
      </Link>
    </div>
  )
}
