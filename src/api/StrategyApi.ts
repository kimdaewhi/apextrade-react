import client from "./client";
import type { RebalanceHistoryResponse, RebalanceDetailDto, RebalanceSnapshotDto  } from "../types/Rebalance";

/** 리밸런스 이력 목록 조회 */
export async function getRebalanceHistory() {
  return client.get<RebalanceHistoryResponse>("/strategy/rebalance/history");
}

/** 리밸런스 상세 조회 */
export async function getRebalanceDetail(rebalanceId: string) {
  return client.get<RebalanceDetailDto>(`/strategy/rebalance/history/${rebalanceId}`);
}

/** 리밸런스 시점 포트폴리오 스냅샷 조회 */
export async function getRebalanceSnapshot(rebalanceId: string) {
  return client.get<RebalanceSnapshotDto>(
    `/strategy/rebalance/history/${rebalanceId}/snapshot`
  );
}