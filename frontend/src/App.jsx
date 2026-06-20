import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MenuPage from "./pages/customer/MenuPage";

import LoginPage from "./pages/admin/LoginPage";
import OrdersPage from "./pages/admin/OrdersPage";
import TablesPage from "./pages/admin/TablesPage";
import HistoryPage from "./pages/admin/HistoryPage";
import SettingsPage from "./pages/admin/SettingsPage";

import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" />} />
        <Route path="/mesa/:numero/:token" element={<MenuPage />} />

        <Route path="/admin/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Navigate to="/admin/orders" />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <PrivateRoute>
              <OrdersPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/tables"
          element={
            <PrivateRoute>
              <TablesPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/history"
          element={
            <PrivateRoute>
              <HistoryPage />
            </PrivateRoute>
          }
        />

        <Route
  path="/admin/settings"
  element={
    <PrivateRoute>
      <SettingsPage />
    </PrivateRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  );
}