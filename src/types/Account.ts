/** 보유 종목 정보 */
export interface HoldingDto {
  stock_code: string;
  stock_name: string;
  holding_qty: string;
  orderable_qty: string;
  avg_buy_price: string;
  current_price: string;
  purchase_amount: string;
  evaluation_amount: string;
  profit_loss_amount: string;
  profit_loss_rate: string;
  weight_rate: string;
}

/** 계좌 요약 정보 */
export interface AccountSummaryDto {
  cash_amount: string;
  settlement_cash_amount: string;
  stock_evaluation_amount: string;
  total_evaluation_amount: string;
  net_asset_amount: string;
  total_purchase_amount: string;
  total_profit_loss_amount: string;
  asset_change_amount: string;
  asset_change_rate: string;
}

/** 당일 거래 요약 */
export interface TodayTradingSummaryDto {
  today_buy_amount: string;
  today_sell_amount: string;
  today_buy_qty: string;
  today_sell_qty: string;
}

/** 수익/손실 종목 분리 */
export interface ProfitLossDto {
  profit_holdings: HoldingDto[];
  loss_holdings: HoldingDto[];
}

/** 수익/손실 상위 종목 */
export interface TopHoldingPairDto {
  top_profit_holding: HoldingDto | null;
  top_loss_holding: HoldingDto | null;
}

/** 보유종목 통계 */
export interface HoldingStatsDto {
  holding_stock_count: string;
  total_holding_qty: string;
}

/** 계좌 대시보드 전체 응답 */
export interface AccountDashboardDto {
  summary: AccountSummaryDto;
  holding_stats: HoldingStatsDto;
  today_trading: TodayTradingSummaryDto;
  holdings: HoldingDto[];
  profit_holdings: HoldingDto[];
  loss_holdings: HoldingDto[];
  sellable_holdings: HoldingDto[];
  top_holdings: TopHoldingPairDto;
}