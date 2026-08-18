/**
 * 전략 성과 지표 (GET /strategy/metrics)
 *
 * 비율 계열은 모두 퍼센트 단위로 내려온다. (4.2 = 4.2%)
 * 단, sharpe_ratio / profit_factor 는 배수이므로 변환되지 않는다.
 * 데이터가 부족해 산출할 수 없는 지표는 null 로 내려온다.
 */

/** 운용 기간 */
export interface PeriodDto {
  start: string | null;          // YYYY-MM-DD, 최초 스냅샷 기준일
  end: string | null;            // YYYY-MM-DD, 마지막 거래일
  days: number;                  // 달력일
  trading_days: number;          // 거래일 수
  rebalance_count: number;       // 리밸런싱 실행 횟수
}

/** 수익 지표 */
export interface ReturnMetricsDto {
  total_return: number | null;               // 전체 수익률 (%)
  period_profit: number | null;              // 기간 손익 금액 (원)
  cagr: number | null;                       // 연환산 수익률 (%)

  benchmark_return: number | null;           // KOSPI 기간 수익률 (%). alpha 산출 기준
  benchmark_kosdaq_return: number | null;    // KOSDAQ 기간 수익률 (%). 비교 표시용

  alpha_vs_benchmark: number | null;         // 연율 알파 (%)
  excess_return: number | null;              // total_return - benchmark_return (%p)
}

/** 위험 지표 */
export interface RiskMetricsDto {
  max_drawdown: number | null;       // 최대 낙폭 (%, 양수)
  mdd_max_days: number | null;       // 최대 낙폭 지속일 (고점 → 회복)
  mdd_current_days: number | null;   // 미회복 경과일 (회복 상태면 0)
  is_recovered: boolean | null;      // 마지막 낙폭 회복 여부
  volatility: number | null;         // 변동성 (%, 연환산)
  sharpe_ratio: number | null;       // 샤프 비율 (배수)
}

/** 리밸런싱 구간 지표 */
export interface RebalanceTradeMetricsDto {
  period_count: number;              // 수익률 산출 대상 구간 수
  win_rate: number | null;           // 승률 (%)
  avg_win: number | null;            // 평균 수익 구간 수익률 (%)
  avg_loss: number | null;           // 평균 손실 구간 수익률 (%)
  profit_factor: number | null;      // 총 이익 / 총 손실 (배수)
}

/** 회전율 지표 */
export interface TurnoverMetricsDto {
  turnover_rate: number | null;      // 회전율 (%, 연율 환산)
  total_buy_value: number;           // 총 매수 체결금액
  total_sell_value: number;          // 총 매도 체결금액
  avg_nav: number | null;            // 평균 순자산 (회전율 분모)
}

/** 일별 NAV 추이 한 점 */
export interface NavPointDto {
  date: string;                      // YYYY-MM-DD
  nav: number;                       // 그날의 계좌 총액
  benchmark: number | null;          // 그날의 KOSPI 지수
}

/** 전략 성과 지표 전체 응답 */
export interface PerformanceDto {
  period: PeriodDto;
  returns: ReturnMetricsDto;
  risk: RiskMetricsDto;
  trading: RebalanceTradeMetricsDto;
  turnover: TurnoverMetricsDto;
  nav_series: NavPointDto[];
}