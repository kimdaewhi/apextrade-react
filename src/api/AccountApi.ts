import client from "./client";
import type { AccountDashboardDto, AccountSummaryDto, HoldingDto, HoldingStatsDto, TodayTradingSummaryDto, ProfitLossDto, TopHoldingPairDto } from "../types/Account";

// ─── 대시보드 통합 조회 ───

/** 대시보드 전체 데이터 (1회 호출) */
export async function getDashboard() {
  return client.get<AccountDashboardDto>("/account/dashboard");
}