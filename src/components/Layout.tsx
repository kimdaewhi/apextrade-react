import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  History,
  Settings,
  BarChart3,
} from "lucide-react";
import { WebSocketProvider, useWsStatus } from "../contexts/WebSocketContext";

const menuItems = [
  { path: "/", label: "Order", icon: ShoppingCart },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/strategies", label: "Strategies", icon: TrendingUp },
  { path: "/history", label: "History", icon: History },
  { path: "/backtest", label: "Backtest", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
];

const STATUS_CONFIG = {
  connected: { label: "Connected", color: "text-green-600", dot: "bg-green-500" },
  connecting: { label: "Connecting...", color: "text-yellow-600", dot: "bg-yellow-500 animate-pulse" },
  disconnected: { label: "Disconnected", color: "text-red-500", dot: "bg-red-500" },
} as const;

function SidebarStatusIndicator() {
  // TODO(P3/인프라): WebSocket 뿐만 아니라 API, DB 등 전체 시스템 상태를 반영하도록 확장 필요
  const status = useWsStatus();
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span className={`${config.color} font-medium`}>{config.label}</span>
    </div>
  );
}

function LayoutInner() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Auto Trading</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p>
              Status: <SidebarStatusIndicator />
            </p>
            <p className="mt-1">v1.0.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export function Layout() {
  return (
    <WebSocketProvider>
      <LayoutInner />
    </WebSocketProvider>
  );
}
