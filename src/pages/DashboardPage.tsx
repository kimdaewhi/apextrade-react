// ─────────────────────────────────────────────────────────────
// 자금 대시보드
//
// 성격: "자산의 성과"가 아니라 "자금"을 다룬다.
//   - 돈이 지금 어디 있고(가용 자산 / 정산 흐름),
//   - 어디로 움직였고(오늘의 거래 / 최근 체결),
//   - 언제 움직일 예정인가(D+1·D+2 정산 / 리밸런싱 예정)
// 수익률·손익·성과 지표는 전략 페이지 소관이므로 넣지 않는다.
//
// 섹션별로 독립 fetch — 한 섹션의 API 실패가 다른 섹션을 죽이지 않는다.
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import {
  Wallet,
  Banknote,
  Coins,
  CalendarClock,
  ArrowLeftRight,
  Landmark,
  Repeat,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  getAccountBalance,
  getOrderList,
  getRebalanceHistory,
  getRebalanceDetail,
} from "../api/DashboardApi";
import type {
  BalanceResponseDto,
  OrderDto,
  RebalanceHistoryDto,
  RebalanceDetailDto,
} from "../types/Dashboard";

// ══════════════════════════════════════════
// 포맷 헬퍼
// ══════════════════════════════════════════

// ⚙️ 오늘 날짜를 yyyy.mm.dd 형식으로 반환 (KST 기준)
const formatToday = (): string =>
  new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replace(/\.\s?$/, "")
    .replace(/\.\s/g, ".");
const todayLabel = formatToday();

const formatNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return num.toLocaleString();
};

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
};

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ORDER_POS_LABEL: Record<string, string> = { buy: "매수", sell: "매도" };

const REBALANCE_STATUS_LABEL: Record<string, string> = {
  RUNNING: "실행 중",
  COMPLETED: "완료",
  FAILED: "실패",
};

// ══════════════════════════════════════════
// 섹션별 독립 fetch 훅
// ══════════════════════════════════════════

interface SectionState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useSection<T>(fetcher: () => Promise<T>): [SectionState<T>, () => void] {
  const [state, setState] = useState<SectionState<T>>({ data: null, loading: true, error: null });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
    } catch (err: any) {
      setState({
        data: null,
        loading: false,
        error: err.response?.data?.detail || err.message || "데이터를 불러오지 못했습니다.",
      });
    }
  }, [fetcher]);

  useEffect(() => {
    load();
  }, [load]);

  return [state, load];
}

// ── fetcher (컴포넌트 밖에 정의해 참조를 안정화) ──

const fetchBalance = async (): Promise<BalanceResponseDto> => {
  return (await getAccountBalance()).data;
};

/** 최근 체결 내역: 전체 주문에서 체결 수량이 있는 건만 최신순 상위 10건 */
const fetchRecentFills = async (): Promise<OrderDto[]> => {
  const orders = (await getOrderList()).data;
  return orders
    .filter((o) => Number(o.filled_qty) > 0)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10);
};

interface RebalanceSectionData {
  history: RebalanceHistoryDto;
  latestDetail: RebalanceDetailDto | null;
}

/** 리밸런싱: 이력 목록 + 최신 1건 상세(유지 종목 수는 상세에만 있음) */
const fetchRebalance = async (): Promise<RebalanceSectionData> => {
  const history = (await getRebalanceHistory(5, 0)).data;
  let latestDetail: RebalanceDetailDto | null = null;
  if (history.items.length > 0) {
    try {
      latestDetail = (await getRebalanceDetail(history.items[0].id)).data;
    } catch {
      // 상세 조회 실패는 목록 표시를 막지 않는다
      latestDetail = null;
    }
  }
  return { history, latestDetail };
};

// ══════════════════════════════════════════
// 섹션 공통 UI
// ══════════════════════════════════════════

function SectionLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="animate-spin text-gray-400" size={28} />
    </div>
  );
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <p className="text-sm text-gray-500">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <RefreshCw size={14} />
        다시 시도
      </button>
    </div>
  );
}

/** 준비 중(백엔드 API 미제공) 안내 — 섹션 틀은 유지하고 내용만 비활성 표시 */
function PendingNotice({ description }: { description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-1">
      <p className="text-gray-400">준비 중입니다</p>
      {description && <p className="text-xs text-gray-400">{description}</p>}
    </div>
  );
}

// ══════════════════════════════════════════
// 페이지
// ══════════════════════════════════════════

