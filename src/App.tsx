import { Navigate, Route, Routes } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout";
import AuthLayout from "./layouts/AuthLayout";
import CustomerLayout from "./layouts/CustomerLayout";
import BusinessLayout from "./layouts/BusinessLayout";
import RiderLayout from "./layouts/RiderLayout";
import AdminLayout from "./layouts/AdminLayout";

import ProtectedRoute from "./components/auth/ProtectedRoute";

// Public pages
import Home from "./pages/public/Home";
import Explore from "./pages/public/Explore";
import Products from "./pages/public/Products";
import ProductDetails from "./pages/public/ProductDetails";
import Category from "./pages/public/Category";
import Businesses from "./pages/public/Businesses";
import BusinessDetails from "./pages/public/BusinessDetails";
import Search from "./pages/public/Search";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";
import Terms from "./pages/public/Terms";
import Privacy from "./pages/public/Privacy";
import NotFound from "./pages/public/NotFound";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";

// Customer pages
import CustomerDashboard from "./pages/customer/Dashboard";
import CustomerOrders from "./pages/customer/Orders";
import CustomerOrderDetails from "./pages/customer/OrderDetails";
import CustomerCart from "./pages/customer/Cart";
import CustomerCheckout from "./pages/customer/Checkout";
import CustomerPaymentResult from "./pages/customer/PaymentResult";
import CustomerWallet from "./pages/customer/Wallet";
import CustomerMessages from "./pages/customer/Messages";
import CustomerProfile from "./pages/customer/Profile";

// Business pages
import BusinessDashboard from "./pages/business/Dashboard";
import BusinessSetup from "./pages/business/Setup";
import BusinessProducts from "./pages/business/Products";
import BusinessProductForm from "./pages/business/ProductCreate";
import BusinessProductEdit from "./pages/business/ProductEdit";
import BusinessOrders from "./pages/business/Orders";
import BusinessOrderDetails from "./pages/business/OrderDetails";
import BusinessCustomers from "./pages/business/Customers";
import BusinessEarnings from "./pages/business/Earnings";
import BusinessPayouts from "./pages/business/Payouts";
import BusinessMessages from "./pages/business/Messages";
import BusinessSettings from "./pages/business/Settings";

// Rider pages
import RiderDashboard from "./pages/rider/Dashboard";
import RiderSetup from "./pages/rider/Setup";
import RiderRequests from "./pages/rider/Requests";
import RiderDeliveries from "./pages/rider/Deliveries";
import RiderDeliveryDetails from "./pages/rider/DeliveryDetails";
import RiderEarnings from "./pages/rider/Earnings";
import RiderMessages from "./pages/rider/Messages";
import RiderProfile from "./pages/rider/Profile";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCustomers from "./pages/admin/Customers";
import AdminBusinesses from "./pages/admin/Businesses";
import AdminRiders from "./pages/admin/Riders";
import AdminOrders from "./pages/admin/Orders";
import AdminOrderDetails from "./pages/admin/OrderDetails";
import AdminPayments from "./pages/admin/Payments";
import AdminRefunds from "./pages/admin/Refunds";
import AdminWallets from "./pages/admin/Wallets";
import AdminCategories from "./pages/admin/Categories";
import AdminDelivery from "./pages/admin/Delivery";
import AdminFees from "./pages/admin/Fees";
import AdminDisputes from "./pages/admin/Disputes";
import AdminMessages from "./pages/admin/Messages";
import AdminSettings from "./pages/admin/Settings";
import AdminAudit from "./pages/admin/Audit";

