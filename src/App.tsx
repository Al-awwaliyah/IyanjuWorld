import { BrowserRouter, Navigate, Outlet, Route, Routes, } from "react-router-dom";
function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main>
      <h1>{title}</h1>
      <p>{description}</p>
    </main>
  );
}

function PublicLayout() {
  return <Outlet />;
}

function AuthLayout() {
  return <Outlet />;
}

function CustomerLayout() {
  return <Outlet />;
}

function BusinessLayout() {
  return <Outlet />;
}

function RiderLayout() {
  return <Outlet />;
}

function AdminLayout() {
  return <Outlet />;
}

function NotFoundPage() {
  return (
    <PagePlaceholder
      title="Page not found"
      description="The page you are looking for does not exist."
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =====================================================
            PUBLIC MARKETPLACE
           ===================================================== */}

        <Route element={<PublicLayout />}>
          <Route
            path="/"
            element={
              <PagePlaceholder
                title="IyanjuWorld"
                description="Discover products and local businesses across Nigeria."
              />
            }
          />

          <Route
            path="/explore"
            element={
              <PagePlaceholder
                title="Explore"
                description="Browse products from businesses on IyanjuWorld."
              />
            }
          />

          <Route
            path="/products"
            element={
              <PagePlaceholder
                title="Products"
                description="Browse available products."
              />
            }
          />

          <Route
            path="/products/:productId"
            element={
              <PagePlaceholder
                title="Product"
                description="View product details."
              />
            }
          />

          <Route
            path="/businesses"
            element={
              <PagePlaceholder
                title="Businesses"
                description="Discover businesses on IyanjuWorld."
              />
            }
          />

          <Route
            path="/businesses/:slug"
            element={
              <PagePlaceholder
                title="Business"
                description="View business information and products."
              />
            }
          />

          <Route
            path="/search"
            element={
              <PagePlaceholder
                title="Search"
                description="Search products and businesses."
              />
            }
          />
        </Route>

        {/* =====================================================
            AUTHENTICATION
           ===================================================== */}

        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <PagePlaceholder
                title="Sign in"
                description="Sign in to your IyanjuWorld account."
              />
            }
          />

          <Route
            path="/register"
            element={
              <PagePlaceholder
                title="Create account"
                description="Create your IyanjuWorld account."
              />
            }
          />

          <Route
            path="/forgot-password"
            element={
              <PagePlaceholder
                title="Forgot password"
                description="Recover access to your account."
              />
            }
          />

          <Route
            path="/reset-password"
            element={
              <PagePlaceholder
                title="Reset password"
                description="Set a new account password."
              />
            }
          />
        </Route>

        {/* =====================================================
            CUSTOMER
           ===================================================== */}

        <Route
          path="/customer"
          element={<CustomerLayout />}
        >
          <Route
            index
            element={
              <Navigate
                to="/customer/dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <PagePlaceholder
                title="Customer Dashboard"
                description="Manage your IyanjuWorld account and activity."
              />
            }
          />

          <Route
            path="orders"
            element={
              <PagePlaceholder
                title="My Orders"
                description="View your orders and delivery status."
              />
            }
          />

          <Route
            path="orders/:orderId"
            element={
              <PagePlaceholder
                title="Order"
                description="View order details and tracking."
              />
            }
          />

          <Route
            path="cart"
            element={
              <PagePlaceholder
                title="Cart"
                description="Review your shopping cart."
              />
            }
          />

          <Route
            path="wallet"
            element={
              <PagePlaceholder
                title="Wallet"
                description="Manage your IyanjuWorld wallet."
              />
            }
          />

          <Route
            path="messages"
            element={
              <PagePlaceholder
                title="Messages"
                description="View your conversations."
              />
            }
          />

          <Route
            path="profile"
            element={
              <PagePlaceholder
                title="Profile"
                description="Manage your profile."
              />
            }
          />
        </Route>

        {/* =====================================================
            BUSINESS OWNER
           ===================================================== */}

        <Route
          path="/business"
          element={<BusinessLayout />}
        >
          <Route
            index
            element={
              <Navigate
                to="/business/dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <PagePlaceholder
                title="Business Dashboard"
                description="Manage your business on IyanjuWorld."
              />
            }
          />

          <Route
            path="products"
            element={
              <PagePlaceholder
                title="Products"
                description="Manage your products, prices, stock and images."
              />
            }
          />

          <Route
            path="products/new"
            element={
              <PagePlaceholder
                title="Add Product"
                description="Create a new product."
              />
            }
          />

          <Route
            path="products/:productId/edit"
            element={
              <PagePlaceholder
                title="Edit Product"
                description="Update product information."
              />
            }
          />

          <Route
            path="orders"
            element={
              <PagePlaceholder
                title="Business Orders"
                description="Manage incoming customer orders."
              />
            }
          />

          <Route
            path="orders/:orderId"
            element={
              <PagePlaceholder
                title="Business Order"
                description="Review and manage an order."
              />
            }
          />

          <Route
            path="customers"
            element={
              <PagePlaceholder
                title="Customers"
                description="View customers who have ordered from your business."
              />
            }
          />

          <Route
            path="earnings"
            element={
              <PagePlaceholder
                title="Earnings"
                description="View business earnings and settlements."
              />
            }
          />

          <Route
            path="payouts"
            element={
              <PagePlaceholder
                title="Payouts"
                description="View business payouts."
              />
            }
          />

          <Route
            path="messages"
            element={
              <PagePlaceholder
                title="Messages"
                description="Manage business conversations."
              />
            }
          />

          <Route
            path="settings"
            element={
              <PagePlaceholder
                title="Business Settings"
                description="Manage business information."
              />
            }
          />
        </Route>

        {/* =====================================================
            RIDER
           ===================================================== */}

        <Route
          path="/rider"
          element={<RiderLayout />}
        >
          <Route
            index
            element={
              <Navigate
                to="/rider/dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <PagePlaceholder
                title="Rider Dashboard"
                description="Manage deliveries and rider activity."
              />
            }
          />

          <Route
            path="requests"
            element={
              <PagePlaceholder
                title="Delivery Requests"
                description="View available delivery requests."
              />
            }
          />

          <Route
            path="deliveries"
            element={
              <PagePlaceholder
                title="My Deliveries"
                description="View active and completed deliveries."
              />
            }
          />

          <Route
            path="deliveries/:orderId"
            element={
              <PagePlaceholder
                title="Delivery"
                description="Manage an active delivery."
              />
            }
          />

          <Route
            path="earnings"
            element={
              <PagePlaceholder
                title="Rider Earnings"
                description="View delivery earnings."
              />
            }
          />

          <Route
            path="messages"
            element={
              <PagePlaceholder
                title="Messages"
                description="View rider conversations."
              />
            }
          />

          <Route
            path="profile"
            element={
              <PagePlaceholder
                title="Rider Profile"
                description="Manage rider information."
              />
            }
          />
        </Route>

        {/* =====================================================
            ADMIN
           ===================================================== */}

        <Route
          path="/admin"
          element={<AdminLayout />}
        >
          <Route
            index
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <PagePlaceholder
                title="Admin Dashboard"
                description="Manage IyanjuWorld."
              />
            }
          />

          <Route
            path="customers"
            element={
              <PagePlaceholder
                title="Customers"
                description="Manage customer accounts."
              />
            }
          />

          <Route
            path="businesses"
            element={
              <PagePlaceholder
                title="Businesses"
                description="Manage marketplace businesses."
              />
            }
          />

          <Route
            path="riders"
            element={
              <PagePlaceholder
                title="Riders"
                description="Manage riders and verification."
              />
            }
          />

          <Route
            path="orders"
            element={
              <PagePlaceholder
                title="Orders"
                description="Manage marketplace orders."
              />
            }
          />

          <Route
            path="orders/:orderId"
            element={
              <PagePlaceholder
                title="Order Management"
                description="Review and manage an order."
              />
            }
          />

          <Route
            path="payments"
            element={
              <PagePlaceholder
                title="Payments"
                description="Monitor marketplace payments."
              />
            }
          />

          <Route
            path="refunds"
            element={
              <PagePlaceholder
                title="Refunds"
                description="Manage wallet-based marketplace refunds."
              />
            }
          />

          <Route
            path="wallets"
            element={
              <PagePlaceholder
                title="Wallets"
                description="Manage customer wallet activity."
              />
            }
          />

          <Route
            path="categories"
            element={
              <PagePlaceholder
                title="Categories"
                description="Manage product categories."
              />
            }
          />

          <Route
            path="delivery"
            element={
              <PagePlaceholder
                title="Delivery"
                description="Manage delivery zones and pricing."
              />
            }
          />

          <Route
            path="fees"
            element={
              <PagePlaceholder
                title="Fees"
                description="Manage marketplace fees."
              />
            }
          />

          <Route
            path="disputes"
            element={
              <PagePlaceholder
                title="Disputes"
                description="Manage customer and business disputes."
              />
            }
          />

          <Route
            path="messages"
            element={
              <PagePlaceholder
                title="Messages"
                description="Manage marketplace conversations."
              />
            }
          />

          <Route
            path="settings"
            element={
              <PagePlaceholder
                title="Settings"
                description="Manage marketplace settings."
              />
            }
          />

          <Route
            path="audit"
            element={
              <PagePlaceholder
                title="Audit Logs"
                description="Review administrative activity."
              />
            }
          />
        </Route>

        {/* =====================================================
            FALLBACK
           ===================================================== */}

        <Route
          path="/404"
          element={<NotFoundPage />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/404"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
