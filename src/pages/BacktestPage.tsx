import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Activity, Target, Percent, BarChart3 } from "lucide-react";

interface BacktestData {
  period: {
    start: string;
    end: string;
    days: number;
  };
  returns: {
    total_return: number;
    cagr: number;
    buy_hold_return: number;
    benchmark_return: number;
    alpha_vs_buy_hold: number;
    alpha_vs_benchmark: number;
  };
  risk: {
    max_drawdown: number;
    volatility: number;
    sharpe_ratio: number;
  };
  trade: {
    trade_count: number;
    win_rate: number;
    avg_win: number;
    avg_loss: number;
    profit_factor: number;
    avg_holding_bars: number;
  };
}

export function BacktestPage() {
  const data: BacktestData = {
    period: {
      start: "2025-01-02",
      end: "2025-12-30",
      days: 362,
    },
    returns: {
      total_return: 75.84,
      cagr: 76.67,
      buy_hold_return: 124.53,
      benchmark_return: 75.67,
      alpha_vs_buy_hold: -48.69,
      alpha_vs_benchmark: 0.17,
    },
    risk: {
      max_drawdown: -15.72,
      volatility: 28.6,
      sharpe_ratio: 2.21,
    },
    trade: {
      trade_count: 7,
      win_rate: 28.57,
      avg_win: 32.64,
      avg_loss: -3.3,
      profit_factor: 3.95,
      avg_holding_bars: 20.29,
    },
  };

  // Chart Data
  const returnsComparisonData = [
    { name: "전략 수익률", value: data.returns.total_return },
    { name: "CAGR", value: data.returns.cagr },
    { name: "Buy & Hold", value: data.returns.buy_hold_return },
    { name: "벤치마크", value: data.returns.benchmark_return },
  ];

  const alphaData = [
    { name: "vs Buy & Hold", value: data.returns.alpha_vs_buy_hold },
    { name: "vs Benchmark", value: data.returns.alpha_vs_benchmark },
  ];

  const riskData = [
    { name: "MDD", value: Math.abs(data.risk.max_drawdown) },
    { name: "변동성", value: data.risk.volatility },
  ];

  const tradeWinLossData = [
    { name: "승률", value: data.trade.win_rate, fill: "#0ea5e9" },
    { name: "패율", value: 100 - data.trade.win_rate, fill: "#f43f5e" },
  ];

  const COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#8b5cf6"];

  const MetricCard = ({
    icon: Icon,
    title,
    value,
    unit = "%",
    subValue,
    trend,
    colorClass = "text-gray-900",
  }: {
    icon: any;
    title: string;
    value: number;
    unit?: string;
    subValue?: string;
    trend?: "up" | "down";
    colorClass?: string;
  }) => (
    <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gray-100 rounded-lg">
          <Icon size={24} className="text-gray-700" />
        </div>
        {trend && (
          <div className={trend === "up" ? "text-green-600" : "text-rose-600"}>
            {trend === "up" ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-2">{title}</p>
        <p className={`text-3xl font-bold ${colorClass}`}>
          {value.toFixed(2)}
          <span className="text-lg ml-1">{unit}</span>
        </p>
        {subValue && <p className="text-xs text-gray-500 mt-2">{subValue}</p>}
      </div>
    </Card>
  );

  return (
    <div className="p-8 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">백테스팅 결과</h2>
        <p className="text-gray-600 mt-1">
          {data.period.start} ~ {data.period.end} ({data.period.days}일)
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          icon={TrendingUp}
          title="총 수익률"
          value={data.returns.total_return}
          trend={data.returns.total_return > 0 ? "up" : "down"}
          colorClass={data.returns.total_return > 0 ? "text-green-600" : "text-rose-600"}
        />
        <MetricCard
          icon={Activity}
          title="CAGR"
          value={data.returns.cagr}
          subValue="연평균 성장률"
          trend={data.returns.cagr > 0 ? "up" : "down"}
          colorClass={data.returns.cagr > 0 ? "text-green-600" : "text-rose-600"}
        />
        <MetricCard
          icon={Target}
          title="Sharpe Ratio"
          value={data.risk.sharpe_ratio}
          unit=""
          subValue="위험 대비 수익"
          colorClass="text-sky-700"
        />
        <MetricCard
          icon={BarChart3}
          title="승률"
          value={data.trade.win_rate}
          subValue={`${data.trade.trade_count}회 거래`}
          colorClass="text-sky-700"
        />
      </div>

      {/* Returns Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">수익률 비교</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={returnsComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">알파 (초과 수익률)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={alphaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {alphaData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value >= 0 ? "#22c55e" : "#f43f5e"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Risk & Trade Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">위험 지표</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">최대 낙폭 (MDD)</p>
                <p className="text-2xl font-bold text-rose-600">
                  {data.risk.max_drawdown.toFixed(2)}%
                </p>
              </div>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-600"
                  style={{ width: `${Math.abs(data.risk.max_drawdown)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">변동성</p>
                <p className="text-2xl font-bold text-orange-600">
                  {data.risk.volatility.toFixed(2)}%
                </p>
              </div>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-600"
                  style={{ width: `${Math.min(data.risk.volatility, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">Sharpe Ratio</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.risk.sharpe_ratio.toFixed(2)}
                </p>
              </div>
              <Badge
                className={
                  data.risk.sharpe_ratio > 2
                    ? "bg-green-100 text-green-800"
                    : data.risk.sharpe_ratio > 1
                    ? "bg-blue-100 text-blue-800"
                    : "bg-orange-100 text-orange-800"
                }
              >
                {data.risk.sharpe_ratio > 2
                  ? "우수"
                  : data.risk.sharpe_ratio > 1
                  ? "양호"
                  : "보통"}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">거래 통계</h3>
          <div className="flex items-center justify-center mb-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={tradeWinLossData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
                >
                  {tradeWinLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-700 mb-1">평균 이익</p>
              <p className="text-xl font-bold text-green-600">+{data.trade.avg_win.toFixed(2)}%</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
              <p className="text-xs text-rose-700 mb-1">평균 손실</p>
              <p className="text-xl font-bold text-rose-600">{data.trade.avg_loss.toFixed(2)}%</p>
            </div>
            <div className="p-4 bg-sky-50 rounded-lg border border-sky-200">
              <p className="text-xs text-sky-700 mb-1">Profit Factor</p>
              <p className="text-xl font-bold text-sky-600">{data.trade.profit_factor.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-700 mb-1">평균 보유 기간</p>
              <p className="text-xl font-bold text-purple-600">
                {data.trade.avg_holding_bars.toFixed(0)}일
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Metrics Table */}
      <Card className="p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">상세 지표</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Returns */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b pb-2">
              수익률
            </h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">총 수익률</span>
              <span className="font-semibold text-gray-900">
                {data.returns.total_return.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">CAGR</span>
              <span className="font-semibold text-gray-900">{data.returns.cagr.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Buy & Hold</span>
              <span className="font-semibold text-gray-900">
                {data.returns.buy_hold_return.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">벤치마크</span>
              <span className="font-semibold text-gray-900">
                {data.returns.benchmark_return.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Alpha (vs B&H)</span>
              <span
                className={`font-semibold ${
                  data.returns.alpha_vs_buy_hold >= 0 ? "text-green-600" : "text-rose-600"
                }`}
              >
                {data.returns.alpha_vs_buy_hold.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Alpha (vs 벤치마크)</span>
              <span
                className={`font-semibold ${
                  data.returns.alpha_vs_benchmark >= 0 ? "text-green-600" : "text-rose-600"
                }`}
              >
                {data.returns.alpha_vs_benchmark.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Risk */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b pb-2">
              위험 지표
            </h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">최대 낙폭 (MDD)</span>
              <span className="font-semibold text-rose-600">
                {data.risk.max_drawdown.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">변동성</span>
              <span className="font-semibold text-gray-900">
                {data.risk.volatility.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Sharpe Ratio</span>
              <span className="font-semibold text-gray-900">
                {data.risk.sharpe_ratio.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Trade */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b pb-2">
              거래 통계
            </h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">총 거래 횟수</span>
              <span className="font-semibold text-gray-900">{data.trade.trade_count}회</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">승률</span>
              <span className="font-semibold text-gray-900">{data.trade.win_rate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">평균 이익</span>
              <span className="font-semibold text-green-600">
                +{data.trade.avg_win.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">평균 손실</span>
              <span className="font-semibold text-rose-600">
                {data.trade.avg_loss.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Profit Factor</span>
              <span className="font-semibold text-gray-900">
                {data.trade.profit_factor.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">평균 보유 기간</span>
              <span className="font-semibold text-gray-900">
                {data.trade.avg_holding_bars.toFixed(1)}일
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
