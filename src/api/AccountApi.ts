import client from "./client";
import type { AccountDashboardDto, AccountSummaryDto, HoldingDto, HoldingStatsDto, TodayTradingSummaryDto, ProfitLossDto, TopHoldingPairDto } from "../types/Account";

// ─── 대시보드 통합 조회 ───

/** 대시보드 전체 데이터 (1회 호출) */
export async function getDashboard() {
  return client.get<AccountDashboardDto>("/account/dashboard");
}

// ─── 개별 조회 (필요 시) ───

/** 계좌 요약 */
export async function getAccountSummary() {
  return client.get<AccountSummaryDto>("/account/summary");
}

/** 보유 종목 목록 */
export async function getHoldings() {
  return client.get<HoldingDto[]>("/account/holdings");
}

/** 보유 종목 통계 */
export async function getHoldingStats() {
  return client.get<HoldingStatsDto>("/account/stats");
}

/** 당일 매매 현황 */
export async function getTodayTradingSummary() {
  return client.get<TodayTradingSummaryDto>("/account/today");
}

/** 수익/손실 종목 분리 */
export async function getProfitLoss() {
  return client.get<ProfitLossDto>("/account/profit-loss");
}

/** 매도 가능 종목 */
export async function getSellableHoldings() {
  return client.get<HoldingDto[]>("/account/sellable");
}

/** 최고 수익/손실 종목 */
export async function getTopHoldings() {
  return client.get<TopHoldingPairDto>("/account/top");
}