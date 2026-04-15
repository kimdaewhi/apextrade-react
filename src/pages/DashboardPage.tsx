import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { TrendingUp, TrendingDown, Wallet, BarChart3, Activity, Loader2, RefreshCw } from "lucide-react";
import { getDashboard } from "../api/AccountApi";
import type { AccountDashboardDto } from "../types/Account";

const formatNumber = (value: string | number) => {
  return Number(value).toLocaleString();
};

const formatRate = (rate: string | number) => {
  const numRate = Number(rate);
  return numRate > 0 ? `+${numRate.toFixed(2)}%` : `${numRate.toFixed(2)}%`;
};

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<AccountDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDashboard();
      setDashboard(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ── 로딩 ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-gray-400" size={36} />
      </div>
    );
  }

  // ── 에러 ──
  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-gray-500">{error || "데이터가 없습니다."}</p>
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={16} />
          다시 시도
        </button>
      </div>
    );
  }

  // ── 데이터 파생 ──
  const { summary, holding_stats, today_trading, holdings } = dashboard;

  const profitLossAmount = Number(summary.total_profit_loss_amount);
  const profitLossRate = Number(summary.asset_change_rate);
  const isProfit = profitLossAmount >= 0;

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">계좌 대시보드</h2>
          <p className="text-gray-600 mt-1">실시간 계좌 현황 및 보유 종목</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={16} />
          새로고침
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {/* 총 평가금액 */}
        <Card className="p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">총 평가금액</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(summary.total_evaluation_amount)}원
              </p>
              <div className={`flex items-center gap-1 mt-2 text-sm ${isProfit ? 'text-rose-600' : 'text-blue-600'}`}>
                {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="font-medium">{formatRate(profitLossRate)}</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Wallet className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>

        {/* 주문 가능 현금 */}
        <Card className="p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">주문 가능 현금</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(summary.cash_amount)}원
              </p>
              <p className="text-sm text-gray-500 mt-2">매수 가능</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Activity className="text-green-600" size={24} />
            </div>
          </div>
        </Card>

        {/* 총 평가손익 */}
        <Card className="p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">총 평가손익</p>
              <p className={`text-2xl font-bold ${isProfit ? 'text-rose-600' : 'text-blue-600'}`}>
                {isProfit ? '+' : ''}{formatNumber(profitLossAmount)}원
              </p>
              <p className={`text-sm font-medium mt-2 ${isProfit ? 'text-rose-600' : 'text-blue-600'}`}>
                {formatRate(profitLossRate)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isProfit ? 'bg-rose-50' : 'bg-blue-50'}`}>
              <BarChart3 className={isProfit ? 'text-rose-600' : 'text-blue-600'} size={24} />
            </div>
          </div>
        </Card>

        {/* 보유 종목 */}
        <Card className="p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">보유 종목</p>
              <p className="text-2xl font-bold text-gray-900">
                {holding_stats.holding_stock_count}개
              </p>
              <p className="text-sm text-gray-500 mt-2">
                총 {formatNumber(holding_stats.total_holding_qty)}주
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* 당일 매매 현황 + 계좌 구성 */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card className="p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">당일 매매 현황</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-sky-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">당일 매수</p>
              <p className="text-xl font-bold text-sky-700">
                {formatNumber(today_trading.today_buy_amount)}원
              </p>
              <p className="text-sm text-gray-600 mt-1">{today_trading.today_buy_qty}주</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">당일 매도</p>
              <p className="text-xl font-bold text-rose-700">
                {formatNumber(today_trading.today_sell_amount)}원
              </p>
              <p className="text-sm text-gray-600 mt-1">{today_trading.today_sell_qty}주</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">계좌 구성</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">주식 평가액</span>
              <span className="font-medium text-gray-900">
                {formatNumber(summary.stock_evaluation_amount)}원
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">정산기준현금</span>
              <span className="font-medium text-gray-900">
                {formatNumber(summary.settlement_cash_amount)}원
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">총 평가금</span>
              <span className="font-bold text-gray-900">
                {formatNumber(summary.total_evaluation_amount)}원
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* 보유 종목 테이블 */}
      <Card className="p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">보유 종목</h3>
          <span className="text-sm text-gray-500">{holdings.length}종목</span>
        </div>

        {holdings.length === 0 ? (
          <p className="text-center text-gray-400 py-12">보유 종목이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "12%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "7%" }} />
              </colgroup>
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">종목명</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">종목코드</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">보유수량</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">평균단가</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">현재가</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">평가금액</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">평가손익</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">수익률</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">비중</th>
                </tr>
              </thead>
            </table>

            <div className="max-h-[520px] overflow-y-auto">
              <table className="w-full" style={{ tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "7%" }} />
                </colgroup>
                <tbody>
                  {holdings.map((holding) => {
                    const isProfitable = Number(holding.profit_loss_amount) >= 0;

                    return (
                      <tr key={holding.stock_code} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <p className="font-medium text-gray-900">{holding.stock_name}</p>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{holding.stock_code}</td>
                        <td className="py-4 px-4 text-sm text-gray-900 text-right">
                          {formatNumber(holding.holding_qty)}주
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900 text-right">
                          {formatNumber(Number(holding.avg_buy_price).toFixed(0))}원
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900 text-right font-medium">
                          {formatNumber(holding.current_price)}원
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900 text-right font-medium">
                          {formatNumber(holding.evaluation_amount)}원
                        </td>
                        <td className={`py-4 px-4 text-sm text-right font-medium ${isProfitable ? 'text-rose-600' : 'text-blue-600'}`}>
                          {isProfitable ? '+' : ''}{formatNumber(holding.profit_loss_amount)}원
                        </td>
                        <td className={`py-4 px-4 text-sm text-right font-medium ${isProfitable ? 'text-rose-600' : 'text-blue-600'}`}>
                          {formatRate(holding.profit_loss_rate)}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 text-right">
                          {Number(holding.weight_rate).toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 합계 행 (스크롤 밖 고정) */}
            <table className="w-full" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "12%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "7%" }} />
              </colgroup>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="py-4 px-4 text-sm text-gray-900" colSpan={2}>합계</td>
                  <td className="py-4 px-4 text-sm text-gray-900 text-right">
                    {formatNumber(holding_stats.total_holding_qty)}주
                  </td>
                  <td className="py-4 px-4" colSpan={2}></td>
                  <td className="py-4 px-4 text-sm text-gray-900 text-right">
                    {formatNumber(summary.stock_evaluation_amount)}원
                  </td>
                  <td className={`py-4 px-4 text-sm text-right ${isProfit ? 'text-rose-600' : 'text-blue-600'}`}>
                    {isProfit ? '+' : ''}{formatNumber(summary.total_profit_loss_amount)}원
                  </td>
                  <td className={`py-4 px-4 text-sm text-right ${isProfit ? 'text-rose-600' : 'text-blue-600'}`}>
                    {formatRate(profitLossRate)}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900 text-right">100.00%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
