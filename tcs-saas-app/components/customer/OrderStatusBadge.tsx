import Badge from '@/components/ui/Badge'

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'

const labels: Record<OrderStatus, string> = {
  pending:   'Menunggu',
  confirmed: 'Dikonfirmasi',
  preparing: 'Diproses',
  ready:     'Siap Diambil',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge label={labels[status]} variant={status} />
}
