'use client'

import Image from 'next/image'
import Button from '@/components/ui/Button'
import Sheet from '@/components/ui/Sheet'

interface POSQRISModalProps {
  open: boolean
  total: number
  orderId: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export default function POSQRISModal({ open, total, orderId, onConfirm, onCancel, isLoading }: POSQRISModalProps) {
  const qrisUrl = process.env.NEXT_PUBLIC_QRIS_IMAGE_URL

  return (
    <Sheet open={open} onClose={onCancel} title="Pembayaran QRIS">
      <div className="flex flex-col items-center gap-4">
        <p className="font-sans text-brand-subtext text-sm text-center">Order #{orderId.slice(-6).toUpperCase()}</p>
        <p className="font-display font-semibold text-2xl text-brand-text">Rp {total.toLocaleString('id-ID')}</p>
        <div className="w-52 h-52 relative rounded-2xl overflow-hidden border-2 border-brand-border bg-brand-surface flex items-center justify-center">
          {qrisUrl ? (
            <Image src={qrisUrl} alt="QRIS" fill className="object-contain p-2" />
          ) : (
            <p className="text-brand-subtext text-xs text-center px-4">QRIS belum dikonfigurasi</p>
          )}
        </div>
        <div className="flex gap-3 w-full">
          <Button variant="secondary" fullWidth onClick={onCancel}>Batal</Button>
          <Button fullWidth onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Konfirmasi...' : 'Sudah Dibayar'}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
