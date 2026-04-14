import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, TrendingDown, Clock, AlertCircle } from "lucide-react";

// 포트폴리오 종목 데이터 (이미지-1 참조)
const portfolioStocks = [
  { symbol: "윤보테크", quantity: 1, avgPrice: 34100, currentPrice: 35200 },
  { symbol: "대녹제약", quantity: 3, avgPrice: 34100, currentPrice: 33800 },
  { symbol: "비씨에이아이", quantity: 5, avgPrice: 34100, currentPrice: 35500 },
  { symbol: "이솔테시스", quantity: 2, avgPrice: 34100, currentPrice: 34600 },
  { symbol: "씨앤", quantity: 2, avgPrice: 34100, currentPrice: 33400 },
  { symbol: "켐백솔루션즈", quantity: 7, avgPrice: 34100, currentPrice: 34800 },
  { symbol: "한국카본", quantity: 7, avgPrice: 34100, currentPrice: 35100 },
  { symbol: "일진전기", quantity: 4, avgPrice: 34100, currentPrice: 33900 },
  { symbol: "화승엔터", quantity: 1, avgPrice: 34100, currentPrice: 36200 },
  { symbol: "HD현실게", quantity: 2, avgPrice: 34100, currentPrice: 34500 },
  { symbol: "중진제일", quantity: 6, avgPrice: 34100, currentPrice: 33200 },
  { symbol: "GS건", quantity: 7, avgPrice: 34100, currentPrice: 35400 },
  { symbol: "대광테크", quantity: 2, avgPrice: 34100, currentPrice: 34900 },
  { symbol: "플래티어", quantity: 3, avgPrice: 34100, currentPrice: 35800 },
  { symbol: "로이비젼", quantity: 3, avgPrice: 34100, currentPrice: 33700 },
  { symbol: "경대제철", quantity: 8, avgPrice: 34100, currentPrice: 35600 },
  { symbol: "한일파이", quantity: 1, avgPrice: 34100, currentPrice: 36800 },
  { symbol: "엑소닉테크", quantity: 5, avgPrice: 34100, currentPrice: 34200 },
  { symbol: "LG유플러스", quantity: 19, avgPrice: 34100, currentPrice: 34700 },
  { symbol: "일신웰", quantity: 7, avgPrice: 34100, currentPrice: 33500 },
  { symbol: "이담", quantity: 3, avgPrice: 34100, currentPrice: 35300 },
  { symbol: "시에스스톤", quantity: 5, avgPrice: 34100, currentPrice: 34400 },
  { symbol: "도동주프트화", quantity: 2, avgPrice: 34100, currentPrice: 35900 },
];

// 포트폴리오 vs KOSPI 성과 데이터 (수익률 %)
const performanceData = [
  { date: "2026-02-10", portfolio: 0.0, kospi: 0.0 },
  { date: "2026-02-17", portfolio: 2.3, kospi: 1.2 },
  { date: "2026-02-24", portfolio: 4.8, kospi: -0.2 },
  { date: "2026-03-03", portfolio: 3.2, kospi: 0.5 },
  { date: "2026-03-10", portfolio: 6.7, kospi: 2.1 },
  { date: "2026-03-17", portfolio: 9.2, kospi: 3.4 },
  { date: "2026-03-24", portfolio: 7.5, kospi: 1.8 },
  { date: "2026-03-31", portfolio: 10.8, kospi: 4.2 },
  { date: "2026-04-07", portfolio: 13.5, kospi: 5.6 },
  { date: "2026-04-14", portfolio: 15.2, kospi: 6.8 },
];

// 종목별 수익률 (상위/하위)
const stockPerformanceData = portfolioStocks
  .map((stock) => ({
    symbol: stock.symbol,
    return: ((stock.currentPrice - stock.avgPrice) / stock.avgPrice) * 100,
    value: stock.quantity * stock.currentPrice,
  }))
  .sort((a, b) => b.return - a.return);

