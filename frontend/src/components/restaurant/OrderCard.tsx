'use client';

import { useState } from 'react';
import { Order, OrderStatus } from '@/types';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  NEXT_STATUS,
  NEXT_STATUS_LABELS,
} from '@/lib/orderStatus';
import { ordersApi } from '@/lib/api';

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: number, newStatus: OrderStatus) => void;
}

export function RestaurantOrderCard({ order, onStatusUpdate }: OrderCardProps) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  const nextStatus = NEXT_STATUS[order.status];
  const total = typeof order.totalAmount === 'string'
    ? parseFloat(order.totalAmount)
    : order.totalAmount;

  const isNew = order.status === 'placed';
  const isActive = ['confirmed', 'preparing', 'out_for_delivery'].includes(order.status);
  const isDone = order.status === 'delivered';

  async function handleAdvance() {
    if (!nextStatus) return;
    setError('');
    setUpdating(true);
    try {
      await ordersApi.updateStatus(order.id, nextStatus);
      onStatusUpdate(order.id, nextStatus);
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  }

  const timeAgo = () => {
    const diffMs = Date.now() - new Date(order.createdAt).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <div
      className={`card order-card overflow-hidden ${
        isNew ? 'ring-2 ring-orange-400 ring-offset-1' : ''
      } ${isDone ? 'opacity-70' : ''}`}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-mono">#{order.id}</span>
              {isNew && (
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full animate-pulse-slow">
                  NEW
                </span>
              )}
              <span className={`status-badge ${STATUS_COLORS[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            <p className="font-semibold text-gray-900 mt-1 text-sm">{order.customer?.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{order.deliveryAddress}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-gray-900 text-sm">₹{total.toFixed(0)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{timeAgo()}</p>
            <span className="text-gray-300 text-xs">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          {/* Items */}
          <div className="space-y-1.5">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm text-gray-600">
                <span>
                  {item.name}
                  {item.quantity > 1 && <span className="text-gray-400 ml-1">×{item.quantity}</span>}
                </span>
                <span>₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
            {order.notes && (
              <p className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg mt-2">
                📝 {order.notes}
              </p>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-2.5 py-2 rounded-lg">⚠ {error}</p>
          )}

          {/* Advance button */}
          {nextStatus && !isDone && (
            <button
              onClick={handleAdvance}
              disabled={updating}
              className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>→ {NEXT_STATUS_LABELS[order.status]}</>
              )}
            </button>
          )}

          {isDone && (
            <div className="text-center text-sm text-green-600 font-medium py-1">
              ✓ Order complete
            </div>
          )}
        </div>
      )}
    </div>
  );
}
