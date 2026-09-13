import { Navigate, Route, Routes } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout";
import AuthLayout from "./layouts/AuthLayout";
import CustomerLayout from "./layouts/CustomerLayout";
import BusinessLayout from "./layouts/BusinessLayout";
import RiderLayout from "./layouts/RiderLayout";
import AdminLayout from "./layouts/AdminLayout";

// Public pages
import Home from "./pages/public/Home";
import Explore from "./pages/public/Explore";
import Product from "./pages/public/Product";
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
import CustomerWallet from "./pages/customer/Wallet";
import CustomerMessages from "./pages/customer/Messages";
import CustomerProfile from "./pages/customer/Profile";

// Business pages
import BusinessDashboard from "./pages/business/Dashboard";
import BusinessProducts from "./pages/business/Products";
import BusinessProductForm from "./pages/business/ProductForm";
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

        <Route path="/products" element={<Product />} />

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
          element={<CustomerDashboard />}
        />

        <Route
          path="/customer/orders"
          element={<CustomerOrders />}
        />

        <Route
          path="/customer/orders/:orderId"
          element={<CustomerOrderDetails />}
        />

        <Route
          path="/customer/cart"
          element={<CustomerCart />}
        />

        <Route
          path="/customer/wallet"
          element={<CustomerWallet />}
        />

        <Route
          path="/customer/messages"
          element={<CustomerMessages />}
        />

        <Route
          path="/customer/profile"
          element={<CustomerProfile />}
        />
      </Route>

      {/* =========================
          BUSINESS
      ========================== */}
      <Route element={<BusinessLayout />}>
        <Route
          path="/business/dashboard"
          element={<BusinessDashboard />}
        />

        <Route
          path="/business/products"
          element={<BusinessProducts />}
        />

        <Route
          path="/business/products/new"
          element={<BusinessProductForm />}
        />

        <Route
          path="/business/products/:productId/edit"
          element={<BusinessProductEdit />}
        />

        <Route
          path="/business/orders"
          element={<BusinessOrders />}
        />

        <Route
          path="/business/orders/:orderId"
          element={<BusinessOrderDetails />}
        />

        <Route
          path="/business/customers"
          element={<BusinessCustomers />}
        />

        <Route
          path="/business/earnings"
          element={<BusinessEarnings />}
        />

        <Route
          path="/business/payouts"
          element={<BusinessPayouts />}
        />

        <Route
          path="/business/messages"
          element={<BusinessMessages />}
        />

        <Route
          path="/business/settings"
          element={<BusinessSettings />}
        />
      </Route>

      {/* =========================
          RIDER
      ========================== */}
      <Route element={<RiderLayout />}>
        <Route
          path="/rider/dashboard"
          element={<RiderDashboard />}
        />

        <Route
          path="/rider/requests"
          element={<RiderRequests />}
        />

        <Route
          path="/rider/deliveries"
          element={<RiderDeliveries />}
        />

        <Route
          path="/rider/deliveries/:orderId"
          element={<RiderDeliveryDetails />}
        />

        <Route
          path="/rider/earnings"
          element={<RiderEarnings />}
        />

        <Route
          path="/rider/messages"
          element={<RiderMessages />}
        />

        <Route
          path="/rider/profile"
          element={<RiderProfile />}
        />
      </Route>

      {/* =========================
          ADMINISTRATION
      ========================== */}
      <Route element={<AdminLayout />}>
        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/customers"
          element={<AdminCustomers />}
        />

        <Route
          path="/admin/businesses"
          element={<AdminBusinesses />}
        />

        <Route
          path="/admin/riders"
          element={<AdminRiders />}
        />

        <Route
          path="/admin/orders"
          element={<AdminOrders />}
        />

        <Route
          path="/admin/orders/:orderId"
          element={<AdminOrderDetails />}
        />

        <Route
          path="/admin/payments"
          element={<AdminPayments />}
        />

        <Route
          path="/admin/refunds"
          element={<AdminRefunds />}
        />

        <Route
          path="/admin/wallets"
          element={<AdminWallets />}
        />

        <Route
          path="/admin/categories"
          element={<AdminCategories />}
        />

        <Route
          path="/admin/delivery"
          element={<AdminDelivery />}
        />

        <Route
          path="/admin/fees"
          element={<AdminFees />}
        />

        <Route
          path="/admin/disputes"
          element={<AdminDisputes />}
        />

        <Route
          path="/admin/messages"
          element={<AdminMessages />}
        />

        <Route
          path="/admin/settings"
          element={<AdminSettings />}
        />

        <Route
          path="/admin/audit"
          element={<AdminAudit />}
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
