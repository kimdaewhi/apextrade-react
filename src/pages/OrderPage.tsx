import { useEffect, useState, useCallback } from "react";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import {
  Edit,
  X,
  AlertTriangle,
  Loader2,
  RefreshCw,
  FlaskConical,
} from "lucide-react";
import {
  getOrderList,
  buyDomesticStock,
  sellDomesticStock,
  cancelOrder,
  reviseOrder,
  getKillSwitchStatus,
  changeKillSwitch,
} from "../api/OrderApi";
import { useWsSubscribe } from "../contexts/WebSocketContext";
import type { OrderDto } from "../types/Order";

type OrderType = "시장가" | "지정가";

// ─── 상태 뱃지 색상 ───
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  PROCESSING: "bg-yellow-100 text-yellow-800",
  REQUESTED: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  PARTIAL_FILLED: "bg-indigo-100 text-indigo-800",
  FILLED: "bg-green-100 text-green-800",
  CANCELED: "bg-gray-100 text-gray-500",
  FAILED: "bg-red-100 text-red-800",
};

// ─── 주문구분 뱃지 ───
const KIND_BADGES: Record<string, { label: string; className: string }> = {
  new: { label: "신규", className: "bg-blue-100 text-blue-800" },
  modify: { label: "정정", className: "bg-orange-100 text-orange-800" },
  cancel: { label: "취소", className: "bg-gray-100 text-gray-600" },
};

// ─── 정정/취소 가능 상태 ───
const ACTIONABLE_STATUSES = new Set(["ACCEPTED", "PARTIAL_FILLED"]);

// ─── 유형 표시 ───
const ORDER_TYPE_LABEL: Record<string, string> = {
  market: "시장가",
  limit: "지정가",
  conditional: "조건부",
};

const formatNumber = (value: string | number) => {
  return Number(value).toLocaleString();
};

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
};

