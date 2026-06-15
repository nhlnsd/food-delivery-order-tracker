'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ordersApi } from '@/lib/api';
import { Order } from '@/types';
import { Navbar } from '@/components/shared/Navbar';
import { StatusProgress } from '@/components/customer/StatusProgress';
import { OrderDetailsCard } from '@/components/customer/OrderDetailsCard';
import { PlaceOrderForm } from '@/components/customer/PlaceOrderForm';
import { useWebSocket } from '@/hooks/useWebSocket';

type View = 'loading' | 'tracking' | 'place_order' | 'delivered';

export default function CustomerPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [view, setView] = useState<View>('loading');
  const [fetchError, setFetchError] = useState('');

  // Redirect if not customer
  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth/login');
    if (!isLoading && user && user.role !== 'customer') router.replace('/restaurant');
  }, [user, isLoading, router]);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await ordersApi.getMyOrder();
      const o: Order | null = res.data.order;
      setOrder(o);
      if (!o) {
        setView('place_order');
      } else if (o.status === 'delivered') {
        setView('delivered');
      } else {
        setView('tracking');
      }
    } catch {
      setFetchError('Could not load your order. Check your connection.');
      setView('place_order');
    }
  }, []);

  useEffect(() => {
    if (user) fetchOrder();
  }, [user, fetchOrder]);

  // WebSocket: subscribe to order updates
  const handleWsMessage = useCallback((msg: Record<string, unknown>) => {
    if (msg.type === 'order_update' && msg.order) {
      const updated = msg.order as Order;
      setOrder(updated);
      if (updated.status === 'delivered') {
        setView('delivered');
      } else {
        setView('tracking');
      }
    }
  }, []);

  const { send, status: wsStatus } = useWebSocket({
    onMessage: handleWsMessage,
    enabled: !!user && view !== 'place_order',
  });

  // Subscribe to order updates once we have an order
  useEffect(() => {
    if (order && wsStatus === 'connected') {
      send({ type: 'subscribe_order', orderId: order.id });
    }
  }, [order?.id, wsStatus, send]);

  function handleOrderPlaced() {
    setView('loading');
    fetchOrder();
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        title="My Order"
        connectionStatus={view === 'tracking' || view === 'delivered' ? wsStatus : undefined}
      />

      <main className="max-w-lg mx-auto p-4 py-6">
        {/* Disconnected banner */}
        {(wsStatus === 'disconnected' || wsStatus === 'error') && view === 'tracking' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2 animate-fade-in">
            <span>⚡</span>
            <span>Lost connection — trying to reconnect. Status may be out of date.</span>
          </div>
        )}

        {fetchError && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-sm text-yellow-700">
            ⚠ {fetchError}
          </div>
        )}

        {view === 'loading' && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {view === 'place_order' && (
          <div className="animate-fade-in">
            <div className="mb-5">
              <h1 className="text-xl font-bold text-gray-900">Order food</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Hi {user.name.split(' ')[0]}! Ready to order?
              </p>
            </div>
            <PlaceOrderForm onOrderPlaced={handleOrderPlaced} />
          </div>
        )}

        {view === 'tracking' && order && (
          <div className="animate-fade-in space-y-5">
            <div className="card p-6">
              <StatusProgress status={order.status} />
            </div>
            <OrderDetailsCard order={order} />
            <div className="text-center text-xs text-gray-400 pt-1">
              You can place a new order once this one is delivered.
            </div>
          </div>
        )}

        {view === 'delivered' && order && (
          <div className="animate-fade-in text-center py-8 space-y-4">
            <div className="text-6xl mb-2">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900">Order Delivered!</h2>
            <p className="text-gray-500 text-sm">We hope you enjoy your meal.</p>
            <OrderDetailsCard order={order} />
            <button
              onClick={() => {
                setOrder(null);
                setView('place_order');
              }}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition text-sm"
            >
              Order again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}