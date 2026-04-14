import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { OrderPage } from "./pages/OrderPage";
import { DashboardPage } from "./pages/DashboardPage";
import { StrategiesPage } from "./pages/StrategiesPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
 import { BacktestPage } from "./pages/BacktestPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: OrderPage },
      { path: "dashboard", Component: DashboardPage },
      { path: "strategies", Component: StrategiesPage },
      { path: "history", Component: HistoryPage },
      { path: "backtest", Component: BacktestPage },
      { path: "settings", Component: SettingsPage },
    ],
  },
]);