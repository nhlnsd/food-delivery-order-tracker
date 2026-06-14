'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

type WsMessage = Record<string, unknown>;

interface UseWebSocketOptions {
  onMessage: (msg: WsMessage) => void;
  enabled?: boolean;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useWebSocket({ onMessage, enabled = true }: UseWebSocketOptions) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const pendingSubscriptions = useRef<WsMessage[]>([]);

  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current) return;

    setStatus('connecting');
    const socket = new WebSocket(`${WS_URL}/ws`);
    ws.current = socket;

    socket.onopen = () => {
      if (!mountedRef.current) return;
      setStatus('connected');
      // Flush pending subscriptions
      pendingSubscriptions.current.forEach((msg) => {
        socket.send(JSON.stringify(msg));
      });
      pendingSubscriptions.current = [];
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        onMessage(msg);
      } catch {}
    };

    socket.onclose = () => {
      if (!mountedRef.current) return;
      setStatus('disconnected');
      // Reconnect after 3s
      reconnectTimer.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 3000);
    };

    socket.onerror = () => {
      setStatus('error');
      socket.close();
    };
  }, [enabled, onMessage]);

  const send = useCallback((msg: WsMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    } else {
      pendingSubscriptions.current.push(msg);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [enabled, connect]);

  return { send, status };
}
