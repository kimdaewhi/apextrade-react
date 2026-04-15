import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";

// ─── 타입 ───
type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface OrderWsMessage {
  type: string;
  data?: any;
  message?: string;
}

type OrderEventHandler = (data: any) => void;

interface WebSocketContextValue {
  status: ConnectionStatus;
  subscribe: (eventType: string, handler: OrderEventHandler) => () => void;
}

// ─── Context ───
const WebSocketContext = createContext<WebSocketContextValue | null>(null);

// ─── Provider ───
const WS_URL = import.meta.env.VITE_WS_URL;
const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_INTERVAL = 30000;

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<OrderEventHandler>>>(new Map());
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(RECONNECT_INTERVAL);
  const mountedRef = useRef(true);

  const emit = useCallback((eventType: string, data: any) => {
    const handlers = listenersRef.current.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (e) {
          console.error(`[WS] handler error for ${eventType}:`, e);
        }
      });
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

    setStatus("connecting");

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setStatus("connected");
      reconnectDelayRef.current = RECONNECT_INTERVAL;
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const message: OrderWsMessage = JSON.parse(event.data);

        // ping/pong
        if (message.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
          return;
        }

        // connected 확인
        if (message.type === "connected") {
          return;
        }

        // 이벤트 전파
        emit(message.type, message.data);
      } catch (e) {
        console.error("[WS] parse error:", e);
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus("disconnected");
      wsRef.current = null;

      // 재연결 (exponential backoff)
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.5, MAX_RECONNECT_INTERVAL);
        connect();
      }, reconnectDelayRef.current);
    };

    ws.onerror = () => {
      // onclose가 이어서 호출되므로 여기서는 별도 처리 불필요
    };
  }, [emit]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // 재연결 방지
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const subscribe = useCallback((eventType: string, handler: OrderEventHandler) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType)!.add(handler);

    // cleanup 함수 반환
    return () => {
      listenersRef.current.get(eventType)?.delete(handler);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ status, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}

// ─── Hooks ───

/** WebSocket 연결 상태만 필요할 때 */
export function useWsStatus(): ConnectionStatus {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWsStatus must be used within WebSocketProvider");
  return ctx.status;
}

/** 특정 이벤트 구독 */
export function useWsSubscribe(eventType: string, handler: OrderEventHandler) {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWsSubscribe must be used within WebSocketProvider");

  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const stableHandler: OrderEventHandler = (data) => handlerRef.current(data);
    return ctx.subscribe(eventType, stableHandler);
  }, [ctx, eventType]);
}
