'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Restaurant } from '@/types';
import { restaurantsApi, ordersApi } from '@/lib/api';

interface PlaceOrderFormProps {
  onOrderPlaced: () => void;
}

const SAMPLE_MENU = [
  { name: 'Butter Chicken', price: 280 },
  { name: 'Paneer Tikka Masala', price: 260 },
  { name: 'Dal Makhani', price: 200 },
  { name: 'Garlic Naan (2)', price: 80 },
  { name: 'Mango Lassi', price: 125 },
  { name: 'Gulab Jamun (2)', price: 90 },
];

export function PlaceOrderForm({ onOrderPlaced }: PlaceOrderFormProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);

  useEffect(() => {
    restaurantsApi
      .list()
      .then((res) => {
        setRestaurants(res.data.restaurants);
        if (res.data.restaurants.length > 0) {
          setRestaurantId(res.data.restaurants[0].id);
        }
      })
      .catch(() => setError('Could not load restaurants'))
      .finally(() => setLoadingRestaurants(false));
  }, []);

  function toggleItem(name: string, price: number) {
    setSelectedItems((prev) => {
      const qty = prev[name] || 0;
      if (qty === 0) return { ...prev, [name]: 1 };
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  }

  function changeQty(name: string, delta: number) {
    setSelectedItems((prev) => {
      const qty = (prev[name] || 0) + delta;
      if (qty <= 0) {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      }
      return { ...prev, [name]: qty };
    });
  }

  const orderItems = SAMPLE_MENU.filter((m) => selectedItems[m.name] > 0).map((m) => ({
    name: m.name,
    price: m.price,
    quantity: selectedItems[m.name],
  }));

  const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!restaurantId) return setError('Select a restaurant');
    if (orderItems.length === 0) return setError('Add at least one item');
    if (!deliveryAddress.trim()) return setError('Enter delivery address');

    setError('');
    setLoading(true);
    try {
      await ordersApi.placeOrder({ restaurantId, deliveryAddress, items: orderItems, notes });
      onOrderPlaced();
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  }

  if (loadingRestaurants) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          ⚠ {error}
        </div>
      )}

      {/* Restaurant selector */}
      <div className="card p-4">
        <label className="block text-sm font-semibold text-gray-900 mb-3">Restaurant</label>
        <div className="space-y-2">
          {restaurants.map((r) => (
            <label
              key={r.id}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                restaurantId === r.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="restaurant"
                value={r.id}
                checked={restaurantId === r.id}
                onChange={() => setRestaurantId(r.id)}
                className="accent-orange-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{r.name}</p>
                {r.address && <p className="text-xs text-gray-500">{r.address}</p>}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Menu */}
      <div className="card p-4">
        <label className="block text-sm font-semibold text-gray-900 mb-3">Menu</label>
        <div className="space-y-2">
          {SAMPLE_MENU.map((item) => {
            const qty = selectedItems[item.name] || 0;
            return (
              <div
                key={item.name}
                className={`flex items-center justify-between p-3 rounded-xl border transition ${
                  qty > 0 ? 'border-orange-200 bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">₹{item.price}</p>
                </div>
                {qty === 0 ? (
                  <button
                    type="button"
                    onClick={() => toggleItem(item.name, item.price)}
                    className="text-xs font-semibold text-orange-600 border border-orange-300 px-3 py-1 rounded-lg hover:bg-orange-100 transition"
                  >
                    + Add
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changeQty(item.name, -1)}
                      className="w-7 h-7 rounded-full border border-orange-300 text-orange-600 font-bold flex items-center justify-center hover:bg-orange-100 transition"
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold text-gray-900 w-4 text-center">{qty}</span>
                    <button
                      type="button"
                      onClick={() => changeQty(item.name, 1)}
                      className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center hover:bg-orange-600 transition"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery address */}
      <div className="card p-4">
        <label className="block text-sm font-semibold text-gray-900 mb-2">Delivery address</label>
        <input
          type="text"
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          placeholder="10 Koramangala, Bangalore"
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
        />
        <label className="block text-sm font-semibold text-gray-900 mt-3 mb-2">
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="No onions, extra spicy..."
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
        />
      </div>

      {/* Submit */}
      <div className="card p-4">
        {orderItems.length > 0 && (
          <div className="mb-4 space-y-1">
            {orderItems.map((i) => (
              <div key={i.name} className="flex justify-between text-sm text-gray-600">
                <span>{i.name} ×{i.quantity}</span>
                <span>₹{i.price * i.quantity}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold text-gray-900 border-t pt-2 mt-2">
              <span>Total</span>
              <span className="text-orange-600">₹{total}</span>
            </div>
          </div>
        )}
        <button
          type="submit"
          disabled={loading || orderItems.length === 0}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Placing order...
            </>
          ) : (
            `Place Order${total > 0 ? ` — ₹${total}` : ''}`
          )}
        </button>
      </div>
    </form>
  );
}
