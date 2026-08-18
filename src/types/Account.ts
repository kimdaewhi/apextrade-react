/** 보유 종목 정보 */
export interface HoldingDto {
  stock_code: string;
  stock_name: string;
  holding_qty: string;
  avg_buy_price: string;
  current_price: string;
  purchase_amount: string;
  evaluation_amount: string;
  profit_loss_amount: string;
  profit_loss_rate: string;
}

/** 계좌 요약 정보 */
export interface AccountSummaryDto {

  settlement_cash_amount: string;
  stock_evaluation_amount: string;
  total_evaluation_amount: string;
  net_asset_amount: string;
  total_purchase_amount: string;
  total_profit_loss_amount: string;
  holding_stock_count: string
}


/** 계좌 대시보드 전체 응답 */
export interface AccountDashboardDto {
  account_summary: AccountSummaryDto;
  holding_list: HoldingDto[];
}