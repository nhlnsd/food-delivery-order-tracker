import { OrderStatus } from '@/types';

export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  'placed',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Order Placed',
  confirmed: 'Order Confirmed',
  preparing: 'Preparing Your Food',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
};

export const STATUS_CUSTOMER_MESSAGES: Record<OrderStatus, string> = {
  placed: 'Your order has been sent to the restaurant.',
  confirmed: 'The restaurant has accepted your order.',
  preparing: 'The kitchen is preparing your food.',
  out_for_delivery: 'Your order is on its way!',
  delivered: 'Enjoy your meal!',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  placed: 'text-blue-600 bg-blue-50',
  confirmed: 'text-indigo-600 bg-indigo-50',
  preparing: 'text-amber-600 bg-amber-50',
  out_for_delivery: 'text-orange-600 bg-orange-50',
  delivered: 'text-green-600 bg-green-50',
};

export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: 'confirmed',
  confirmed: 'preparing',
  preparing: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

export const NEXT_STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  placed: 'Confirm Order',
  confirmed: 'Start Preparing',
  preparing: 'Mark Out for Delivery',
  out_for_delivery: 'Mark as Delivered',
};

export function getStatusIndex(status: OrderStatus): number {
  return ORDER_STATUS_SEQUENCE.indexOf(status);
}

export function isCompleted(status: OrderStatus): boolean {
  return status === 'delivered';
}