export function OrderPage() {
  // ── 주문 입력 ──
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("시장가");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dryRun, setDryRun] = useState(false);

  // ── 주문 목록 ──
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Kill Switch ──
  const [isKillSwitchActive, setIsKillSwitchActive] = useState(false);
  const [showKillSwitchConfirm, setShowKillSwitchConfirm] = useState(false);
  const [killSwitchLoading, setKillSwitchLoading] = useState(false);

  // ── 정정 모달 ──
  const [reviseTarget, setReviseTarget] = useState<OrderDto | null>(null);
  const [reviseQty, setReviseQty] = useState("");
  const [reviseType, setReviseType] = useState<OrderType>("시장가");
  const [revisePrice, setRevisePrice] = useState("");
  const [reviseSubmitting, setReviseSubmitting] = useState(false);

  // ── 데이터 로드 ──
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getOrderList();
      setOrders(res.data);
    } catch {
      // 에러 시 빈 목록 유지
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchKillSwitch = useCallback(async () => {
    try {
      const res = await getKillSwitchStatus();
      setIsKillSwitchActive(res.data.enabled);
    } catch {
      // 무시
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchKillSwitch();
  }, [fetchOrders, fetchKillSwitch]);

  // ── WebSocket 구독: 주문 업데이트 ──
  useWsSubscribe("order_updated", useCallback((data: any) => {
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === data.id);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], ...data };
      return next;
    });
  }, []));

  // ── WebSocket 구독: 주문 생성 ──
  useWsSubscribe("order_created", useCallback((data: any) => {
    setOrders((prev) => {
      // 중복 방지
      if (prev.some((o) => o.id === data.id)) return prev;
      return [data, ...prev];
    });
  }, []));

  // ── 매수/매도 ──
  const handleOrder = async (side: "BUY" | "SELL") => {
    if (!symbol || !quantity) {
      alert("종목코드와 수량을 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      const qty = parseInt(quantity);
      const p = parseInt(price || "0");

      if (side === "BUY") {
        await buyDomesticStock(symbol, qty, orderType, p, dryRun);
      } else {
        await sellDomesticStock(symbol, qty, orderType, p, dryRun);
      }

      setSymbol("");
      setQuantity("");
      setPrice("");
      // WebSocket으로 실시간 갱신되지만, dry_run이면 WS 이벤트가 안 올 수 있으므로 수동 갱신
      if (dryRun) await fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || "주문 실패");
    } finally {
      setSubmitting(false);
    }
  };

  // ── 취소 ──
  const handleCancel = async (order: OrderDto) => {
    const label = dryRun ? "[DRY RUN] " : "";
    if (!confirm(`${label}${order.stock_name || order.stock_code} ${order.remaining_qty}주 취소하시겠습니까?`)) return;

    try {
      await cancelOrder(order.id, order.remaining_qty, dryRun);
      if (dryRun) await fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || "취소 실패");
    }
  };

  // ── 정정 ──
  const openReviseModal = (order: OrderDto) => {
    setReviseTarget(order);
    setReviseQty(String(order.remaining_qty));
    setReviseType(order.order_type === "limit" ? "지정가" : "시장가");
    setRevisePrice(order.order_price ? String(order.order_price) : "");
  };

  const handleRevise = async () => {
    if (!reviseTarget || !reviseQty) return;

    try {
      setReviseSubmitting(true);
      await reviseOrder(
        reviseTarget.id,
        reviseType,
        parseInt(reviseQty),
        parseInt(revisePrice || "0"),
        dryRun,
      );
      setReviseTarget(null);
      if (dryRun) await fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || "정정 실패");
    } finally {
      setReviseSubmitting(false);
    }
  };

  // ── Kill Switch ──
  const handleKillSwitch = async () => {
    try {
      setKillSwitchLoading(true);
      await changeKillSwitch(true);
      setIsKillSwitchActive(true);
      setShowKillSwitchConfirm(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Kill Switch 실패");
    } finally {
      setKillSwitchLoading(false);
    }
  };

  const handleResumeTrading = async () => {
    try {
      setKillSwitchLoading(true);
      await changeKillSwitch(false);
      setIsKillSwitchActive(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || "거래 재개 실패");
    } finally {
      setKillSwitchLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">주문 실행</h2>
          <p className="text-gray-600 mt-1">빠른 주문 테스트 및 관리</p>
        </div>

        <div className="flex items-center gap-4">
          {isKillSwitchActive && (
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-100 border-2 border-rose-300 rounded-lg">
              <div className="w-3 h-3 bg-rose-600 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-rose-800">Kill Switch 활성화됨</span>
            </div>
          )}

          {isKillSwitchActive ? (
            <Button
              onClick={handleResumeTrading}
              disabled={killSwitchLoading}
              className="bg-green-600 hover:bg-green-700 text-white h-12 px-6 font-medium shadow-lg"
            >
              거래 재개
            </Button>
          ) : (
            <Button
              onClick={() => setShowKillSwitchConfirm(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white h-12 px-6 font-medium shadow-lg"
            >
              <AlertTriangle size={20} className="mr-2" />
              Kill Switch
            </Button>
          )}
        </div>
      </div>

      {/* Kill Switch 확인 모달 */}
      {showKillSwitchConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-rose-100 rounded-full">
                <AlertTriangle size={24} className="text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Kill Switch 활성화</h3>
                <p className="text-sm text-gray-600">
                  모든 활성 주문이 즉시 취소되고 거래가 중지됩니다. 계속하시겠습니까?
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button onClick={() => setShowKillSwitchConfirm(false)} variant="outline" className="px-4">
                취소
              </Button>
              <Button
                onClick={handleKillSwitch}
                disabled={killSwitchLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4"
              >
                {killSwitchLoading ? <Loader2 className="animate-spin" size={16} /> : "확인"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 정정 모달 */}
      {reviseTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md mx-4 shadow-xl w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              주문 정정 — {reviseTarget.stock_name || reviseTarget.stock_code}
            </h3>
            <div className="space-y-4">
              <div>
                <Label>수량</Label>
                <Input
                  type="number"
                  value={reviseQty}
                  onChange={(e) => setReviseQty(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>주문 유형</Label>
                <Select value={reviseType} onValueChange={(v) => setReviseType(v as OrderType)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="시장가">시장가</SelectItem>
                    <SelectItem value="지정가">지정가</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>가격</Label>
                <Input
                  type="number"
                  value={revisePrice}
                  onChange={(e) => setRevisePrice(e.target.value)}
                  disabled={reviseType === "시장가"}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <Button onClick={() => setReviseTarget(null)} variant="outline" className="px-4">
                취소
              </Button>
              <Button
                onClick={handleRevise}
                disabled={reviseSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4"
              >
                {reviseSubmitting ? <Loader2 className="animate-spin" size={16} /> : "정정 확인"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 신규 주문 */}
      <Card className="p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">신규 주문</h3>

          {/* Dry Run 토글 */}
          <button
            onClick={() => setDryRun(!dryRun)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              dryRun
                ? "bg-amber-50 border-amber-300 text-amber-800"
                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            <FlaskConical size={16} />
            Dry Run
            <div
              className={`w-9 h-5 rounded-full relative transition-colors ${
                dryRun ? "bg-amber-400" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  dryRun ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </div>
          </button>
        </div>

        {isKillSwitchActive && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3">
            <AlertTriangle size={20} className="text-rose-600" />
            <p className="text-sm text-rose-800 font-medium">
              Kill Switch가 활성화되어 주문이 불가능합니다.
            </p>
          </div>
        )}

        {dryRun && !isKillSwitchActive && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
            <FlaskConical size={20} className="text-amber-600" />
            <p className="text-sm text-amber-800 font-medium">
              Dry Run 모드: 주문지만 생성되고 브로커에 제출되지 않습니다.
            </p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-6 mb-6">
          <div>
            <Label htmlFor="symbol">종목코드</Label>
            <Input
              id="symbol"
              placeholder="예: 005930"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="mt-2"
              disabled={isKillSwitchActive || submitting}
            />
          </div>
          <div>
            <Label htmlFor="quantity">수량</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-2"
              disabled={isKillSwitchActive || submitting}
            />
          </div>
          <div>
            <Label htmlFor="orderType">주문 유형</Label>
            <Select
              value={orderType}
              onValueChange={(v) => setOrderType(v as OrderType)}
              disabled={isKillSwitchActive || submitting}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="시장가">시장가</SelectItem>
                <SelectItem value="지정가">지정가</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="price">가격</Label>
            <Input
              id="price"
              type="number"
              placeholder="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={orderType === "시장가" || isKillSwitchActive || submitting}
              className="mt-2"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={() => handleOrder("BUY")}
            className={`flex-1 h-12 text-base font-medium text-white ${
              dryRun ? "bg-sky-400 hover:bg-sky-500" : "bg-sky-600 hover:bg-sky-700"
            }`}
            disabled={isKillSwitchActive || submitting}
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : dryRun ? "매수 (Dry Run)" : "매수"}
          </Button>
          <Button
            onClick={() => handleOrder("SELL")}
            className={`flex-1 h-12 text-base font-medium text-white ${
              dryRun ? "bg-rose-400 hover:bg-rose-500" : "bg-rose-600 hover:bg-rose-700"
            }`}
            disabled={isKillSwitchActive || submitting}
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : dryRun ? "매도 (Dry Run)" : "매도"}
          </Button>
        </div>
      </Card>

      {/* 주문 목록 */}
      <Card className="p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">주문 목록</h3>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-500">주문 내역이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "8%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "14%" }} />
              </colgroup>
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">종목코드</th>
                  <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">종목명</th>
                  <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">주문구분</th>
                  <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">방향</th>
                  <th className="text-right py-3 px-3 text-sm font-semibold text-gray-700">수량 / 체결 / 잔량</th>
                  <th className="text-right py-3 px-3 text-sm font-semibold text-gray-700">가격</th>
                  <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">유형</th>
                  <th className="text-center py-3 px-3 text-sm font-semibold text-gray-700">상태</th>
                  <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">시간</th>
                  <th className="text-center py-3 px-3 text-sm font-semibold text-gray-700">액션</th>
                </tr>
              </thead>
            </table>

            <div className="max-h-[520px] overflow-y-auto">
              <table className="w-full" style={{ tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "14%" }} />
                </colgroup>
                <tbody>
                  {orders.map((order) => {
                    const kindInfo = KIND_BADGES[order.order_kind] || { label: order.order_kind, className: "bg-gray-100 text-gray-600" };
                    const statusColor = STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600";
                    const isActionable = ACTIONABLE_STATUSES.has(order.status);
                    const isBuy = order.order_pos === "buy";

                    return (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3.5 px-3 text-sm text-gray-900">{order.stock_code}</td>
                        <td className="py-3.5 px-3 text-sm font-medium text-gray-900 truncate">
                          {order.stock_name || "-"}
                        </td>
                        <td className="py-3.5 px-3">
                          <Badge className={kindInfo.className} variant="secondary">
                            {kindInfo.label}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`text-sm font-medium ${isBuy ? "text-sky-700" : "text-rose-700"}`}>
                            {isBuy ? "매수" : "매도"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-sm text-gray-900 text-right">
                          {order.order_qty} / {order.filled_qty} / {order.remaining_qty}
                        </td>
                        <td className="py-3.5 px-3 text-sm text-gray-900 text-right">
                          {order.order_price ? formatNumber(order.order_price) : "-"}
                        </td>
                        <td className="py-3.5 px-3 text-sm text-gray-600">
                          {ORDER_TYPE_LABEL[order.order_type] || order.order_type}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <Badge className={statusColor} variant="secondary">
                            {order.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-3 text-sm text-gray-600">
                          {formatDateTime(order.created_at)}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs"
                              disabled={!isActionable}
                              onClick={() => openReviseModal(order)}
                            >
                              <Edit size={12} className="mr-1" />
                              정정
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200"
                              disabled={!isActionable}
                              onClick={() => handleCancel(order)}
                            >
                              <X size={12} className="mr-1" />
                              취소
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
