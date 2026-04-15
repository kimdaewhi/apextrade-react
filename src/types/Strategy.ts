/** 전략 실행 응답 (공통) */
export interface StrategyRunResponse {
  strategy_name: string;
  strategy_type: string;
  success: boolean;
  dry_run: boolean;
  error_message: string | null;
  summary: string | null;
  metadata: Record<string, any>;
}