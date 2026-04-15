import client from "./client";
import type { OrderDto } from "../types/Order";
import type { KillSwitchResponse } from "../types/Safety";

// ─── 주문 유형 정규화 ───
type OrderType = "market" | "limit" | "conditional";

const ORDER_TYPE_MAP: Record<string, OrderType> = {
  market: "market",
  시장가: "market",
  limit: "limit",
  지정가: "limit",
  conditional: "conditional",
  조건부지정가: "conditional",
};

function normalizeOrderType(orderType: string): OrderType {
  const normalized = ORDER_TYPE_MAP[orderType.trim().toLowerCase()];
  if (!normalized) throw new Error(`유효하지 않은 주문 유형입니다: ${orderType}`);
  return normalized;
}

// ─── 주문 실행 ───

/** 매수 주문 */
export async function buyDomesticStock(
  stockCode: string,
  quantity: number,
  orderType: string,
  price: number,
  dryRun: boolean = false,
) {
  const normalized = normalizeOrderType(orderType);
  const orderPrice = normalized === "market" ? 0 : price;

  return client.post<string>("/order/domestic-stock/buy", null, {
    params: { stock_code: stockCode, quantity, order_type: normalized, price: orderPrice, dry_run: dryRun },
  });
}

/** 매도 주문 */
export async function sellDomesticStock(
  stockCode: string,
  quantity: number,
  orderType: string,
  price: number,
  dryRun: boolean = false,
) {
  const normalized = normalizeOrderType(orderType);
  const orderPrice = normalized === "market" ? 0 : price;

  return client.post<string>("/order/domestic-stock/sell", null, {
    params: { stock_code: stockCode, quantity, order_type: normalized, price: orderPrice, dry_run: dryRun },
  });
}

/** 취소 주문 */
export async function cancelOrder(
  orderId: string,
  quantity: number,
  dryRun: boolean = false,
) {
  return client.post<string>("/order/domestic-stock/cancel", null, {
    params: { order_id: orderId, quantity, dry_run: dryRun },
  });
}

/** 정정 주문 */
export async function reviseOrder(
  orderId: string,
  orderType: string,
  quantity: number,
  price: number,
  dryRun: boolean = false,
) {
  const normalized = normalizeOrderType(orderType);
  const orderPrice = normalized === "market" ? 0 : price;

  return client.post<string>("/order/domestic-stock/revise", null, {
    params: { order_no: orderId, quantity, order_type: normalized, price: orderPrice, dry_run: dryRun },
  });
}

// ─── 주문 조회 ───

/** 전체 주문 목록 */
export async function getOrderList() {
  return client.get<OrderDto[]>("/order-query/domestic-stock/order-list");
}

/** 종목코드별 주문 목록 */
export async function getOrderListByStockCode(stockCode: string) {
  return client.get<OrderDto[]>(`/order-query/domestic-stock/order-list/${stockCode}`);
}

/** 상태별 주문 목록 */
export async function getOrderListByStatus(status: string) {
  return client.get<OrderDto[]>(`/order-query/domestic-stock/order-list/status/${status}`);
}

/** 액션별 주문 목록 */
export async function getOrderListByOrderAction(orderAction: string) {
  return client.get<OrderDto[]>(`/order-query/domestic-stock/order-list/order-action/${orderAction}`);
}

// ─── Kill Switch ───

/** Kill Switch 상태 조회 */
export async function getKillSwitchStatus() {
  return client.get<KillSwitchResponse>("/safety/kill-switch");
}

/** Kill Switch 상태 변경 */
export async function changeKillSwitch(enabled: boolean) {
  return client.patch<KillSwitchResponse>("/safety/kill-switch", { enabled });
}