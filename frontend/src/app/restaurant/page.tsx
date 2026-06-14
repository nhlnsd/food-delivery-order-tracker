'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ordersApi } from '@/lib/api';
import { Order, OrderStatus } from '@/types';
import { Navbar } from '@/components/shared/Navbar';
import { RestaurantOrderCard } from '@/components/restaurant/OrderCard';
import { useWebSocket } from '@/hooks/useWebSocket';

type Tab = 'active' | 'completed';

export default function RestaurantPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<Tab>('active');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth/login');
    if (!isLoading && user && user.role !== 'restaurant') router.replace('/customer');
  }, [user, isLoading, router]);

  const fetchOrders = useCallback(async () => {
    try {
      setFetchError('');
      const res = await ordersApi.getRestaurantOrders();
      setOrders(res.data.orders);
    } catch {
      setFetchError('Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user, fetchOrders]);

  // Real-time updates from WebSocket
  const handleWsMessage = useCallback((msg: Record<string, unknown>) => {
    if (msg.type === 'restaurant_update') {
      if (msg.event === 'new_order' && msg.order) {
        setOrders((prev) => {
          const order = msg.order as Order;
          const exists = prev.find((o) => o.id === order.id);
          if (exists) return prev;
          return [order, ...prev];
        });
      } else if (msg.event === 'order_status_changed' && msg.order) {
        const updated = msg.order as Order;
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      }
    }
  }, []);

  const { send, status: wsStatus } = useWebSocket({
    onMessage: handleWsMessage,
    enabled: !!user,
  });

  // Subscribe to restaurant channel
  useEffect(() => {
    if (user?.restaurantId && wsStatus === 'connected') {
      send({ type: 'subscribe_restaurant', restaurantId: user.restaurantId });
    }
  }, [user?.restaurantId, wsStatus, send]);

  function handleStatusUpdate(orderId: number, newStatus: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  }

  const activeOrders = orders.filter((o) => o.status !== 'delivered');
  const completedOrders = orders.filter((o) => o.status === 'delivered');
  const displayOrders = tab === 'active' ? activeOrders : completedOrders;

  // Sort: new first, then by createdAt desc
  const sorted = [...displayOrders].sort((a, b) => {
    if (a.status === 'placed' && b.status !== 'placed') return -1;
    if (b.status === 'placed' && a.status !== 'placed') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Order Queue" connectionStatus={wsStatus} />

      <main className="max-w-2xl mx-auto p-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500 mt-0.5">{user.name}</p>
          </div>
          <button
            onClick={fetchOrders}
            className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Connection warning */}
        {(wsStatus === 'disconnected' || wsStatus === 'error') && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2">
            <span>⚡</span>
            <span>Lost real-time connection. Use Refresh to check for updates.</span>
          </div>
        )}

        {fetchError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            ⚠ {fetchError}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
          <button
            onClick={() => setTab('active')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
              tab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Active
            {activeOrders.length > 0 && (
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  tab === 'active' ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}
              >
                {activeOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('completed')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
              tab === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Completed
            {completedOrders.length > 0 && (
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  tab === 'completed' ? 'bg-gray-700 text-white' : 'bg-gray-300 text-gray-600'
                }`}
              >
                {completedOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">{tab === 'active' ? '🕐' : '✅'}</div>
            <p className="text-gray-500 text-sm">
              {tab === 'active' ? 'No active orders right now.' : 'No completed orders yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {sorted.map((order) => (
              <RestaurantOrderCard
                key={order.id}
                order={order}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
