import { useCallback, useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Inbox,
  Loader2,
  LineChart as LineChartIcon,
} from "lucide-react";

import { getDashboard } from "../api/AccountApi";
import { getMarketSummary } from "../api/MarketApi";
import { getPerformance } from "../api/MetricsApi";
import type { AccountDashboardDto } from "../types/Account";
import type { MarketIndexDto } from "../types/Market";
import type { PerformanceDto } from "../types/Metrics";

/* ════════════════════════════════════════════════
   화면 모델

   API 응답(DTO)을 그대로 쓰지 않고 한 번 변환한다.
   - 계좌 응답은 숫자가 문자열로 내려온다
   - 시장 지수 카드는 market + metrics 두 응답을 합쳐야 완성된다
   - 화면이 쓰는 파생값(현금 비중, 평가손익률)은 응답에 없다

   모든 숫자 필드는 null 을 허용한다.
   값을 못 받은 상황과 0 을 화면에서 반드시 구분하기 위함.
   ════════════════════════════════════════════════ */

type Num = number | null;

interface MarketIndex {
  name: string;
  value: Num;
  /** 전일 대비 등락률 */
  changeRate: Num;
  /** 전략 기간과 동일한 구간의 수익률 */
  periodReturn: Num;
}

interface AccountData {
  totalAsset: Num;
  stockValue: Num;
  cash: Num;
  cashRatio: Num;
  purchaseAmount: Num;
  evalProfit: Num;
  evalProfitRate: Num;
}

interface Holding {
  code: string;
  name: string;
  qty: number;
  avgPrice: Num;
  currentPrice: Num;
}

interface StrategyData {
  startDate: string | null;
  endDate: string | null;
  rebalanceCount: Num;

  periodReturn: Num;
  periodProfit: Num;
  benchmarkReturn: Num;
  excessReturn: Num;

  maxDrawdown: Num;
  mddMaxDays: Num;
  mddCurrentDays: Num;
  isRecovered: boolean | null;

  winRate: Num;
  winCount: Num;
  periodCount: Num;
  avgWin: Num;

  totalBuyValue: Num;
  totalSellValue: Num;

  cagr: Num;
  volatility: Num;
  sharpeRatio: Num;
  alpha: Num;
  turnoverRate: Num;
  profitFactor: Num;
}

interface NavPoint {
  date: string;
  nav: Num;
  benchmark: Num;
}

interface DashboardData {
  updatedAt: string | null;
  market: { kospi: MarketIndex | null; kosdaq: MarketIndex | null } | null;
  account: AccountData | null;
  holdings: Holding[] | null;
  strategy: StrategyData | null;
  navSeries: NavPoint[] | null;
}

/** 자산 추이 차트를 그리기 위한 최소 거래일 */
const NAV_MIN_DAYS = 5;

/* ════════════════════════════════════════════════
   null-safe 유틸
   ════════════════════════════════════════════════ */

/** null / undefined / NaN 을 한 번에 걸러낸다 */
function has(v: number | null | undefined): v is number {
  return v !== null && v !== undefined && Number.isFinite(v);
}