export function DashboardPage() {
  const [balanceState, loadBalance] = useSection(fetchBalance);
  const [fillsState, loadFills] = useSection(fetchRecentFills);
  const [rebalanceState, loadRebalance] = useSection(fetchRebalance);

  const refreshAll = () => {
    loadBalance();
    loadFills();
    loadRebalance();
  };

  // ── 잔고 파생값 (가용 자산 + 오늘의 거래는 /account/balance 1회 호출을 공유) ──
  const summary = balanceState.data?.output2?.[0] ?? null;
  const holdings = balanceState.data?.output1 ?? [];

  // 당일 매수/매도 수량: 종목별(output1) 당일 수량을 합산
  const todayBuyQty = holdings.reduce((sum, it) => sum + Number(it.thdt_buyqty || 0), 0);
  const todaySellQty = holdings.reduce((sum, it) => sum + Number(it.thdt_sll_qty || 0), 0);

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">자금 대시보드</h2>
          <p className="text-gray-600 mt-1">현금 흐름과 정산 일정</p>
        </div>
        <button
          onClick={refreshAll}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={16} />
          새로고침
        </button>
      </div>

      {/* ══════════════ 1. 가용 자산 ══════════════ */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {/* 총 평가금액 */}
        <Card className="p-6 shadow-sm">
          {balanceState.loading ? (
            <SectionLoading />
          ) : balanceState.error || !summary ? (
            <SectionError message={balanceState.error || "요약 정보가 없습니다."} onRetry={loadBalance} />
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">총 평가금액</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.tot_evlu_amt)}원</p>
                <p className="text-sm text-gray-500 mt-2">정산기준현금 + 주식 평가금액</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Wallet className="text-blue-600" size={24} />
              </div>
            </div>
          )}
        </Card>

        {/* 주식 평가금액 */}
        <Card className="p-6 shadow-sm">
          {balanceState.loading ? (
            <SectionLoading />
          ) : balanceState.error || !summary ? (
            <SectionError message={balanceState.error || "요약 정보가 없습니다."} onRetry={loadBalance} />
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">주식 평가금액</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.scts_evlu_amt)}원</p>
                <p className="text-sm text-gray-500 mt-2">보유 주식 평가 합계</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Coins className="text-purple-600" size={24} />
              </div>
            </div>
          )}
        </Card>

        {/* 예수금 총액 */}
        <Card className="p-6 shadow-sm">
          {balanceState.loading ? (
            <SectionLoading />
          ) : balanceState.error || !summary ? (
            <SectionError message={balanceState.error || "요약 정보가 없습니다."} onRetry={loadBalance} />
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">예수금 총액</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.dnca_tot_amt)}원</p>
                <p className="text-sm text-gray-500 mt-2">오늘 기준 계좌 현금 (D+0)</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Banknote className="text-green-600" size={24} />
              </div>
            </div>
          )}
        </Card>

        {/* 주문 가능 현금 — 백엔드 API 미노출 (준비 중) */}
        {/* TODO(P2/개선): 매수가능금액 조회 API(AccountService.get_available_buy 라우터 노출) 구현 후 연결 */}
        <Card className="p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">주문 가능 현금</p>
              <p className="text-2xl font-bold text-gray-400">준비 중</p>
              <p className="text-xs text-gray-400 mt-2">미수 없는 매수가능금액 API 연동 예정</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Coins className="text-gray-400" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* ── 정산 현금 흐름 + 오늘의 거래 ── */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* 정산 현금 흐름 (D+0 → D+1 → D+2) */}
        <Card className="p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="text-gray-500" size={18} />
            <h3 className="text-base font-semibold text-gray-900">정산 현금 흐름</h3>
          </div>
          {balanceState.loading ? (
            <SectionLoading />
          ) : balanceState.error || !summary ? (
            <SectionError message={balanceState.error || "요약 정보가 없습니다."} onRetry={loadBalance} />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">오늘 (D+0)</p>
                  <p className="text-lg font-bold text-gray-900">{formatNumber(summary.dnca_tot_amt)}원</p>
                  <p className="text-xs text-gray-500 mt-1">예수금 총액</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">내일 (D+1)</p>
                  <p className="text-lg font-bold text-gray-900">{formatNumber(summary.nxdy_excc_amt)}원</p>
                  <p className="text-xs text-gray-500 mt-1">익일 정산 금액</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">모레 (D+2)</p>
                  <p className="text-lg font-bold text-emerald-700">{formatNumber(summary.prvs_rcdl_excc_amt)}원</p>
                  <p className="text-xs text-gray-500 mt-1">정산기준현금</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                거래 대금은 2영업일 후 정산됩니다.
              </p>
            </>
          )}
        </Card>

        {/* ══════════════ 2. 오늘의 거래 ══════════════ */}
        <Card className="p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="text-gray-500" size={18} />
              <h3 className="text-base font-semibold text-gray-900">당일 거래</h3>
            </div>
            <span className="text-sm text-gray-400">{todayLabel} 기준</span>
          </div>
          {balanceState.loading ? (
            <SectionLoading />
          ) : balanceState.error || !summary ? (
            <SectionError message={balanceState.error || "요약 정보가 없습니다."} onRetry={loadBalance} />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-sky-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">당일 매수</p>
                <p className="text-xl font-bold text-sky-700">{formatNumber(summary.thdt_buy_amt)}원</p>
                <p className="text-sm text-gray-600 mt-1">{formatNumber(todayBuyQty)}주</p>
              </div>
              <div className="p-4 bg-rose-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">당일 매도</p>
                <p className="text-xl font-bold text-rose-700">{formatNumber(summary.thdt_sll_amt)}원</p>
                <p className="text-sm text-gray-600 mt-1">{formatNumber(todaySellQty)}주</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ══════════════ 3. 최근 체결 내역 ══════════════ */}
      <Card className="p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">최근 체결 내역</h3>
          <span className="text-sm text-gray-500">최근 10건</span>
        </div>

        {fillsState.loading ? (
          <SectionLoading />
        ) : fillsState.error ? (
          <SectionError message={fillsState.error} onRetry={loadFills} />
        ) : !fillsState.data || fillsState.data.length === 0 ? (
          <p className="text-center text-gray-400 py-12">체결 내역이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">체결일시</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">종목</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">구분</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">체결수량</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">체결단가</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">체결금액</th>
                </tr>
              </thead>
              <tbody>
                {fillsState.data.map((order) => {
                  const isBuy = order.order_pos === "buy";
                  const avgPrice = Number(order.avg_fill_price ?? 0);
                  const fillAmount = Math.round(avgPrice * order.filled_qty);

                  return (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDateTime(order.updated_at)}</td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-gray-900">{order.stock_name || order.stock_code}</p>
                        <p className="text-xs text-gray-500">{order.stock_code}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            isBuy ? "bg-sky-50 text-sky-700" : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {ORDER_POS_LABEL[order.order_pos] ?? order.order_pos}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">{formatNumber(order.filled_qty)}주</td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">{formatNumber(avgPrice.toFixed(0))}원</td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">{formatNumber(fillAmount)}원</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ══════════════ 4. 리밸런싱 내역 / 예정 ══════════════ */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* 최근 리밸런싱 실행 결과 */}
        <Card className="p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Repeat className="text-gray-500" size={18} />
            <h3 className="text-base font-semibold text-gray-900">최근 리밸런싱</h3>
          </div>

          {rebalanceState.loading ? (
            <SectionLoading />
          ) : rebalanceState.error ? (
            <SectionError message={rebalanceState.error} onRetry={loadRebalance} />
          ) : !rebalanceState.data || rebalanceState.data.history.items.length === 0 ? (
            <p className="text-center text-gray-400 py-12">리밸런싱 실행 이력이 없습니다.</p>
          ) : (
            <>
              {/* 최신 1건 요약 */}
              {(() => {
                const latest = rebalanceState.data.history.items[0];
                const detail = rebalanceState.data.latestDetail;
                return (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {latest.strategy_name}
                          {detail?.dry_run && (
                            <span className="ml-2 px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700">DRY RUN</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(latest.executed_at)}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          latest.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700"
                            : latest.status === "FAILED"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-sky-50 text-sky-700"
                        }`}
                      >
                        {REBALANCE_STATUS_LABEL[latest.status] ?? latest.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-sky-50 rounded-lg text-center">
                        <p className="text-xs text-gray-500 mb-1">편입</p>
                        <p className="text-lg font-bold text-sky-700">{latest.buy_count}종목</p>
                      </div>
                      <div className="p-3 bg-rose-50 rounded-lg text-center">
                        <p className="text-xs text-gray-500 mb-1">편출</p>
                        <p className="text-lg font-bold text-rose-700">{latest.sell_count}종목</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-xs text-gray-500 mb-1">유지</p>
                        <p className="text-lg font-bold text-gray-700">
                          {detail ? `${detail.hold_count}종목` : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 이력 목록 (최신 제외 최대 4건) */}
              {rebalanceState.data.history.items.length > 1 && (
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  {rebalanceState.data.history.items.slice(1).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{formatDate(item.executed_at)}</span>
                      <span className="text-gray-500">
                        편입 {item.buy_count} · 편출 {item.sell_count}
                      </span>
                      <span
                        className={`text-xs ${
                          item.status === "COMPLETED"
                            ? "text-emerald-600"
                            : item.status === "FAILED"
                            ? "text-rose-600"
                            : "text-sky-600"
                        }`}
                      >
                        {REBALANCE_STATUS_LABEL[item.status] ?? item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>

        {/* 다음 리밸런싱 예정 — 백엔드 API 미노출 (준비 중) */}
        {/* TODO(P2/개선): 다음 리밸런싱 예정일 API(RebalanceWindow.next_rebalance_date 노출) 구현 후 연결 */}
        <Card className="p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="text-gray-500" size={18} />
            <h3 className="text-base font-semibold text-gray-900">다음 리밸런싱 예정</h3>
          </div>
          <PendingNotice description="예정일 계산 API 연동 예정 (직전 실행일 + 30일, 영업일 보정)" />
        </Card>
      </div>

      {/* ══════════════ 5. 입출금 내역 ══════════════ */}
      {/* TODO(P2/개선): 입출금 내역 API(KIS 계좌 입출금 거래내역 조회) 구현 후 연결 */}
      <Card className="p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Landmark className="text-gray-500" size={18} />
          <h3 className="text-base font-semibold text-gray-900">입출금 내역</h3>
        </div>
        <PendingNotice description="입금·출금 거래내역 API 연동 예정" />
      </Card>
    </div>
  );
}
