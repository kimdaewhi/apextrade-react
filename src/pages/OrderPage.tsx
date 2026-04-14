import { useState } from "react";
import { Card } from "../components/ui/card.tsx";
import { Input } from "../components/ui/input.tsx";
import { Label } from "../components/ui/label.tsx";
import { Button } from "../components/ui/button.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select.tsx";
import { Badge } from "../components/ui/badge.tsx";
import {
  Edit,
  X,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";

type OrderType = "시장가" | "지정가";
type OrderStatus = "ACCEPTED" | "FILLED" | "CANCELED" | "REJECTED";
type OrderKind = "new" | "modify" | "cancel";

interface Order {
  id: string;
  symbol: string;
  quantity: number;
  price: number;
  type: OrderType;
  side: "BUY" | "SELL";
  kind: OrderKind;
  status: OrderStatus;
  timestamp: Date;
  originalOrderId?: string;
  children?: Order[];
}

export function OrderPage() {
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("시장가");
  const [price, setPrice] = useState("");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [highlightedOrders, setHighlightedOrders] = useState<Set<string>>(
    new Set(),
  );
  const [showKillSwitchConfirm, setShowKillSwitchConfirm] = useState(false);
  const [isKillSwitchActive, setIsKillSwitchActive] = useState(false);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "ORD-001",
      symbol: "005930",
      quantity: 10,
      price: 75000,
      type: "지정가",
      side: "BUY",
      kind: "new",
      status: "FILLED",
      timestamp: new Date("2025-04-14T08:30:00"),
      children: [
        {
          id: "ORD-005",
          symbol: "005930",
          quantity: 5,
          price: 76000,
          type: "지정가",
          side: "BUY",
          kind: "cancel",
          status: "CANCELED",
          timestamp: new Date("2025-04-14T08:30:00"),
          originalOrderId: "ORD-001",
        },
      ],
    },
    {
      id: "ORD-002",
      symbol: "035420",
      quantity: 5,
      price: 52000,
      type: "지정가",
      side: "SELL",
      kind: "new",
      status: "ACCEPTED",
      timestamp: new Date("2025-04-14T08:30:00"),
      children: [
        {
          id: "ORD-004",
          symbol: "035420",
          quantity: 5,
          price: 53000,
          type: "지정가",
          side: "SELL",
          kind: "modify",
          status: "FILLED",
          timestamp: new Date("2025-04-14T08:30:00"),
          originalOrderId: "ORD-002",
        },
        {
          id: "ORD-006",
          symbol: "035420",
          quantity: 5,
          price: 54000,
          type: "지정가",
          side: "SELL",
          kind: "modify",
          status: "ACCEPTED",
          timestamp: new Date("2025-04-14T08:30:00"),
          originalOrderId: "ORD-002",
        },
      ],
    },
    {
      id: "ORD-003",
      symbol: "000660",
      quantity: 20,
      price: 0,
      type: "시장가",
      side: "BUY",
      kind: "new",
      status: "FILLED",
      timestamp: new Date("2025-04-14T08:30:00"),
    },
  ]);

  const highlightOrder = (orderId: string) => {
    setHighlightedOrders((prev) => new Set(prev).add(orderId));
    setTimeout(() => {
      setHighlightedOrders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }, 1500);
  };

  const handleOrder = (side: "BUY" | "SELL") => {
    if (!symbol || !quantity) {
      alert("종목코드와 수량을 입력해주세요.");
      return;
    }

    const newOrder: Order = {
      id: `ORD-${String(orders.length + 1).padStart(3, "0")}`,
      symbol,
      quantity: parseInt(quantity),
      price: orderType === "시장가" ? 0 : parseInt(price || "0"),
      type: orderType,
      side,
      kind: "new",
      status: "ACCEPTED",
      timestamp: new Date(),
    };

    setOrders([newOrder, ...orders]);
    highlightOrder(newOrder.id);

    // Reset form
    setSymbol("");
    setQuantity("");
    setPrice("");
  };

  const handleCancel = (orderId: string) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status: "CANCELED" } : order,
      ),
    );
    highlightOrder(orderId);
  };

  const handleKillSwitch = () => {
    // 모든 활성 주문 취소
    setOrders(
      orders.map((order) =>
        order.status === "ACCEPTED" ? { ...order, status: "CANCELED" } : order,
      ),
    );
    setShowKillSwitchConfirm(false);
    setIsKillSwitchActive(true);

    // 모든 취소된 주문 하이라이트
    orders.forEach((order) => {
      if (order.status === "ACCEPTED") {
        highlightOrder(order.id);
      }
    });
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "FILLED":
        return "bg-green-100 text-green-800";
      case "ACCEPTED":
        return "bg-blue-100 text-blue-800";
      case "CANCELED":
        return "bg-gray-100 text-gray-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getKindBadge = (kind: OrderKind) => {
    switch (kind) {
      case "new":
        return (
          <Badge className="bg-blue-100 text-blue-800" variant="secondary">
            신규
          </Badge>
        );
      case "modify":
        return (
          <Badge className="bg-orange-100 text-orange-800" variant="secondary">
            정정
          </Badge>
        );
      case "cancel":
        return (
          <Badge className="bg-gray-100 text-gray-800" variant="secondary">
            취소
          </Badge>
        );
      default:
        return <Badge variant="secondary">-</Badge>;
    }
  };

  const renderOrderRow = (order: Order, isChild: boolean = false) => {
    const hasChildren = order.children && order.children.length > 0;
    const isExpanded = expandedOrders.has(order.id);
    const isHighlighted = highlightedOrders.has(order.id);

    return (
      <>
        <tr
          key={order.id}
          className={`border-b border-gray-100 transition-colors duration-500 ${
            isChild ? "bg-gray-50" : "hover:bg-gray-50"
          } ${
            isHighlighted
              ? order.side === "BUY"
                ? "bg-sky-100"
                : "bg-rose-100"
              : ""
          } ${hasChildren ? "cursor-pointer" : ""}`}
          onClick={hasChildren ? () => toggleExpand(order.id) : undefined}
        >
          <td className="py-4 px-4">
            <div className={`flex items-center gap-2 ${isChild ? "pl-8" : ""}`}>
              {hasChildren && (
                <button className="text-gray-500 hover:text-gray-700">
                  {isExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
              )}
              <span className="text-sm font-medium text-gray-900">
                {order.id}
              </span>
              {hasChildren && (
                <Badge
                  className="bg-gray-200 text-gray-700 text-xs"
                  variant="secondary"
                >
                  {order.children?.length}
                </Badge>
              )}
            </div>
          </td>
          <td className="py-4 px-4 text-sm text-gray-900">{order.symbol}</td>
          <td className="py-4 px-4">{getKindBadge(order.kind)}</td>
          <td className="py-4 px-4">
            <span
              className={`text-sm font-medium ${
                order.side === "BUY" ? "text-sky-700" : "text-rose-700"
              }`}
            >
              {order.side === "BUY" ? "매수" : "매도"}
            </span>
          </td>
          <td className="py-4 px-4 text-sm text-gray-900 text-right">
            {order.quantity.toLocaleString()}
          </td>
          <td className="py-4 px-4 text-sm text-gray-900 text-right">
            {order.price === 0 ? "-" : order.price.toLocaleString()}
          </td>
          <td className="py-4 px-4 text-sm text-gray-600">{order.type}</td>
          <td className="py-4 px-4 text-center">
            <Badge className={getStatusColor(order.status)} variant="secondary">
              {order.status}
            </Badge>
          </td>
          <td className="py-4 px-4 text-sm text-gray-600">
            {order.timestamp.toLocaleTimeString()}
          </td>
          <td className="py-4 px-4 text-sm text-gray-500">
            {order.originalOrderId ? (
              <span className="font-mono">{order.originalOrderId}</span>
            ) : (
              "-"
            )}
          </td>
          <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3"
                disabled={
                  order.status === "CANCELED" || order.status === "FILLED"
                }
              >
                <Edit size={14} className="mr-1" />
                정정
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200"
                onClick={() => handleCancel(order.id)}
                disabled={
                  order.status === "CANCELED" || order.status === "FILLED"
                }
              >
                <X size={14} className="mr-1" />
                취소
              </Button>
            </div>
          </td>
        </tr>
        {hasChildren &&
          isExpanded &&
          order.children?.map((child) => renderOrderRow(child, true))}
      </>
    );
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">주문 실행</h2>
          <p className="text-gray-600 mt-1">빠른 주문 테스트 및 관리</p>
        </div>

        {/* Kill Switch Button with Status */}
        <div className="flex items-center gap-4">
          {isKillSwitchActive && (
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-100 border-2 border-rose-300 rounded-lg">
              <div className="w-3 h-3 bg-rose-600 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-rose-800">
                Kill Switch 활성화됨
              </span>
            </div>
          )}

          {isKillSwitchActive ? (
            <Button
              onClick={() => setIsKillSwitchActive(false)}
              className="bg-green-600 hover:bg-green-700 text-white h-12 px-6 font-medium shadow-lg"
            >
              <ChevronRight size={20} className="mr-2" />
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

      {/* Kill Switch Confirmation Modal */}
      {showKillSwitchConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-rose-100 rounded-full">
                <AlertTriangle size={24} className="text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Kill Switch 활성화
                </h3>
                <p className="text-sm text-gray-600">
                  모든 활성 주문이 즉시 취소되고 거래가 중지됩니다.
                  계속하시겠습니까?
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowKillSwitchConfirm(false)}
                variant="outline"
                className="px-4"
              >
                취소
              </Button>
              <Button
                onClick={handleKillSwitch}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4"
              >
                확인
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Order Input Panel */}
      <Card className="p-6 mb-8 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">신규 주문</h3>

        {isKillSwitchActive && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3">
            <AlertTriangle size={20} className="text-rose-600" />
            <p className="text-sm text-rose-800 font-medium">
              Kill Switch가 활성화되어 주문이 불가능합니다. 거래를 재개하려면
              상단의 "거래 재개" 버튼을 클릭하세요.
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
              disabled={isKillSwitchActive}
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
              disabled={isKillSwitchActive}
            />
          </div>

          <div>
            <Label htmlFor="orderType">주문 유형</Label>
            <Select
              value={orderType}
              onValueChange={(value) => setOrderType(value as OrderType)}
              disabled={isKillSwitchActive}
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
              disabled={orderType === "시장가" || isKillSwitchActive}
              className="mt-2"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={() => handleOrder("BUY")}
            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white h-12 text-base font-medium"
            disabled={isKillSwitchActive}
          >
            매수
          </Button>
          <Button
            onClick={() => handleOrder("SELL")}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white h-12 text-base font-medium"
            disabled={isKillSwitchActive}
          >
            매도
          </Button>
        </div>
      </Card>

      {/* Orders List Panel */}
      <Card className="p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">주문 목록</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  주문 ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  종목코드
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  주문구분
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  방향
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  수량
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  가격
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  유형
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  상태
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  시간
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  원본주문
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  액션
                </th>
              </tr>
            </thead>
            <tbody>{orders.map((order) => renderOrderRow(order))}</tbody>
          </table>

          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              주문 내역이 없습니다.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
