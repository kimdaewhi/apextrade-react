import { useEffect, useState, useMemo } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  BarChart3,
  LineChart as LineChartIcon,
} from "lucide-react";
import { getRebalanceHistory, getRebalanceDetail } from "../api/StrategyApi";
import { getDashboard } from "../api/AccountApi";
import type { RebalanceHistoryItem, RebalanceDetailDto } from "../types/Rebalance";
import type { AccountDashboardDto } from "../types/Account";

const formatNumber = (value: string | number) => Number(value).toLocaleString();
const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

// ── 데이터 부족 Placeholder ──
function DataPending({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
      <BarChart3 size={28} className="mb-2 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function MetricPending({ label, message }: { label: string; message: string }) {
  return (
    <Card className="p-6 bg-white shadow-sm">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-3xl font-bold text-gray-300 mt-2">—</p>
        <p className="text-xs text-gray-400 mt-1">{message}</p>
      </div>
    </Card>
  );
}

export function StrategiesPage() {
  const [historyItems, setHistoryItems] = useState<RebalanceHistoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RebalanceDetailDto | null>(null);
  const [dashboard, setDashboard] = useState<AccountDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInitial = async () => {
    try {
      setLoading(true);
      setError(null);
      const [historyRes, dashRes] = await Promise.all([
        getRebalanceHistory(),
        getDashboard(),
      ]);
      setHistoryItems(historyRes.data.items);
      setDashboard(dashRes.data);

      if (historyRes.data.items.length > 0) {
        const latestId = historyRes.data.items[0].id;
        setSelectedId(latestId);
        await fetchDetail(latestId);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      const res = await getRebalanceDetail(id);
      setDetail(res.data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelectRebalance = async (id: string) => {
    setSelectedId(id);
    await fetchDetail(id);
  };

  useEffect(() => {
    fetchInitial();
  }, []);

  // ── 포트폴리오 데이터 (리밸런스 orders + 대시보드 holdings 매칭) ──
  const portfolioData = useMemo(() => {
    if (!detail || !dashboard) return [];
    const holdingsMap = new Map(dashboard.holdings.map((h) => [h.stock_code, h]));

    return detail.orders
      .filter((o) => o.status === "FILLED")
      .map((order) => {
        const holding = holdingsMap.get(order.stock_code);
        const avgBuyPrice = Number(order.avg_fill_price || 0);
        const currentPrice = holding ? Number(holding.current_price) : avgBuyPrice;
        const qty = order.filled_qty;
        const evalAmount = currentPrice * qty;
        const profitLossRate = avgBuyPrice > 0 ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 : 0;

        return {
          stock_code: order.stock_code,
          stock_name: holding?.stock_name || order.stock_code,
          qty,
          avg_buy_price: avgBuyPrice,
          current_price: currentPrice,
          eval_amount: evalAmount,
          profit_loss: (currentPrice - avgBuyPrice) * qty,
          profit_loss_rate: profitLossRate,
        };
      })
      .sort((a, b) => b.profit_loss_rate - a.profit_loss_rate);
  }, [detail, dashboard]);

  // ── 파생 지표 ──
  const metrics = useMemo(() => {
    if (!detail || !dashboard) return null;
    const summary = detail.execution_summary;
    const totalEvalAmount = portfolioData.reduce((sum, p) => sum + p.eval_amount, 0);
    const totalProfitLoss = portfolioData.reduce((sum, p) => sum + p.profit_loss, 0);
    const totalPurchase = portfolioData.reduce((sum, p) => sum + p.avg_buy_price * p.qty, 0);
    const totalReturnRate = totalPurchase > 0 ? (totalProfitLoss / totalPurchase) * 100 : 0;
    const winCount = portfolioData.filter((p) => p.profit_loss > 0).length;
    const winRate = portfolioData.length > 0 ? (winCount / portfolioData.length) * 100 : 0;
    const topContributors = [...portfolioData].sort((a, b) => b.profit_loss - a.profit_loss).slice(0, 3);

    return {
      failRate: summary.fail_rate * 100,
      filledCount: summary.filled_count,
      signalCount: summary.signal_count,
      cashRatio: summary.cash_ratio * 100,
      estimatedCashAfter: Number(summary.estimated_cash_after),
      rebalanceDuration: summary.rebalance_duration_seconds,
      avgFillDuration: summary.avg_fill_duration_seconds,
      totalEvalAmount,
      totalProfitLoss,
      totalReturnRate,
      totalPurchase,
      winRate,
      winCount,
      totalCount: portfolioData.length,
      topContributors,
    };
  }, [detail, dashboard, portfolioData]);

  // ── 종목별 수익률 차트 데이터 ──
  const chartData = useMemo(() => {
    return portfolioData.map((p) => ({
      symbol: p.stock_name,
      return: Number(p.profit_loss_rate.toFixed(2)),
    }));
  }, [portfolioData]);

  // ── 로딩 ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-gray-400" size={36} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-gray-500">{error}</p>
        <button onClick={fetchInitial} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
          <RefreshCw size={16} /> 다시 시도
        </button>
      </div>
    );
  }

  if (!detail || !metrics) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-gray-500">리밸런스 이력이 없습니다.</p>
      </div>
    );
  }

  const unrealizedPnLRate = metrics.totalReturnRate;
  const unrealizedPnL = metrics.totalProfitLoss;

  return (
    <div className="p-8 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">전략 성과 분석</h1>
          <p className="text-gray-600 mt-1">{formatDateTime(detail.executed_at)} 기준</p>
        </div>
        <div className="flex items-center gap-3">
          {historyItems.length > 1 && (
            <div className="relative">
              <select
                value={selectedId || ""}
                onChange={(e) => handleSelectRebalance(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
              >
                {historyItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formatDateTime(item.executed_at)} — {item.strategy_name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}
          <button onClick={fetchInitial} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw size={16} /> 새로고침
          </button>
        </div>
      </div>

      {detailLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-gray-400" size={28} />
        </div>
      ) : (
        <>
          {/* ═══ 리밸런싱 실행 요약 ═══ */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-6 bg-white shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">편입 실패율</p>
                  <p className={`text-3xl font-bold mt-2 ${metrics.failRate > 0 ? "text-rose-600" : "text-gray-900"}`}>
                    {metrics.failRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {/* {metrics.filledCount}/{metrics.signalCount} 종목 체결 */}
                    편입 {detail.buy_count} · 유지 {detail.hold_count} · 편출 {detail.sell_count}
                  </p>
                </div>
                {metrics.failRate > 0 && <AlertCircle className="text-rose-400" size={24} />}
              </div>
            </Card>

            <Card className="p-6 bg-white shadow-sm">
              <div>
                <p className="text-sm text-gray-600">예수금 비율</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.cashRatio.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">₩{formatNumber(metrics.estimatedCashAfter)} 예수금</p>
              </div>
            </Card>

            <Card className="p-6 bg-white shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">리밸런싱 소요시간</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.rebalanceDuration.toFixed(1)}초</p>
                  <p className="text-xs text-gray-500 mt-1">평균 실행 시간</p>
                </div>
                <Clock className="text-gray-400" size={24} />
              </div>
            </Card>

            <Card className="p-6 bg-white shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">체결 소요시간</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.avgFillDuration.toFixed(1)}초</p>
                  <p className="text-xs text-gray-500 mt-1">평균 체결 시간</p>
                </div>
                <Clock className="text-gray-400" size={24} />
              </div>
            </Card>
          </div>

          {/* ═══ 포트폴리오 현황 ═══ */}
          <Card className="p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">포트폴리오 현황</h2>
                <p className="text-sm text-gray-600 mt-1">현재 {portfolioData.length}개 종목 보유</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">총 평가금액</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold text-gray-900">
                    ₩{(metrics.totalEvalAmount / 10000).toFixed(1)}만원
                  </p>
                  <Badge className={unrealizedPnLRate >= 0 ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"}>
                    {unrealizedPnLRate >= 0 ? "+" : ""}{unrealizedPnLRate.toFixed(2)}%
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {unrealizedPnL >= 0 ? "+" : ""}₩{(unrealizedPnL / 10000).toFixed(1)}만원
                </p>
              </div>
            </div>

            <div className="overflow-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">종목명</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">수량</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">평균단가</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">현재가</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">평가금액</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">손익률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {portfolioData.map((stock) => (
                    <tr key={stock.stock_code} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{stock.stock_name}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">{stock.qty}주</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">₩{formatNumber(Math.round(stock.avg_buy_price))}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">₩{formatNumber(stock.current_price)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">₩{formatNumber(Math.round(stock.eval_amount))}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${stock.profit_loss_rate >= 0 ? "text-rose-600" : "text-blue-600"}`}>
                          {stock.profit_loss_rate >= 0 ? "+" : ""}{stock.profit_loss_rate.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ═══ 성과 분석 - 수익률 차트 + Alpha/CAGR/구간수익률 ═══ */}
          <div className="grid grid-cols-3 gap-6">
            {/* 포트폴리오 vs KOSPI 차트 */}
            <Card className="col-span-2 p-6 bg-white shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">포트폴리오 수익률 vs KOSPI</h2>
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                <LineChartIcon size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">일별 스냅샷 수집 후 확인할 수 있습니다</p>
                <p className="text-xs mt-1">리밸런싱 이후 일별 포트폴리오 가치 추적이 필요합니다</p>
              </div>
            </Card>

            <div className="space-y-4">
              <MetricPending label="Alpha" message="일별 수익률 데이터 필요" />
              <MetricPending label="CAGR" message="최소 1개월 데이터 필요" />

              <Card className="p-6 bg-white shadow-sm">
                <div>
                  <p className="text-sm text-gray-600">구간 수익률</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">포트폴리오</span>
                      <span className={`font-medium ${metrics.totalReturnRate >= 0 ? "text-rose-600" : "text-blue-600"}`}>
                        {metrics.totalReturnRate >= 0 ? "+" : ""}{metrics.totalReturnRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">KOSPI</span>
                      <span className="font-medium text-gray-400">— 데이터 수집 중</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* ═══ 성과 분석 - 리스크 ═══ */}
          <div className="grid grid-cols-3 gap-4">
            <MetricPending label="MDD (최대 낙폭)" message="일별 시계열 데이터 필요" />
            <MetricPending label="Volatility (변동성)" message="일별 시계열 데이터 필요" />
            <MetricPending label="Sharpe Ratio" message="일별 시계열 데이터 필요" />
          </div>

          {/* ═══ 성과 분석 - 매매 (종목별 수익률 분포 + 승률/턴오버/상위기여) ═══ */}
          <div className="grid grid-cols-3 gap-6">
            {/* 종목별 수익률 분포 차트 */}
            <Card className="col-span-2 p-6 bg-white shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">종목별 수익률 분포</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="symbol"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)}%`, "수익률"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="return" name="수익률 (%)" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.return >= 0 ? "#0ea5e9" : "#f43f5e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <div className="space-y-4">
              {/* 승률 */}
              <Card className="p-6 bg-white shadow-sm">
                <div>
                  <p className="text-sm text-gray-600">승률</p>
                  <p className={`text-3xl font-bold mt-2 ${metrics.winRate >= 50 ? "text-rose-600" : "text-blue-600"}`}>
                    {metrics.winRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {metrics.winCount}/{metrics.totalCount} 종목 수익
                  </p>
                </div>
              </Card>

              {/* 턴오버율 */}
              <MetricPending label="턴오버율" message="2회 이상 리밸런스 필요" />

              {/* 상위 기여 종목 */}
              <Card className="p-6 bg-white shadow-sm">
                <div>
                  <p className="text-sm text-gray-600 mb-3">상위 기여 종목</p>
                  <div className="space-y-2">
                    {metrics.topContributors.map((stock) => (
                      <div key={stock.stock_code} className="flex justify-between text-xs">
                        <span className="text-gray-700 truncate">{stock.stock_name}</span>
                        <span className={`font-medium ${stock.profit_loss_rate >= 0 ? "text-rose-600" : "text-blue-600"}`}>
                          {stock.profit_loss_rate >= 0 ? "+" : ""}{stock.profit_loss_rate.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