/** 문자열로 내려오는 금액을 숫자로. 변환 불가면 null */
function toNum(v: string | number | null | undefined): Num {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** 분모가 0 이거나 값이 없으면 null */
function ratio(numerator: Num, denominator: Num): Num {
  if (!has(numerator) || !has(denominator) || denominator === 0) return null;
  return (numerator / denominator) * 100;
}

const won = (v: Num | undefined) =>
  has(v) ? `₩${Math.round(v).toLocaleString()}` : null;

const manwon = (v: Num | undefined) =>
  has(v) ? `₩${(v / 10000).toFixed(1)}만` : null;

const pct = (v: Num | undefined, digits = 2) =>
  has(v) ? `${v >= 0 ? "+" : ""}${v.toFixed(digits)}%` : null;

/** +₩126,670 / -₩7,990 형태 */
const signedWon = (v: Num | undefined) =>
  has(v)
    ? `${v >= 0 ? "+" : "-"}₩${Math.abs(Math.round(v)).toLocaleString()}`
    : null;

/** 템플릿 문자열에 넣기 전 null 을 undefined 로 바꾼다 (sub prop 용) */
const orUndef = (v: string | null) => v ?? undefined;

/** 상승 로즈 / 하락 블루 (국내 관례) */
const toneClass = (v: Num | undefined) =>
  !has(v) ? "text-gray-900" : v >= 0 ? "text-rose-600" : "text-blue-600";

const UP = "#e11d48";
const DOWN = "#2563eb";

/** 자산 구성 도넛 팔레트 — 등락 색(로즈/블루)과 헷갈리지 않게 선정 */
const SLICE_COLORS = [
  "#5B8DEF",
  "#7C6BF0",
  "#A855C7",
  "#E0629B",
  "#F0836B",
  "#E8A33D",
  "#7BB661",
  "#3FA6A0",
];
const CASH_COLOR = "#D8DDE4";

/** 벤치마크 지수 색 — 도넛 팔레트에서 가져와 톤을 맞춘다 */
const KOSPI_COLOR = "#7C6BF0";
const KOSDAQ_COLOR = "#3FA6A0";

/* ════════════════════════════════════════════════
   DTO → 화면 모델 변환
   ════════════════════════════════════════════════ */

/** "2026-08-13" → "2026.08.13" */
function formatDate(v: string | null): string | null {
  return v ? v.replaceAll("-", ".") : null;
}

/** "2026-08-13" → "08.13" (차트 X축용) */
function formatShortDate(v: string): string {
  return v.length >= 10 ? v.slice(5).replace("-", ".") : v;
}

/**
 * 지수 카드는 두 응답을 합쳐야 완성된다.
 * - value / changeRate : /market/summary (전일 대비)
 * - periodReturn       : /metrics/performance (전략과 같은 구간)
 */
function mapMarket(
  indices: MarketIndexDto[] | null,
  perf: PerformanceDto | null
): DashboardData["market"] {
  const find = (name: string) =>
    indices?.find((i) => i.name.toUpperCase() === name) ?? null;

  const build = (
    name: string,
    dto: MarketIndexDto | null,
    periodReturn: Num
  ): MarketIndex | null => {
    if (!dto && !has(periodReturn)) return null;
    return {
      name,
      value: toNum(dto?.close_price),
      changeRate: toNum(dto?.change_rate),
      periodReturn,
    };
  };

  return {
    kospi: build("KOSPI", find("KOSPI"), perf?.returns.benchmark_return ?? null),
    kosdaq: build(
      "KOSDAQ",
      find("KOSDAQ"),
      perf?.returns.benchmark_kosdaq_return ?? null
    ),
  };
}

function mapAccount(dash: AccountDashboardDto | null): AccountData | null {
  const s = dash?.account_summary;
  if (!s) return null;

  const totalAsset = toNum(s.total_evaluation_amount);
  const cash = toNum(s.settlement_cash_amount);
  const purchaseAmount = toNum(s.total_purchase_amount);
  const evalProfit = toNum(s.total_profit_loss_amount);

  return {
    totalAsset,
    stockValue: toNum(s.stock_evaluation_amount),
    cash,
    cashRatio: ratio(cash, totalAsset),
    purchaseAmount,
    evalProfit,
    evalProfitRate: ratio(evalProfit, purchaseAmount),
  };
}

function mapHoldings(dash: AccountDashboardDto | null): Holding[] {
  return (dash?.holding_list ?? []).map((h) => ({
    code: h.stock_code,
    name: h.stock_name,
    qty: toNum(h.holding_qty) ?? 0,
    avgPrice: toNum(h.avg_buy_price),
    currentPrice: toNum(h.current_price),
  }));
}

function mapStrategy(perf: PerformanceDto | null): StrategyData | null {
  if (!perf) return null;

  const { period, returns, risk, trading, turnover } = perf;

  // 승률은 비율로만 내려오므로 구간 수를 곱해 건수를 복원한다
  const winCount = has(trading.win_rate)
    ? Math.round((trading.win_rate / 100) * trading.period_count)
    : null;

  return {
    startDate: formatDate(period.start),
    endDate: formatDate(period.end),
    rebalanceCount: period.rebalance_count,

    periodReturn: returns.total_return,
    periodProfit: returns.period_profit,
    benchmarkReturn: returns.benchmark_return,
    excessReturn: returns.excess_return,

    maxDrawdown: risk.max_drawdown,
    mddMaxDays: risk.mdd_max_days,
    mddCurrentDays: risk.mdd_current_days,
    isRecovered: risk.is_recovered,

    winRate: trading.win_rate,
    winCount,
    periodCount: trading.period_count,
    avgWin: trading.avg_win,

    totalBuyValue: turnover.total_buy_value,
    totalSellValue: turnover.total_sell_value,

    cagr: returns.cagr,
    volatility: risk.volatility,
    sharpeRatio: risk.sharpe_ratio,
    alpha: returns.alpha_vs_benchmark,
    turnoverRate: turnover.turnover_rate,
    profitFactor: trading.profit_factor,
  };
}

function mapNavSeries(perf: PerformanceDto | null): NavPoint[] {
  return (perf?.nav_series ?? []).map((p) => ({
    date: formatShortDate(p.date),
    nav: p.nav,
    benchmark: p.benchmark,
  }));
}

/* ════════════════════════════════════════════════
   공통 컴포넌트
   ════════════════════════════════════════════════ */

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function EmptyState({
  message,
  height = 200,
  icon = "inbox",
}: {
  message: string;
  height?: number;
  icon?: "inbox" | "chart";
}) {
  const Icon = icon === "chart" ? LineChartIcon : Inbox;

  return (
    <div
      className="flex flex-col items-center justify-center text-gray-400"
      style={{ height }}
    >
      <Icon size={28} className="mb-2.5 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
  compact = false,
}: {
  label: string;
  value: string | null;
  sub?: string;
  tone?: Num;
  compact?: boolean;
}) {
  const pending = value === null;

  return (
    <Card
      className={`${compact ? "p-4" : "p-5"} shadow-sm flex flex-col justify-center ${
        pending ? "bg-gray-50/60" : "bg-white"
      }`}
    >
      <p className="text-sm text-gray-600">{label}</p>
      <p
        className={`${compact ? "text-lg" : "text-2xl"} font-bold mt-1.5 ${
          pending ? "text-gray-300" : toneClass(tone)
        }`}
      >
        {pending ? "—" : value}
      </p>
      {sub && (
        <p className={`text-xs mt-1 ${pending ? "text-gray-400" : "text-gray-500"}`}>
          {sub}
        </p>
      )}
    </Card>
  );
}

/* ════════════════════════════════════════════════
   1. 오늘의 시장
   ════════════════════════════════════════════════ */

function IndexBox({ index }: { index: MarketIndex | null }) {
  if (!index) {
    return (
      <div className="flex-1">
        <p className="text-sm text-gray-500">지수</p>
        <p className="text-xl font-bold text-gray-300 mt-1">—</p>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <p className="text-sm text-gray-600">{index.name}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <span
          className={`text-xl font-bold ${
            has(index.value) ? "text-gray-900" : "text-gray-300"
          }`}
        >
          {has(index.value) ? index.value.toLocaleString() : "—"}
        </span>
        {has(index.changeRate) && (
          <span className={`text-sm font-medium ${toneClass(index.changeRate)}`}>
            {pct(index.changeRate)}
          </span>
        )}
      </div>
    </div>
  );
}

function MarketSection({ data }: { data: DashboardData }) {
  const market = data.market;
  const s = data.strategy;

  return (
    <Card className="p-5 bg-white shadow-sm">
      <div className="flex items-center divide-x divide-gray-200">
        <div className="flex flex-1 gap-8 pr-6">
          <IndexBox index={market?.kospi ?? null} />
          <IndexBox index={market?.kosdaq ?? null} />
        </div>

        <div className="flex-1 pl-6">
          <p className="text-sm text-gray-600">전략 수익률</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-xl font-bold ${
                has(s?.periodReturn) ? toneClass(s?.periodReturn) : "text-gray-300"
              }`}
            >
              {pct(s?.periodReturn) ?? "—"}
            </span>
            {has(s?.excessReturn) && (
              <span className="text-xs text-gray-500">
                KOSPI 대비 {pct(s?.excessReturn)}p
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ════════════════════════════════════════════════
   2. 내 자산 — 자산 구성 도넛 + 지표 카드
   ════════════════════════════════════════════════ */

function AssetDonutCard({ data }: { data: DashboardData }) {
  const a = data.account;
  const holdings = data.holdings ?? [];

  const slices = [
    ...holdings
      .filter((h) => has(h.currentPrice))
      .map((h, i) => ({
        name: h.name,
        value: (h.currentPrice as number) * h.qty,
        color: SLICE_COLORS[i % SLICE_COLORS.length],
      })),
    ...(has(a?.cash) && (a?.cash as number) > 0
      ? [{ name: "예수금", value: a?.cash as number, color: CASH_COLOR }]
      : []),
  ].sort((x, y) => y.value - x.value);

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const empty = slices.length === 0 || total <= 0;
  const legend = slices.slice(0, 4);
  const restValue = slices
    .slice(legend.length)
    .reduce((sum, s) => sum + s.value, 0);

  return (
    <Card
      className={`p-5 shadow-sm flex flex-col ${
        empty ? "bg-gray-50/60" : "bg-white"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <p
          className={`text-sm font-medium ${
            empty ? "text-gray-500" : "text-gray-700"
          }`}
        >
          자산 구성
        </p>
        {!empty && <p className="text-xs text-gray-400">비중순</p>}
      </div>

      {empty ? (
        <EmptyState message="표시할 자산이 없습니다" height={240} />
      ) : (
        <>
          <div className="relative flex-1 min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="92%"
                  paddingAngle={1.5}
                  stroke="none"
                >
                  {slices.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, n: string) => [
                    `${won(v)} (${((v / total) * 100).toFixed(1)}%)`,
                    n,
                  ]}
                  contentStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-gray-500">종목</span>
              <span className="text-lg font-bold text-gray-900">
                {holdings.length}
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {legend.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-gray-600 truncate flex-1">{s.name}</span>
                <span className="text-gray-900 font-medium tabular-nums">
                  {((s.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            ))}

            {slices.length > legend.length && (
              <div className="flex items-center gap-2 text-xs pt-0.5">
                <span className="w-2 h-2 rounded-full shrink-0 bg-gray-200" />
                <span className="text-gray-400 flex-1">
                  외 {slices.length - legend.length}개
                </span>
                <span className="text-gray-400 tabular-nums">
                  {((restValue / total) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

function AssetSection({ data }: { data: DashboardData }) {
  const a = data.account;
  const holdingCount = data.holdings?.length ?? 0;

  return (
    <div>
      <SectionTitle title="내 자산" />

      <div className="grid grid-cols-3 gap-4 items-stretch">
        <AssetDonutCard data={data} />

        <div className="col-span-2 grid grid-cols-2 gap-4">
          <StatCard
            label="전체 자산"
            value={won(a?.totalAsset)}
            sub="주식 + 예수금"
          />
          <StatCard
            label="주식 평가금액"
            value={won(a?.stockValue)}
            sub={holdingCount > 0 ? `${holdingCount}종목 보유` : undefined}
          />
          <StatCard
            label="예수금"
            value={won(a?.cash)}
            sub={orUndef(
              has(a?.cashRatio) ? `전체 자산의 ${a?.cashRatio.toFixed(1)}%` : null
            )}
          />
          <StatCard
            label="평가손익"
            value={pct(a?.evalProfitRate)}
            sub={orUndef(signedWon(a?.evalProfit))}
            tone={a?.evalProfitRate}
          />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   3. 보유 종목
   ════════════════════════════════════════════════ */

type ChartMode = "rate" | "amount";

interface HoldingRow extends Holding {
  evalAmount: Num;
  profit: Num;
  rate: Num;
}

function RankCard({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: "up" | "down";
  rows: HoldingRow[];
}) {
  const Icon = icon === "up" ? TrendingUp : TrendingDown;

  return (
    <Card className="p-5 bg-white shadow-sm">
      <div className="flex items-center gap-1.5 mb-3">
        <Icon
          size={15}
          className={icon === "up" ? "text-rose-500" : "text-blue-500"}
        />
        <p className="text-sm font-medium text-gray-700">{title}</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">표시할 종목이 없습니다</p>
      ) : (
        <div className="space-y-2">
          {rows.map((s) => (
            <div key={s.code} className="flex justify-between text-sm">
              <span className="text-gray-700 truncate">{s.name}</span>
              <span className={`font-medium ${toneClass(s.rate)}`}>
                {pct(s.rate, 1) ?? "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function HoldingsSection({ data }: { data: DashboardData }) {
  const [mode, setMode] = useState<ChartMode>("rate");

  const totalAsset = data.account?.totalAsset;

  const rows: HoldingRow[] = (data.holdings ?? [])
    .map((h) => {
      const priced = has(h.currentPrice) && has(h.avgPrice);
      const evalAmount = has(h.currentPrice) ? h.currentPrice * h.qty : null;
      const profit = priced
        ? ((h.currentPrice as number) - (h.avgPrice as number)) * h.qty
        : null;
      const rate =
        priced && (h.avgPrice as number) > 0
          ? (((h.currentPrice as number) - (h.avgPrice as number)) /
              (h.avgPrice as number)) *
            100
          : null;
      return { ...h, evalAmount, profit, rate };
    })
    .sort((a, b) => (b.rate ?? -Infinity) - (a.rate ?? -Infinity));

  const isEmpty = rows.length === 0;

  const chartData = [...rows]
    .filter((r) => (mode === "rate" ? has(r.rate) : has(r.profit)))
    .sort((a, b) =>
      mode === "rate"
        ? (b.rate as number) - (a.rate as number)
        : (b.profit as number) - (a.profit as number)
    )
    .map((r) => ({
      symbol: r.name,
      value:
        mode === "rate" ? Number((r.rate as number).toFixed(2)) : (r.profit as number),
    }));

  const ranked = rows.filter((r) => has(r.rate));
  const best = ranked.slice(0, 3);
  const worst = [...ranked].reverse().slice(0, 3);

  return (
    <div>
      <SectionTitle
        title="보유 종목"
        sub={isEmpty ? undefined : `${rows.length}개 종목`}
      />

      {/* 테이블 */}
      <Card className="p-0 bg-white shadow-sm overflow-hidden mb-4">
        {isEmpty ? (
          <EmptyState message="보유 중인 종목이 없습니다" height={200} />
        ) : (
          <div className="overflow-auto max-h-[420px]">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    종목코드
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    종목명
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    수량
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    평균 단가
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    현재가
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    평가금액
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    비중
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    수익
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((r, i) => {
                  const weight =
                    has(r.evalAmount) && has(totalAsset) && totalAsset > 0
                      ? (r.evalAmount / totalAsset) * 100
                      : null;

                  return (
                    <tr key={r.code} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-400 tabular-nums">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{r.name}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {r.qty}주
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {won(r.avgPrice) ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                        {won(r.currentPrice) ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {won(r.evalAmount) ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {has(weight) ? (
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gray-400 rounded-full"
                                style={{ width: `${Math.min(weight * 5, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 tabular-nums w-10 text-right">
                              {weight.toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-300 text-right">—</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className={`text-sm font-medium ${toneClass(r.rate)}`}>
                          {pct(r.rate) ?? "—"}
                        </div>
                        {has(r.profit) && (
                          <div className="text-xs text-gray-500">
                            {signedWon(r.profit)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 차트 + 순위 */}
      <div className="grid grid-cols-3 gap-4 items-stretch">
        <Card className="col-span-2 p-5 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-700">종목별 성과</p>

            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {(
                [
                  ["rate", "수익률"],
                  ["amount", "수익금"],
                ] as [ChartMode, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    mode === key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {chartData.length === 0 ? (
            <EmptyState message="표시할 데이터가 없습니다" height={280} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="symbol"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  width={mode === "rate" ? 42 : 58}
                  tickFormatter={(v: number) =>
                    mode === "rate" ? `${v}%` : `${(v / 10000).toFixed(0)}만`
                  }
                />
                <Tooltip
                  formatter={(v: number) => [
                    mode === "rate" ? `${v.toFixed(2)}%` : won(v),
                    mode === "rate" ? "수익률" : "수익금",
                  ]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((e, i) => (
                    <Cell key={i} fill={e.value >= 0 ? UP : DOWN} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <div className="grid grid-rows-2 gap-4">
          <RankCard title="수익 상위" icon="up" rows={best} />
          <RankCard title="손실 상위" icon="down" rows={worst} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   4-1. 자산 추이
   ════════════════════════════════════════════════ */

function NavTrendCard({ data }: { data: DashboardData }) {
  // NAV 는 필수, 벤치마크는 없는 날이 있어도 선을 끊어서 그린다
  const points = (data.navSeries ?? []).filter((d) => has(d.nav));

  if (points.length < NAV_MIN_DAYS) {
    const progress = Math.min((points.length / NAV_MIN_DAYS) * 100, 100);

    return (
      <Card className="p-5 bg-gray-50/60 shadow-sm">
        <p className="text-sm font-medium text-gray-500">자산 추이</p>

        <div className="flex flex-col items-center justify-center h-[240px] text-gray-400">
          <LineChartIcon size={32} className="mb-3 opacity-40" />
          <p className="text-sm">일별 데이터를 모으는 중입니다</p>

          <div className="w-48 mt-4">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-400 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              {points.length} / {NAV_MIN_DAYS} 거래일
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // 시작점을 100 으로 정규화해 전략과 지수를 같은 축에서 비교한다
  const baseNav = points[0].nav as number;
  const baseBm = points.find((p) => has(p.benchmark))?.benchmark ?? null;

  if (baseNav <= 0) {
    return (
      <Card className="p-5 bg-gray-50/60 shadow-sm">
        <p className="text-sm font-medium text-gray-500">자산 추이</p>
        <EmptyState
          message="기준일 데이터가 올바르지 않습니다"
          height={240}
          icon="chart"
        />
      </Card>
    );
  }

  const data2 = points.map((d) => ({
    date: d.date,
    전략: ((d.nav as number) / baseNav) * 100,
    KOSPI:
      has(d.benchmark) && has(baseBm) && baseBm > 0
        ? (d.benchmark / baseBm) * 100
        : null,
  }));

  const last = data2[data2.length - 1];

  return (
    <Card className="p-5 bg-white shadow-sm">
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <p className="text-sm font-medium text-gray-700">자산 추이</p>
          <span className="text-xs text-gray-400">
            {points.length}거래일 · 시작일 100 기준
          </span>
        </div>
        <div className="flex items-baseline gap-4 text-xs">
          <span className="text-gray-500">
            전략{" "}
            <span className={`font-bold ${toneClass(last.전략 - 100)}`}>
              {last.전략.toFixed(1)}
            </span>
          </span>
          {has(last.KOSPI) && (
            <span className="text-gray-500">
              KOSPI{" "}
              <span className="font-bold text-gray-700">
                {last.KOSPI.toFixed(1)}
              </span>
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data2} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis
            tick={{ fontSize: 11 }}
            width={44}
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => v.toFixed(0)}
          />
          <Tooltip
            formatter={(v: number) => v.toFixed(2)}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="전략" stroke={UP} strokeWidth={2} dot={false} />
          <Line
            type="monotone"
            dataKey="KOSPI"
            stroke={KOSPI_COLOR}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

/* ════════════════════════════════════════════════
   4-2. 수익률 비교 막대
   ════════════════════════════════════════════════ */

function ReturnCompareCard({ data }: { data: DashboardData }) {
  const s = data.strategy;
  const m = data.market;

  const bars = [
    { label: "전략", value: s?.periodReturn ?? null, primary: true },
    { label: m?.kospi?.name ?? "KOSPI", value: m?.kospi?.periodReturn ?? null, primary: false },
    { label: m?.kosdaq?.name ?? "KOSDAQ", value: m?.kosdaq?.periodReturn ?? null, primary: false },
  ].filter((b) => has(b.value));

  if (bars.length === 0) {
    return (
      <Card className="p-5 bg-gray-50/60 shadow-sm flex flex-col">
        <p className="text-sm font-medium text-gray-500">기간 수익률 비교</p>
        <EmptyState message="비교할 수익률이 없습니다" height={180} />
      </Card>
    );
  }

  // 0 을 중심으로 좌우 대칭. 최대 절댓값이 반쪽을 꽉 채운다.
  const max = Math.max(...bars.map((b) => Math.abs(b.value as number)), 0.01);
  const excess = s?.excessReturn ?? null;

  return (
    <Card className="p-5 bg-white shadow-sm flex flex-col">
      <div className="flex items-baseline justify-between mb-1">
        <p className="text-sm font-medium text-gray-700">기간 수익률 비교</p>
        {s?.startDate && (
          <span className="text-xs text-gray-400">{s.startDate} 이후</span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-4">
        상단 지수 카드는 전일 대비 등락률입니다
      </p>

      <div className="flex-1 flex flex-col justify-center gap-4">
        {bars.map((b) => {
          const value = b.value as number;
          const width = (Math.abs(value) / max) * 50;   // 반쪽 기준
          const up = value >= 0;

          return (
            <div key={b.label}>
              <div className="flex justify-between items-baseline mb-1.5">
                <span
                  className={`text-xs ${
                    b.primary ? "text-gray-900 font-medium" : "text-gray-500"
                  }`}
                >
                  {b.label}
                </span>
                <span
                  className={`text-sm font-bold ${
                    b.primary ? toneClass(value) : "text-gray-700"
                  }`}
                >
                  {pct(value)}
                </span>
              </div>

              <div className="relative h-2 bg-gray-100 rounded-full">
                {/* 0 기준선 */}
                <div className="absolute left-1/2 -top-0.5 -bottom-0.5 w-px bg-gray-900/40 z-10" />
                <div
                  className={`absolute top-0 bottom-0 transition-all ${
                    up ? "left-1/2 rounded-r-full" : "right-1/2 rounded-l-full"
                  } ${b.primary ? "opacity-100" : "opacity-45"}`}
                  style={{
                    width: `${width}%`,
                    backgroundColor: up ? UP : DOWN,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {has(excess) && (
        <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
          전략이 KOSPI보다 {Math.abs(excess).toFixed(2)}%p{" "}
          {excess >= 0 ? "앞섭니다" : "뒤집니다"}
        </p>
      )}
    </Card>
  );
}

/* ════════════════════════════════════════════════
   4-3. 전략 성과
   ════════════════════════════════════════════════ */

/** 낙폭 상태 문구 — 값 조합에 따라 세 갈래 */
function drawdownSubText(s: StrategyData | null): string | undefined {
  if (!s || !has(s.maxDrawdown)) return undefined;
  if (s.maxDrawdown === 0) return "낙폭 없음";
  if (s.isRecovered === true) {
    return has(s.mddMaxDays) ? `최장 ${s.mddMaxDays}일 · 회복 완료` : "회복 완료";
  }
  if (s.isRecovered === false) {
    return has(s.mddCurrentDays) ? `회복 중 · ${s.mddCurrentDays}일차` : "회복 중";
  }
  return undefined;
}

/** 섹션 부제 — 값이 있는 조각만 이어붙인다 */
function strategySubText(s: StrategyData | null): string | undefined {
  if (!s) return undefined;

  const parts: string[] = [];

  if (s.startDate && s.endDate) parts.push(`${s.startDate} ~ ${s.endDate}`);
  if (has(s.rebalanceCount)) parts.push(`리밸런싱 ${s.rebalanceCount}회`);

  const buy = has(s.totalBuyValue) ? s.totalBuyValue : 0;
  const sell = has(s.totalSellValue) ? s.totalSellValue : 0;
  if (has(s.totalBuyValue) || has(s.totalSellValue)) {
    parts.push(`거래대금 ${manwon(buy + sell)}`);
  }

  return parts.length > 0 ? parts.join(" · ") : undefined;
}

function StrategySection({ data }: { data: DashboardData }) {
  const s = data.strategy;

  const winRate = has(s?.winRate) ? `${s.winRate.toFixed(0)}%` : null;

  return (
    <div>
      <SectionTitle title="전략 성과" sub={strategySubText(s ?? null)} />

      <div className="mb-4">
        <NavTrendCard data={data} />
      </div>

      {/* 비교 막대 + 주요 지표 */}
      <div className="grid grid-cols-3 gap-4 items-stretch">
        <ReturnCompareCard data={data} />

        <div className="col-span-2 grid grid-cols-2 gap-4">
          <StatCard
            label="수익률"
            value={pct(s?.periodReturn)}
            sub={orUndef(signedWon(s?.periodProfit))}
            tone={s?.periodReturn}
          />
          <StatCard
            label="초과수익"
            value={has(s?.excessReturn) ? `${pct(s?.excessReturn)}` : null}
            sub={orUndef(
              has(s?.benchmarkReturn) ? `KOSPI ${pct(s?.benchmarkReturn)}` : null
            )}
            tone={s?.excessReturn}
          />
          <StatCard
            label="최대 낙폭"
            value={
              has(s?.maxDrawdown) ? `${(s?.maxDrawdown as number).toFixed(1)}%` : null
            }
            sub={drawdownSubText(s ?? null)}
          />
          <StatCard
            label="승률"
            value={winRate}
            sub={
              winRate && has(s?.periodCount) && has(s?.winCount)
                ? `${s.periodCount}구간 중 ${s.winCount}구간 수익`
                : "리밸런싱 1회 이상 필요"
            }
          />
        </div>
      </div>

      {/* 보조 지표 */}
      <div className="grid grid-cols-6 gap-3 mt-4">
        <StatCard
          compact
          label="연평균 수익률"
          value={pct(s?.cagr)}
          sub={has(s?.cagr) ? "복리 환산" : "3개월 이상 필요"}
          tone={s?.cagr}
        />
        <StatCard
          compact
          label="손익비"
          value={has(s?.profitFactor) ? (s?.profitFactor as number).toFixed(2) : null}
          sub={has(s?.profitFactor) ? "이익 ÷ 손실" : "이익·손실 구간 모두 필요"}
        />
        <StatCard
          compact
          label="회전율"
          value={
            has(s?.turnoverRate) ? `${(s?.turnoverRate as number).toFixed(1)}%` : null
          }
          sub={has(s?.turnoverRate) ? "연율 환산" : "리밸런싱 2회 이상 필요"}
        />
        <StatCard
          compact
          label="변동성"
          value={has(s?.volatility) ? `${(s?.volatility as number).toFixed(1)}%` : null}
          sub={has(s?.volatility) ? "연율 환산" : "일별 데이터 30일 이상 필요"}
        />
        <StatCard
          compact
          label="샤프 지수"
          value={has(s?.sharpeRatio) ? (s?.sharpeRatio as number).toFixed(2) : null}
          sub={has(s?.sharpeRatio) ? "위험 대비 수익" : "일별 데이터 30일 이상 필요"}
        />
        <StatCard
          compact
          label="알파"
          value={pct(s?.alpha)}
          sub={has(s?.alpha) ? "KOSPI 대비 초과" : "3개월 이상 필요"}
          tone={s?.alpha}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   페이지
   ════════════════════════════════════════════════ */

const EMPTY_DATA: DashboardData = {
  updatedAt: null,
  market: null,
  account: null,
  holdings: null,
  strategy: null,
  navSeries: null,
};

function formatUpdatedAt(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}

export function StrategiesPage() {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 지수·성과는 실패해도 계좌 정보는 보여준다
      const [dashRes, marketRes, perfRes] = await Promise.allSettled([
        getDashboard(),
        getMarketSummary(),
        getPerformance(),
      ]);

      if (dashRes.status === "rejected") throw dashRes.reason;

      const dash = dashRes.value.data;
      const indices =
        marketRes.status === "fulfilled" ? marketRes.value.data : null;
      const perf = perfRes.status === "fulfilled" ? perfRes.value.data : null;

      setData({
        updatedAt: formatUpdatedAt(new Date()),
        market: mapMarket(indices, perf),
        account: mapAccount(dash),
        holdings: mapHoldings(dash),
        strategy: mapStrategy(perf),
        navSeries: mapNavSeries(perf),
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "데이터를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading && data.updatedAt === null) {
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
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <RefreshCw size={16} /> 다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">운용 현황</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data.updatedAt ? `${data.updatedAt} 기준` : "갱신 시각 확인 중"}
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> 새로고침
        </button>
      </div>

      <MarketSection data={data} />
      <AssetSection data={data} />
      <HoldingsSection data={data} />
      <StrategySection data={data} />
    </div>
  );
}
