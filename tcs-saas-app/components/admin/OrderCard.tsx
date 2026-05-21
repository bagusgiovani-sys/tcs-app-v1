import OrderStatusBadge from '@/components/customer/OrderStatusBadge'

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'

interface OrderCardProps {
  id: string
  orderNumber: string
  customerName: string
  type: 'pickup' | 'dine_in'
  tableNumber?: string
  itemCount: number
  total: number
  status: OrderStatus
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  onStatusChange?: (id: string, status: OrderStatus) => void
  onConfirmPayment?: (id: string) => void
}

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending:   'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready:     'completed',
}

const nextLabel: Partial<Record<OrderStatus, string>> = {
  pending:   'Konfirmasi',
  confirmed: 'Mulai Proses',
  preparing: 'Siap',
  ready:     'Selesai',
}

const PAYMENT_LABELS: Record<string, string> = {
  qris:  'QRIS',
  cash:  'Tunai',
  gopay: 'GoPay',
  ovo:   'OVO',
  va:    'VA',
}

export default function OrderCard({
  id, orderNumber, customerName, type, tableNumber,
  itemCount, total, status, paymentMethod, paymentStatus,
  createdAt, onStatusChange, onConfirmPayment,
}: OrderCardProps) {
  const next = nextStatus[status]
  const isPaid = paymentStatus === 'paid'
  const needsCashConfirm = paymentMethod === 'cash' && !isPaid && status === 'pending'

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display font-semibold text-brand-text text-sm">#{orderNumber}</p>
          <p className="font-sans text-brand-subtext text-xs">{customerName}</p>
        </div>
        <OrderStatusBadge status={status} />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-sans text-brand-subtext">
        <span>{type === 'dine_in' ? `Meja ${tableNumber}` : 'Pickup'}</span>
        <span>{itemCount} item</span>
        <span>{new Date(createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
        <span className={`font-semibold ${isPaid ? 'text-green-500' : 'text-brand-accent'}`}>
          {PAYMENT_LABELS[paymentMethod] ?? paymentMethod} · {isPaid ? 'Lunas' : 'Belum Bayar'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="font-display font-semibold text-brand-text">
          Rp {total.toLocaleString('id-ID')}
        </p>
        <div className="flex gap-2">
          {needsCashConfirm && onConfirmPayment && (
            <button
              onClick={() => onConfirmPayment(id)}
              className="bg-green-500 text-white font-sans font-semibold text-xs px-3 py-1.5 rounded-lg"
            >
              Terima Bayar
            </button>
          )}
          {next && onStatusChange && isPaid && (
            <button
              onClick={() => onStatusChange(id, next)}
              className="bg-brand-accent text-brand-on-accent font-sans font-semibold text-sm px-4 py-1.5 rounded-lg"
            >
              {nextLabel[status]}
            </button>
          )}
          {next && onStatusChange && !isPaid && paymentMethod === 'qris' && (
            <button
              onClick={() => onStatusChange(id, next)}
              className="bg-brand-accent text-brand-on-accent font-sans font-semibold text-sm px-4 py-1.5 rounded-lg"
            >
              {nextLabel[status]}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
