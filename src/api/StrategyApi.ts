import client from "./client";
import type { RebalanceHistoryResponse, RebalanceDetailDto } from "../types/Rebalance";

/** 리밸런스 이력 목록 조회 */
export async function getRebalanceHistory() {
  return client.get<RebalanceHistoryResponse>("/strategy/rebalance/history");
}

/** 리밸런스 상세 조회 */
export async function getRebalanceDetail(rebalanceId: string) {
  return client.get<RebalanceDetailDto>(`/strategy/rebalance/history/${rebalanceId}`);
}