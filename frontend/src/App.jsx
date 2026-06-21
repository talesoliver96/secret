import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MenuPage from "./pages/customer/MenuPage";

import LoginPage from "./pages/admin/LoginPage";
import OrdersPage from "./pages/admin/OrdersPage";
import TablesPage from "./pages/admin/TablesPage";
import HistoryPage from "./pages/admin/HistoryPage";
import SettingsPage from "./pages/admin/SettingsPage";
import CustomersPage from "./pages/admin/CustomersPage";

import ProductsPage from "./pages/admin/ProductsPage";
import CategoriesPage from "./pages/admin/CategoriesPage";

import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" />} />
        <Route path="/mesa/:numero/:token" element={<MenuPage />} />

        <Route path="/admin/login" element={<LoginPage />} />
        <Route
  path="/admin/customers"
  element={
    <PrivateRoute>
      <CustomersPage />
    </PrivateRoute>
  }
/>

        <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />

<Route
  path="/admin/dashboard"
  element={
    <PrivateRoute>
      <OrdersPage />
    </PrivateRoute>
  }
/>

        <Route
  path="/admin/products"
  element={
    <PrivateRoute>
      <ProductsPage />
    </PrivateRoute>
  }
/>

<Route
  path="/admin/categories"
  element={
    <PrivateRoute>
      <CategoriesPage />
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