function App() {
  return (
    <Routes>
      {/* =========================
          PUBLIC MARKETPLACE
      ========================== */}
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />

        <Route path="/explore" element={<Explore />} />

        <Route path="/products" element={<Products />} />

        <Route
          path="/products/:productId"
          element={<ProductDetails />}
        />

        <Route
          path="/category/:slug"
          element={<Category />}
        />

        <Route path="/businesses" element={<Businesses />} />

        <Route
          path="/businesses/:slug"
          element={<BusinessDetails />}
        />

        <Route path="/search" element={<Search />} />

        <Route path="/about" element={<About />} />

        <Route path="/contact" element={<Contact />} />

        <Route path="/terms" element={<Terms />} />

        <Route path="/privacy" element={<Privacy />} />

        <Route path="/404" element={<NotFound />} />
      </Route>

      {/* =========================
          AUTHENTICATION
      ========================== */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route
          path="/verify-email"
          element={<VerifyEmail />}
        />
      </Route>

      {/* =========================
          CUSTOMER
      ========================== */}
      <Route element={<CustomerLayout />}>
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/orders"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/orders/:orderId"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerOrderDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/cart"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerCart />
            </ProtectedRoute>
          }
        />

        <Route path="/customer/checkout" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerCheckout /></ProtectedRoute>} />
        <Route path="/customer/payment-result" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerPaymentResult /></ProtectedRoute>} />

        <Route
          path="/customer/wallet"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerWallet />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/messages"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerMessages />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/profile"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerProfile />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* =========================
          BUSINESS
      ========================== */}
      <Route element={<BusinessLayout />}>
        <Route
          path="/business/setup"
          element={
            <ProtectedRoute allowedRoles={["business_owner"]}>
              <BusinessSetup />
            </ProtectedRoute>
          }
        />

        <Route
          path="/business/dashboard"
          element={
            <ProtectedRoute allowedRoles={["business_owner"]}>
              <BusinessDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/business/products"
          element={
            <ProtectedRoute allowedRoles={["business_owner"]}>
              <BusinessProducts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/business/products/new"
          element={
            <ProtectedRoute allowedRoles={["business_owner"]}>
              <BusinessProductForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/business/products/:productId/edit"
          element={
            <ProtectedRoute allowedRoles={["business_owner"]}>
              <BusinessProductEdit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/business/orders"
          element={
            <ProtectedRoute allowedRoles={["business_owner"]}>
              <BusinessOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/business/orders/:orderId"
          element={
            <ProtectedRoute allowedRoles={["business_owner"]}>
              <BusinessOrderDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/business/customers"
          element={
            <ProtectedRoute allowedRoles={["business_owner"]}>
              <BusinessCustomers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/business/earnings"
          element={
            <ProtectedRoute allowedRoles={["business_owner"]}>
              <BusinessEarnings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/business/payouts"
          element={
            <ProtectedRoute allowedRoles={["business_owner"]}>
              <BusinessPayouts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/business/messages"
          element={
            <ProtectedRoute allowedRoles={["business_owner"]}>
              <BusinessMessages />
            </ProtectedRoute>
          }
        />

        <Route
          path="/business/settings"
          element={
            <ProtectedRoute allowedRoles={["business_owner"]}>
              <BusinessSettings />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* =========================
          RIDER
      ========================== */}
      <Route element={<RiderLayout />}>
        <Route
          path="/rider/setup"
          element={
            <ProtectedRoute allowedRoles={["rider"]}>
              <RiderSetup />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rider/dashboard"
          element={
            <ProtectedRoute allowedRoles={["rider"]}>
              <RiderDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rider/requests"
          element={
            <ProtectedRoute allowedRoles={["rider"]}>
              <RiderRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rider/deliveries"
          element={
            <ProtectedRoute allowedRoles={["rider"]}>
              <RiderDeliveries />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rider/deliveries/:orderId"
          element={
            <ProtectedRoute allowedRoles={["rider"]}>
              <RiderDeliveryDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rider/earnings"
          element={
            <ProtectedRoute allowedRoles={["rider"]}>
              <RiderEarnings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rider/messages"
          element={
            <ProtectedRoute allowedRoles={["rider"]}>
              <RiderMessages />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rider/profile"
          element={
            <ProtectedRoute allowedRoles={["rider"]}>
              <RiderProfile />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* =========================
          ADMINISTRATION
      ========================== */}
      <Route element={<AdminLayout />}>
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              requireAdmin
            >
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              requireAdmin
            >
              <AdminCustomers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/businesses"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              requireAdmin
            >
              <AdminBusinesses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/riders"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              requireAdmin
            >
              <AdminRiders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              requireAdmin
            >
              <AdminOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/orders/:orderId"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              requireAdmin
            >
              <AdminOrderDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/payments"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              requireAdmin
            >
              <AdminPayments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/refunds"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              requireAdmin
            >
              <AdminRefunds />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/wallets"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              requireAdmin
            >
              <AdminWallets />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              requireAdmin
            >
              <AdminCategories />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/delivery"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              requireAdmin
            >
              <AdminDelivery />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/fees"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              requireAdmin
            >
              <AdminFees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/disputes"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              requireAdmin
            >
              <AdminDisputes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/messages"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              requireAdmin
            >
              <AdminMessages />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              requireAdmin
            >
              <AdminSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              requireAdmin
            >
              <AdminAudit />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* =========================
          FALLBACK
      ========================== */}
      <Route
        path="*"
        element={<Navigate to="/404" replace />}
      />
    </Routes>
  );
}

export default App;
