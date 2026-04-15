/** 리밸런스 이력 목록 응답 */
export interface RebalanceHistoryResponse {
  total_count: number;
  items: RebalanceHistoryItem[];
}

/** 리밸런스 이력 목록 아이템 */
export interface RebalanceHistoryItem {
  id: string;
  strategy_name: string;
  screener_name: string;
  status: string;
  buy_signal_count: number;
  buy_count: number;
  sell_count: number;
  executed_at: string;
  completed_at: string | null;
}

/** 리밸런스 상세 응답 */
export interface RebalanceDetailDto {
  id: string;
  strategy_name: string;
  screener_name: string;
  status: string;
  universe_count: number;
  buy_signal_count: number;
  buy_count: number;
  sell_count: number;
  hold_count: number;
  total_sell_value: string;
  total_buy_value: string;
  available_cash_before: string;
  estimated_cash_after: string;
  dry_run: boolean;
  strategy_params: StrategyParams;
  executed_at: string;
  completed_at: string | null;
  execution_summary: ExecutionSummary;
  orders: RebalanceOrderDto[];
}

/** 전략 파라미터 */
export interface StrategyParams {
  top_n: number | null;
  threshold: number | null;
  abs_threshold: number | null;
  lookback_days: number | null;
}

/** 실행 요약 지표 */
export interface ExecutionSummary {
  signal_count: number;
  filled_count: number;
  fail_rate: number;
  available_cash_before: string;
  estimated_cash_after: string;
  cash_ratio: number;
  rebalance_duration_seconds: number;
  avg_fill_duration_seconds: number;
}

/** 리밸런스 주문 정보 */
export interface RebalanceOrderDto {
  id: string;
  stock_code: string;
  order_pos: string;
  order_type: string;
  order_qty: number;
  filled_qty: number;
  remaining_qty: number;
  avg_fill_price: string | null;
  status: string;
  submitted_at: string | null;
  updated_at: string;
  fill_duration_seconds: number;
}