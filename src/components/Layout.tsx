import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  History,
  Settings,
  BarChart3,
} from "lucide-react";

const menuItems = [
  { path: "/", label: "Order", icon: ShoppingCart },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/strategies", label: "Strategies", icon: TrendingUp },
  { path: "/history", label: "History", icon: History },
  { path: "/backtest", label: "Backtest", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Layout() {
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
              Status:{" "}
              <span className="text-green-600 font-medium">Connected</span>
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
