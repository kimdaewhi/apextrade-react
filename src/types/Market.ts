/** 시장 지수 */
export interface MarketIndexDto {
  name: string;            // KOSPI / KOSDAQ
  base_date: string;       // YYYY-MM-DD
  close_price: string;
  change_amount: string;
  change_rate: string;
}