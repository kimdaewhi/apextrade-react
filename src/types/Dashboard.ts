// ─────────────────────────────────────────────────────────────
// 자금 대시보드 전용 타입 정의
//
// ⚠️ 기존 types/Account.ts의 AccountDashboardDto는 재사용하지 않는다.
//    (구 백엔드 응답 구조(summary/holding_stats/today_trading/holdings) 기준이라
//     현행 백엔드 AccountDashboardRead(account_summary/holding_list)와 불일치)
//
// 모든 필드명은 백엔드 스키마를 그대로 따른다(snake_case).
// 근거 파일은 각 타입 주석에 명기.
// ─────────────────────────────────────────────────────────────

// ══════════════════════════════════════════
// GET /account/balance
// 근거: app/schemas/kis/kis.py :: BalanceResponse / BalanceItem / BalanceSummary
// (사용하는 필드만 정의 — 실제 응답에는 더 많은 필드가 있다)
// ══════════════════════════════════════════

/** 계좌 잔고 - 종목별 상세(output1). KIS 원본이라 전부 문자열 숫자 */
export interface BalanceItemDto {
  pdno: string;               // 종목코드(6자리)
  prdt_name: string;          // 종목명
  thdt_buyqty: string;        // 당일 매수 수량
  thdt_sll_qty: string;       // 당일 매도 수량
  hldg_qty: string;           // 보유 수량
  evlu_amt: string;           // 평가 금액
}

/** 계좌 잔고 - 요약(output2[0]). KIS 원본이라 전부 문자열 숫자 */
export interface BalanceSummaryDto {
  dnca_tot_amt: string;       // 예수금 총액 (D+0)
  nxdy_excc_amt: string;      // 익일 정산 금액 (D+1 예수금)
  prvs_rcdl_excc_amt: string; // 가수도 정산 금액 (D+2 예수금 = 정산기준현금)
  thdt_buy_amt: string;       // 당일 매수 금액
  thdt_sll_amt: string;       // 당일 매도 금액
  scts_evlu_amt: string;      // 유가(주식) 평가 금액
  tot_evlu_amt: string;       // 총 평가 금액
  nass_amt: string;           // 순자산 금액
}

export interface BalanceResponseDto {
  rt_cd: string;              // 0: 성공
  msg_cd: string;
  msg1: string;
  output1: BalanceItemDto[];
  output2: BalanceSummaryDto[];
}

// ══════════════════════════════════════════
// GET /order-query/domestic-stock/order-list
// 근거: app/schemas/kis/order.py :: OrderRead
// (datetime은 KST isoformat 문자열로 직렬화됨 — OrderRead의 field_serializer)
// ══════════════════════════════════════════

export interface OrderDto {
  id: string;
  stock_code: string;
  stock_name: string;                     // 백엔드에서 DART 종목명 매핑 후 반환
  order_pos: string;                      // "buy" | "sell"
  order_kind: string;                     // "new" | "modify" | "cancel"
  order_type: string;                     // "market" | "limit"
  order_qty: number;
  status: string;                         // PENDING/.../FILLED/CANCELED/FAILED/TIME_OUT
  filled_qty: number;
  remaining_qty: number;
  avg_fill_price: string | number | null; // Decimal 직렬화 — 문자열/숫자 모두 방어
  requested_at: string;
  submitted_at: string | null;
  updated_at: string;
}

// ══════════════════════════════════════════
// GET /strategy/rebalance/history
// GET /strategy/rebalance/history/{id}
// 근거: app/schemas/rebalance/rebalance.py :: RebalanceListItem / RebalanceListResponse / RebalanceDetailResponse
// ══════════════════════════════════════════

export interface RebalanceListItemDto {
  id: string;
  strategy_name: string;
  screener_name: string | null;
  status: string;              // RUNNING | COMPLETED | FAILED
  buy_signal_count: number;
  buy_count: number;           // 편입
  sell_count: number;          // 편출
  executed_at: string;
  completed_at: string | null;
}

export interface RebalanceHistoryDto {
  total_count: number;
  items: RebalanceListItemDto[];
}

/** 상세 응답 중 대시보드에서 쓰는 필드만 정의 */
export interface RebalanceDetailDto {
  id: string;
  strategy_name: string;
  status: string;
  universe_count: number;
  buy_count: number;           // 편입
  sell_count: number;          // 편출
  hold_count: number;          // 유지 (목록 응답에는 없고 상세에만 있음)
  dry_run: boolean;
  executed_at: string;
  completed_at: string | null;
}
