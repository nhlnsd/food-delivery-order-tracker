'use client';

import { OrderStatus } from '@/types';
import {
  ORDER_STATUS_SEQUENCE,
  STATUS_LABELS,
  STATUS_CUSTOMER_MESSAGES,
  getStatusIndex,
} from '@/lib/orderStatus';

const ICONS: Record<OrderStatus, string> = {
  placed: '📋',
  confirmed: '✅',
  preparing: '👨‍🍳',
  out_for_delivery: '🛵',
  delivered: '🎉',
};

interface StatusProgressProps {
  status: OrderStatus;
}

export function StatusProgress({ status }: StatusProgressProps) {
  const currentIndex = getStatusIndex(status);

  return (
    <div className="w-full">
      {/* Current status message */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">{ICONS[status]}</div>
        <h2 className="text-xl font-bold text-gray-900">{STATUS_LABELS[status]}</h2>
        <p className="text-gray-500 text-sm mt-1">{STATUS_CUSTOMER_MESSAGES[status]}</p>
      </div>

      {/* Progress steps */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute top-5 left-0 right-0 flex items-center px-8">
          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(currentIndex / (ORDER_STATUS_SEQUENCE.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {ORDER_STATUS_SEQUENCE.map((stepStatus, idx) => {
            const done = idx < currentIndex;
            const active = idx === currentIndex;
            const upcoming = idx > currentIndex;

            return (
              <div key={stepStatus} className="flex flex-col items-center" style={{ width: '20%' }}>
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-base border-2 transition-all duration-300 z-10 bg-white
                    ${done ? 'border-orange-500 bg-orange-500' : ''}
                    ${active ? 'border-orange-500 shadow-md shadow-orange-100 scale-110' : ''}
                    ${upcoming ? 'border-gray-200' : ''}
                  `}
                >
                  {done ? (
                    <span className="text-white text-sm">✓</span>
                  ) : (
                    <span className={upcoming ? 'grayscale opacity-40' : ''}>{ICONS[stepStatus]}</span>
                  )}
                </div>
                <span
                  className={`mt-2 text-center text-xs leading-tight font-medium px-1 ${
                    active ? 'text-orange-600' : done ? 'text-gray-500' : 'text-gray-300'
                  }`}
                >
                  {STATUS_LABELS[stepStatus].replace('Your Food is', '').replace(' Your Food', '')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
