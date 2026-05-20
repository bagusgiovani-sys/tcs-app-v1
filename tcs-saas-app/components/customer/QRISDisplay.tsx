'use client'

import Image from 'next/image'
import Button from '@/components/ui/Button'

interface QRISDisplayProps {
  total: number
  onConfirmPayment: () => void
  isPending?: boolean
}

export default function QRISDisplay({ total, onConfirmPayment, isPending }: QRISDisplayProps) {
  const qrisUrl = process.env.NEXT_PUBLIC_QRIS_IMAGE_URL

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-sans text-brand-subtext text-sm text-center">
        Scan QRIS di bawah, lalu tap tombol konfirmasi
      </p>
      <p className="font-display font-semibold text-2xl text-brand-text">
        Rp {total.toLocaleString('id-ID')}
      </p>
      <div className="w-56 h-56 relative rounded-2xl overflow-hidden border-2 border-brand-border bg-brand-surface flex items-center justify-center">
        {qrisUrl ? (
          <Image src={qrisUrl} alt="QRIS TCS Coffee" fill className="object-contain p-2" />
        ) : (
          <p className="text-brand-subtext text-xs text-center px-4">QRIS belum dikonfigurasi</p>
        )}
      </div>
      <p className="font-sans text-brand-subtext text-xs text-center">
        Bayar via GoPay, OVO, Dana, atau semua e-wallet ber-QRIS
      </p>
      <Button fullWidth size="lg" onClick={onConfirmPayment} disabled={isPending}>
        {isPending ? 'Memproses...' : 'Saya Sudah Bayar'}
      </Button>
    </div>
  )
}
