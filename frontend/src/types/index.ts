export type UserRole = 'customer' | 'restaurant';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  restaurantId: number | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered';

export interface OrderItem {
  id: number;
  orderId: number;
  name: string;
  quantity: number;
  price: number;
}

export interface Restaurant {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
}

export interface Order {
  id: number;
  customerId: number;
  restaurantId: number;
  status: OrderStatus;
  deliveryAddress: string;
  totalAmount: number;
  estimatedDeliveryMinutes: number;
  notes: string | null;
  items: OrderItem[];
  restaurant: Restaurant;
  customer: { id: number; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    message: string;
    code: number;
    details?: unknown;
  };
}
