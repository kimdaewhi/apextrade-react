import client from "./client";
import type { MarketIndexDto } from "../types/Market";

/** 주요 시장 지수 조회 (KOSPI, KOSDAQ) */
export async function getMarketSummary() {
  return client.get<MarketIndexDto[]>("/market/market-summary");
}