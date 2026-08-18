import client from "./client";
import type { PerformanceDto } from "../types/Metrics";

/**
 * 전략 성과 지표 조회
 *
 * start_date 를 넘기지 않으면 서버 기본값(최초 스냅샷 기준)을 따른다.
 */
export async function getPerformance(params?: {
  start_date?: string;   // YYYY-MM-DD
  as_of_date?: string;   // YYYY-MM-DD
}) {
  return client.get<PerformanceDto>("/metrics/performance", { params });
}