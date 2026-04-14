import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { TrendingUp, TrendingDown, Wallet, BarChart3, Activity } from "lucide-react";

// Mock data based on API response
const accountSummary = {
  cash_amount: "8957397",
  stock_evaluation_amount: "4158000",
  total_evaluation_amount: "9820681",
  net_asset_amount: "9820681",
  total_purchase_amount: "4222500",
  total_profit_loss_amount: "-64500",
  asset_change_amount: "-66814",
  asset_change_rate: "-0.67574244"
};

const holdings = [
  {
    stock_code: "000660",
    stock_name: "SK하이닉스",
    holding_qty: "1",
    orderable_qty: "1",
    avg_buy_price: "833000.0000",
    current_price: "823000",
    purchase_amount: "833000",
    evaluation_amount: "823000",
    profit_loss_amount: "-10000",
    profit_loss_rate: "-1.20",
    weight_rate: "8.39"
  },
  {
    stock_code: "005380",
    stock_name: "현대차",
    holding_qty: "4",
    orderable_qty: "4",
    avg_buy_price: "458000.0000",
    current_price: "447000",
    purchase_amount: "1832000",
    evaluation_amount: "1788000",
    profit_loss_amount: "-44000",
    profit_loss_rate: "-2.40",
    weight_rate: "18.22"
  },
  {
    stock_code: "005930",
    stock_name: "삼성전자",
    holding_qty: "5",
    orderable_qty: "5",
    avg_buy_price: "171900.0000",
    current_price: "169300",
    purchase_amount: "859500",
    evaluation_amount: "846500",
    profit_loss_amount: "-13000",
    profit_loss_rate: "-1.51",
    weight_rate: "8.63"
  },
  {
    stock_code: "263750",
    stock_name: "펄어비스",
    holding_qty: "10",
    orderable_qty: "10",
    avg_buy_price: "69800.0000",
    current_price: "69400",
    purchase_amount: "698000",
    evaluation_amount: "694000",
    profit_loss_amount: "-4000",
    profit_loss_rate: "-0.57",
    weight_rate: "7.07"
  }
];

const todayTrading = {
  today_buy_amount: "6310523",
  today_sell_amount: "2091050",
  today_buy_qty: "20",
  today_sell_qty: "0"
};

const holdingStats = {
  holding_stock_count: "4",
  total_holding_qty: "20"
};

const formatNumber = (value: string | number) => {
  return Number(value).toLocaleString();
};

const formatRate = (rate: string | number) => {
  const numRate = Number(rate);
  return numRate > 0 ? `+${numRate.toFixed(2)}%` : `${numRate.toFixed(2)}%`;
};

export function DashboardPage() {
  const totalEvalAmount = Number(accountSummary.total_evaluation_amount);
  const profitLossAmount = Number(accountSummary.total_profit_loss_amount);
  const profitLossRate = Number(accountSummary.asset_change_rate);
  const isProfit = profitLossAmount >= 0;

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">계좌 대시보드</h2>
        <p className="text-gray-600 mt-1">실시간 계좌 현황 및 보유 종목</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">총 평가금액</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(totalEvalAmount)}원
              </p>
              <div className={`flex items-center gap-1 mt-2 text-sm ${isProfit ? 'text-rose-600' : 'text-rose-600'}`}>
                {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="font-medium">{formatRate(profitLossRate)}</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Wallet className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">보유 현금</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(accountSummary.cash_amount)}원
              </p>
              <p className="text-sm text-gray-500 mt-2">
                매수 가능
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Activity className="text-green-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">총 평가손익</p>
              <p className={`text-2xl font-bold ${isProfit ? 'text-sky-600' : 'text-rose-600'}`}>
                {isProfit ? '+' : ''}{formatNumber(profitLossAmount)}원
              </p>
              <p className={`text-sm font-medium mt-2 ${isProfit ? 'text-sky-600' : 'text-rose-600'}`}>
                {formatRate(profitLossRate)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isProfit ? 'bg-sky-50' : 'bg-rose-50'}`}>
              <BarChart3 className={isProfit ? 'text-sky-600' : 'text-rose-600'} size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">보유 종목</p>
              <p className="text-2xl font-bold text-gray-900">
                {holdingStats.holding_stock_count}개
              </p>
              <p className="text-sm text-gray-500 mt-2">
                총 {formatNumber(holdingStats.total_holding_qty)}주
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Trading */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card className="p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">당일 매매 현황</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-sky-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">당일 매수</p>
              <p className="text-xl font-bold text-sky-700">
                {formatNumber(todayTrading.today_buy_amount)}원
              </p>
              <p className="text-sm text-gray-600 mt-1">{todayTrading.today_buy_qty}주</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">당일 매도</p>
              <p className="text-xl font-bold text-rose-700">
                {formatNumber(todayTrading.today_sell_amount)}원
              </p>
              <p className="text-sm text-gray-600 mt-1">{todayTrading.today_sell_qty}주</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">계좌 구성</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">주식 평가액</span>
              <span className="font-medium text-gray-900">
                {formatNumber(accountSummary.stock_evaluation_amount)}원
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">총 매입금액</span>
              <span className="font-medium text-gray-900">
                {formatNumber(accountSummary.total_purchase_amount)}원
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">순자산</span>
              <span className="font-bold text-gray-900">
                {formatNumber(accountSummary.net_asset_amount)}원
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card className="p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">보유 종목</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
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
                    <td className={`py-4 px-4 text-sm text-right font-medium ${isProfitable ? 'text-sky-600' : 'text-rose-600'}`}>
                      {isProfitable ? '+' : ''}{formatNumber(holding.profit_loss_amount)}원
                    </td>
                    <td className={`py-4 px-4 text-sm text-right font-medium ${isProfitable ? 'text-sky-600' : 'text-rose-600'}`}>
                      {formatRate(holding.profit_loss_rate)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 text-right">
                      {Number(holding.weight_rate).toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="py-4 px-4 text-sm text-gray-900" colSpan={2}>합계</td>
                <td className="py-4 px-4 text-sm text-gray-900 text-right">
                  {formatNumber(holdingStats.total_holding_qty)}주
                </td>
                <td className="py-4 px-4" colSpan={2}></td>
                <td className="py-4 px-4 text-sm text-gray-900 text-right">
                  {formatNumber(accountSummary.stock_evaluation_amount)}원
                </td>
                <td className={`py-4 px-4 text-sm text-right ${isProfit ? 'text-sky-600' : 'text-rose-600'}`}>
                  {isProfit ? '+' : ''}{formatNumber(accountSummary.total_profit_loss_amount)}원
                </td>
                <td className={`py-4 px-4 text-sm text-right ${isProfit ? 'text-sky-600' : 'text-rose-600'}`}>
                  {formatRate(profitLossRate)}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900 text-right">100.00%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}