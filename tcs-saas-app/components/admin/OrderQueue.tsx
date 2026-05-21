import OrderCard from './OrderCard'

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'

interface Order {
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
}

interface OrderQueueProps {
  orders: Order[]
  onStatusChange: (id: string, status: OrderStatus) => void
  onConfirmPayment: (id: string) => void
}

const columns: { status: OrderStatus; label: string }[] = [
  { status: 'pending',   label: 'Masuk' },
  { status: 'confirmed', label: 'Dikonfirmasi' },
  { status: 'preparing', label: 'Diproses' },
  { status: 'ready',     label: 'Siap Diambil' },
]

export default function OrderQueue({ orders, onStatusChange, onConfirmPayment }: OrderQueueProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {columns.map((col) => {
        const colOrders = orders.filter((o) => o.status === col.status)
        return (
          <div key={col.status} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="font-sans font-semibold text-brand-subtext text-sm">{col.label}</p>
              <span className="bg-brand-accent text-brand-on-accent text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {colOrders.length}
              </span>
            </div>
            {colOrders.map((order) => (
              <OrderCard
                key={order.id}
                {...order}
                onStatusChange={onStatusChange}
                onConfirmPayment={onConfirmPayment}
              />
            ))}
            {colOrders.length === 0 && (
              <p className="text-brand-muted text-xs font-sans text-center py-6">Kosong</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