export function StrategiesPage() {
  // 계산 메트릭
  const totalInvestment = 10000000; // 1천만원
  const portfolioInvestment = 9500000; // 950만원
  const cashReserve = totalInvestment - portfolioInvestment;
  const cashReserveRatio = (cashReserve / totalInvestment) * 100;

  const signalCount = 25;
  const executedCount = 23;
  const failureRate = ((signalCount - executedCount) / signalCount) * 100;

  const totalValue = portfolioStocks.reduce(
    (sum, stock) => sum + stock.quantity * stock.currentPrice,
    0
  );
  const totalCost = portfolioStocks.reduce(
    (sum, stock) => sum + stock.quantity * stock.avgPrice,
    0
  );
  const unrealizedPnL = totalValue - totalCost;
  const unrealizedPnLRate = (unrealizedPnL / totalCost) * 100;

  const portfolioReturn = 15.2; // %
  const kospiReturn = 6.8; // %
  const alpha = portfolioReturn - kospiReturn;
  const cagr = 18.6; // annualized
  const mdd = -8.3; // %
  const volatility = 12.4; // %
  const sharpeRatio = 1.47;

  const profitableStocks = stockPerformanceData.filter((s) => s.return > 0).length;
  const winRate = (profitableStocks / portfolioStocks.length) * 100;
  const turnoverRate = 32.5; // %

  return (
    <div className="p-8 space-y-6 bg-gray-50">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">전략 성과 분석</h1>
        <p className="text-gray-600 mt-1">2026.04.14 기준</p>
      </div>

      {/* 리밸런싱 실행 요약 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-6 bg-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">편입 실패율</p>
              <p className="text-3xl font-bold text-rose-600 mt-2">
                {failureRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {executedCount}/{signalCount} 종목 체결
              </p>
            </div>
            <AlertCircle className="text-rose-400" size={24} />
          </div>
        </Card>

        <Card className="p-6 bg-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">예수금 비율</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {cashReserveRatio.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ₩{(cashReserve / 10000).toFixed(0)}만원 예수금
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">리밸런싱 소요시간</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">2.3초</p>
              <p className="text-xs text-gray-500 mt-1">평균 실행 시간</p>
            </div>
            <Clock className="text-gray-400" size={24} />
          </div>
        </Card>

        <Card className="p-6 bg-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">체결 소요시간</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">1.8초</p>
              <p className="text-xs text-gray-500 mt-1">평균 체결 시간</p>
            </div>
            <Clock className="text-gray-400" size={24} />
          </div>
        </Card>
      </div>

      {/* 포트폴리오 현황 */}
      <Card className="p-6 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">포트폴리오 현황</h2>
            <p className="text-sm text-gray-600 mt-1">
              현재 {portfolioStocks.length}개 종목 보유
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">총 평가금액</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-gray-900">
                ₩{(totalValue / 10000).toFixed(1)}만원
              </p>
              <Badge
                className={`${
                  unrealizedPnLRate >= 0
                    ? "bg-sky-100 text-sky-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {unrealizedPnLRate >= 0 ? "+" : ""}
                {unrealizedPnLRate.toFixed(2)}%
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {unrealizedPnL >= 0 ? "+" : ""}₩
              {(unrealizedPnL / 10000).toFixed(1)}만원
            </p>
          </div>
        </div>

        <div className="overflow-auto max-h-96">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  종목명
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                  수량
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                  평균단가
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                  현재가
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                  평가금액
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                  손익률
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {portfolioStocks.map((stock, idx) => {
                const pnlRate =
                  ((stock.currentPrice - stock.avgPrice) / stock.avgPrice) * 100;
                const value = stock.quantity * stock.currentPrice;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {stock.symbol}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {stock.quantity}주
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      ₩{stock.avgPrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                      ₩{stock.currentPrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ₩{value.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-sm font-medium ${
                          pnlRate >= 0 ? "text-sky-600" : "text-rose-600"
                        }`}
                      >
                        {pnlRate >= 0 ? "+" : ""}
                        {pnlRate.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 성과 분석 - 수익 */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2 p-6 bg-white shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            포트폴리오 수익률 vs KOSPI
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(val) => val.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{ value: '누적 수익률 (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const portfolio = payload.find((p) => p.dataKey === "portfolio")?.value as number;
                    const kospi = payload.find((p) => p.dataKey === "kospi")?.value as number;
                    const diff = portfolio - kospi;
                    const date = payload[0].payload.date;

                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="text-xs text-gray-600 mb-2">{date}</p>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-sky-600">
                            포트폴리오: {portfolio.toFixed(1)}%
                          </p>
                          <p className="text-sm font-medium text-gray-600">
                            KOSPI: {kospi.toFixed(1)}%
                          </p>
                          <div className="border-t border-gray-200 pt-1 mt-1">
                            <p className={`text-sm font-bold ${diff >= 0 ? 'text-sky-600' : 'text-rose-600'}`}>
                              Alpha: {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%p
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="portfolio"
                stroke="#0ea5e9"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#0ea5e9" }}
                activeDot={{ r: 6 }}
                name="포트폴리오"
              />
              <Line
                type="monotone"
                dataKey="kospi"
                stroke="#94a3b8"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#94a3b8" }}
                activeDot={{ r: 6 }}
                name="KOSPI"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <div className="space-y-4">
          <Card className="p-6 bg-white shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Alpha</p>
                <p className="text-3xl font-bold text-sky-600 mt-2">
                  +{alpha.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="text-sky-400" size={24} />
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">CAGR</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {cagr.toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-sm">
            <div>
              <p className="text-sm text-gray-600">구간 수익률</p>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">포트폴리오</span>
                  <span className="font-medium text-sky-600">
                    +{portfolioReturn.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">KOSPI</span>
                  <span className="font-medium text-gray-600">
                    +{kospiReturn.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 성과 분석 - 리스크 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6 bg-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">MDD (최대 낙폭)</p>
              <p className="text-3xl font-bold text-rose-600 mt-2">
                {mdd.toFixed(1)}%
              </p>
            </div>
            <TrendingDown className="text-rose-400" size={24} />
          </div>
        </Card>

        <Card className="p-6 bg-white shadow-sm">
          <div>
            <p className="text-sm text-gray-600">Volatility (변동성)</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {volatility.toFixed(1)}%
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-white shadow-sm">
          <div>
            <p className="text-sm text-gray-600">Sharpe Ratio</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {sharpeRatio.toFixed(2)}
            </p>
          </div>
        </Card>
      </div>

      {/* 성과 분석 - 매매 */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2 p-6 bg-white shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            종목별 수익률 분포
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stockPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="symbol"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar
                dataKey="return"
                fill="#0ea5e9"
                name="수익률 (%)"
                radius={[4, 4, 0, 0]}
              >
                {stockPerformanceData.map((entry, index) => (
                  <rect
                    key={`bar-${index}`}
                    fill={entry.return >= 0 ? "#0ea5e9" : "#f43f5e"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div className="space-y-4">
          <Card className="p-6 bg-white shadow-sm">
            <div>
              <p className="text-sm text-gray-600">승률</p>
              <p className="text-3xl font-bold text-sky-600 mt-2">
                {winRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {profitableStocks}/{portfolioStocks.length} 종목 수익
              </p>
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-sm">
            <div>
              <p className="text-sm text-gray-600">턴오버율</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {turnoverRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">종목 교체 비율</p>
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-sm">
            <div>
              <p className="text-sm text-gray-600 mb-3">상위 기여 종목</p>
              <div className="space-y-2">
                {stockPerformanceData.slice(0, 3).map((stock, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-gray-700 truncate">
                      {stock.symbol}
                    </span>
                    <span className="text-sky-600 font-medium">
                      +{stock.return.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
