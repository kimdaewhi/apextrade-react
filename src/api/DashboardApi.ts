// ─────────────────────────────────────────────────────────────
// 자금 대시보드용 API 클라이언트 추가분
//
// 기존 api/AccountApi.ts 등을 통째로 교체하지 말고,
// 아래 함수들을 적절한 API 파일에 추가하거나 이 파일을
// api/DashboardApi.ts 로 저장해서 사용한다.
//
// ⚠️ 기존 getDashboard()는 구 백엔드 응답 구조 기준의 AccountDashboardDto를
//    참조하므로 이번 대시보드에서는 사용하지 않는다.
// ─────────────────────────────────────────────────────────────
import client from "./client";
import type {
  BalanceResponseDto,
  OrderDto,
  RebalanceHistoryDto,
  RebalanceDetailDto,
} from "../types/Dashboard";

// ─── 계좌 ───

/** 계좌 잔고 원본 조회 (예수금 D+0/D+1/D+2, 당일 매매 금액·수량 포함)
 *  근거: app/api/router_account.py :: GET /account/balance */
export async function getAccountBalance() {
  return client.get<BalanceResponseDto>("/account/balance");
}

// ─── 주문 조회 ───

/** 주문지 전체 목록 조회 (체결 내역은 클라이언트에서 filled_qty > 0 필터)
 *  근거: app/api/router_order_query.py :: GET /order-query/domestic-stock/order-list */
export async function getOrderList() {
  return client.get<OrderDto[]>("/order-query/domestic-stock/order-list");
}

// ─── 리밸런싱 ───

/** 리밸런스 실행 이력 목록 (최신순, 페이징)
 *  근거: app/api/router_strategy.py :: GET /strategy/rebalance/history */
export async function getRebalanceHistory(limit = 5, offset = 0) {
  return client.get<RebalanceHistoryDto>(
    `/strategy/rebalance/history?limit=${limit}&offset=${offset}`
  );
}

/** 리밸런스 상세 조회 (유지 종목 수 hold_count는 상세에만 있음)
 *  근거: app/api/router_strategy.py :: GET /strategy/rebalance/history/{rebalance_id} */
export async function getRebalanceDetail(rebalanceId: string) {
  return client.get<RebalanceDetailDto>(
    `/strategy/rebalance/history/${rebalanceId}`
  );
}
