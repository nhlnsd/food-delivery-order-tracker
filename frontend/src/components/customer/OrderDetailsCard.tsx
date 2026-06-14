'use client';

import { Order } from '@/types';

interface OrderDetailsCardProps {
  order: Order;
}

export function OrderDetailsCard({ order }: OrderDetailsCardProps) {
  const total = typeof order.totalAmount === 'string'
    ? parseFloat(order.totalAmount)
    : order.totalAmount;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-sm">Order Details</h3>
        <span className="text-xs text-gray-400">#{order.id}</span>
      </div>

      <div className="space-y-2 mb-4">
        {order.items?.map((item) => (
          <div key={item.id} className="flex justify-between items-center text-sm">
            <span className="text-gray-700">
              {item.name}
              {item.quantity > 1 && (
                <span className="ml-1 text-xs text-gray-400">×{item.quantity}</span>
              )}
            </span>
            <span className="text-gray-600 font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-900">Total</span>
        <span className="text-sm font-bold text-orange-600">₹{total.toFixed(0)}</span>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <span className="mt-0.5">📍</span>
          <span>{order.deliveryAddress}</span>
        </div>
        {order.restaurant && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>🍳</span>
            <span>{order.restaurant.name}</span>
          </div>
        )}
        {order.estimatedDeliveryMinutes && order.status !== 'delivered' && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>⏱</span>
            <span>Estimated delivery: ~{order.estimatedDeliveryMinutes} min</span>
          </div>
        )}
      </div>
    </div>
  );
}
