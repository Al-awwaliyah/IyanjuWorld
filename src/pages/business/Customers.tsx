

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  Search,
  ShoppingBag,
  Users,
  XCircle,
} from "lucide-react";
import { supabase } from "../../libs/supabase";
import { getCurrentProfile, type Profile } from "../../libs/auth";
import {
  getSafeErrorMessage,
  logAppError,
} from "../../libs/errors";
import {
  formatDateTime,
  formatNaira,
} from "../../libs/format";

type Business = {
  id: string;
  name: string;
  owner_id: string;
};

type Order = {
  id: string;
  reference: string | null;
  customer_id: string;
  status: string;
  total_amount: number;
  created_at: string;
};

type Customer = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type CustomerSummary = Customer & {
  orderCount: number;
  completedOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
};

function isCompletedOrder(status: string) {
  return ["delivered", "completed"].includes(status);
}

function isCancelledOrder(status: string) {
  return ["cancelled", "refunded", "disputed"].includes(status);
}

export default function BusinessCustomers() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    setError("");

    try {
      const currentProfile = await getCurrentProfile();

      if (!currentProfile) {
        throw new Error("Unable to load your account.");
      }

      setProfile(currentProfile);

      const { data: businessData, error: businessError } =
        await supabase
          .from("businesses")
          .select("id, name, owner_id")
          .eq("owner_id", currentProfile.id)
          .maybeSingle();

      if (businessError) {
        throw businessError;
      }

      if (!businessData) {
        throw new Error(
          "Your business profile could not be found.",
        );
      }

      setBusiness(businessData as Business);

      const { data: orderData, error: orderError } =
        await supabase
          .from("orders")
          .select(
            "id, reference, customer_id, status, total_amount, created_at",
          )
          .eq("business_id", businessData.id)
          .order("created_at", { ascending: false });

      if (orderError) {
        throw orderError;
      }

      const orders = (orderData ?? []) as Order[];

      if (orders.length === 0) {
        setCustomers([]);
        return;
      }

      const customerIds = [
        ...new Set(
          orders
            .map((order) => order.customer_id)
            .filter(Boolean),
        ),
      ];

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .in("id", customerIds);

      if (profileError) {
        throw profileError;
      }

      const customerProfiles = (profileData ?? []) as Customer[];

      const customerMap = new Map(
        customerProfiles.map((customer) => [
          customer.id,
          customer,
        ]),
      );

      const summaryMap = new Map<string, CustomerSummary>();

      for (const order of orders) {
        if (!order.customer_id) {
          continue;
        }

        const existing = summaryMap.get(order.customer_id);
        const customer = customerMap.get(order.customer_id);

        if (!existing) {
          summaryMap.set(order.customer_id, {
            id: order.customer_id,
            full_name: customer?.full_name ?? null,
            email: customer?.email ?? null,
            phone: customer?.phone ?? null,
            orderCount: 1,
            completedOrders: isCompletedOrder(order.status)
              ? 1
              : 0,
            totalSpent: isCancelledOrder(order.status)
              ? 0
              : Number(order.total_amount || 0),
            lastOrderAt: order.created_at,
          });

          continue;
        }

        existing.orderCount += 1;

        if (isCompletedOrder(order.status)) {
          existing.completedOrders += 1;
        }

        if (!isCancelledOrder(order.status)) {
          existing.totalSpent += Number(
            order.total_amount || 0,
          );
        }

        if (
          !existing.lastOrderAt ||
          new Date(order.created_at).getTime() >
            new Date(existing.lastOrderAt).getTime()
        ) {
          existing.lastOrderAt = order.created_at;
        }
      }

      setCustomers(
        Array.from(summaryMap.values()).sort(
          (a, b) =>
            new Date(b.lastOrderAt || 0).getTime() -
            new Date(a.lastOrderAt || 0).getTime(),
        ),
      );
    } catch (err) {
      logAppError("business-customers-load", err);
      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) =>
      [
        customer.full_name || "",
        customer.email || "",
        customer.phone || "",
        customer.id,
      ].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [customers, search]);

  const totalCustomers = customers.length;

  const totalCompletedOrders = customers.reduce(
    (total, customer) => total + customer.completedOrders,
    0,
  );

  const totalCustomerValue = customers.reduce(
    (total, customer) => total + customer.totalSpent,
    0,
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading customers...</span>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <Users className="mx-auto mb-4 h-10 w-10 text-gray-400" />

          <h1 className="text-xl font-semibold text-gray-900">
            Business profile unavailable
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {error ||
              "We could not find a business associated with your account."}
          </p>

          <Link
            to="/business/settings"
            className="mt-6 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Open Business Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customers
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Customers who have ordered products from {business.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadCustomers()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Users className="h-5 w-5 text-gray-600" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Total Customers
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {totalCustomers}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <ShoppingBag className="h-5 w-5 text-gray-600" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Completed Orders
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {totalCompletedOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <ShoppingBag className="h-5 w-5 text-gray-600" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Customer Order Value
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {formatNaira(totalCustomerValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Customer Directory
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredCustomers.length} customer
                {filteredCustomers.length === 1 ? "" : "s"} shown
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search customers..."
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto mb-4 h-10 w-10 text-gray-300" />

            <h3 className="text-lg font-semibold text-gray-900">
              {customers.length === 0
                ? "No customers yet"
                : "No matching customers"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              {customers.length === 0
                ? "Customers who place orders for your products will appear here."
                : "Try a different name, email address, or phone number."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="p-5 transition hover:bg-gray-50/70"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <Users className="h-5 w-5 text-gray-500" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900">
                        {customer.full_name || "Customer"}
                      </h3>

                      <div className="mt-2 flex flex-col gap-1 text-sm text-gray-500">
                        {customer.email && (
                          <span className="flex items-center gap-2 break-all">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            {customer.email}
                          </span>
                        )}

                        {customer.phone && (
                          <span className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            {customer.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:min-w-[560px]">
                    <div>
                      <p className="text-xs text-gray-500">
                        Orders
                      </p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {customer.orderCount}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Completed
                      </p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {customer.completedOrders}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Order Value
                      </p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {formatNaira(customer.totalSpent)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Last Order
                      </p>

                      <p className="mt-1 font-medium text-gray-700">
                        {customer.lastOrderAt
                          ? formatDateTime(customer.lastOrderAt)
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    {customer.phone && (
                      <a
                        href={`tel:${customer.phone}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        <Phone className="h-4 w-4" />
                        Call
                      </a>
                    )}

                    <Link
                      to={`/business/orders?customer=${encodeURIComponent(
                        customer.id,
                      )}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Orders
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
