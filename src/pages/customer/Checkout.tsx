import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { getAuthState } from "../../libs/auth";
import {
  formatNaira,
  getSafeErrorMessage,
} from "../../libs/format";
import { getPublicFileUrl } from "../../libs/storage";
import { supabase } from "../../libs/supabase";

function resolveProductImage(value: string | null): string | null {
  if (!value) return null;
  const path = value.trim();
  if (!path) return null;
  if (/^(https?:\/\/|data:)/i.test(path)) return path;
  return getPublicFileUrl("product-images", path);
}

interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name: string;
  product_image: string | null;
  business_id: string | null;
  business_name: string | null;
  available_stock: number | null;
}

interface CartRecord {
  id: string;
}

interface AddressRecord {
  id: string;
  label: string | null;
  address: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  is_default: boolean;
}

type PaymentMethod =
  | "wallet"
  | "card"
  | "banktransfer"
  | "ussd"
  | "opay";

export default function CustomerCheckout() {
  const navigate = useNavigate();

  const [cart, setCart] = useState<CartRecord | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("wallet");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [customerNote, setCustomerNote] = useState("");

  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  async function loadCheckout() {
    setLoading(true);
    setError("");

    try {
      const authState = await getAuthState();

      if (!authState.user || !authState.profile) {
        navigate("/login", {
          replace: true,
          state: { from: "/customer/checkout" },
        });
        return;
      }

      if (authState.profile.role !== "customer") {
        throw new Error(
          "Checkout is only available to customers."
        );
      }

      const [
        { data: cartData, error: cartError },
        { data: addressData, error: addressError },
        { data: walletData, error: walletError },
      ] = await Promise.all([
        supabase
          .from("carts")
          .select("id")
          .eq("customer_id", authState.user.id)
          .eq("status", "active")
          .maybeSingle(),

        supabase
          .from("customer_addresses")
          .select(
            "id, label, address, city, state, phone, is_default"
          )
          .eq("customer_id", authState.user.id)
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: false }),

        supabase
          .from("customer_wallets")
          .select("available_balance")
          .eq("customer_id", authState.user.id)
          .maybeSingle(),
      ]);

      if (cartError) {
        console.error(
          "CustomerCheckout: failed to load cart",
          cartError
        );
        throw cartError;
      }

      if (addressError) {
        console.error(
          "CustomerCheckout: failed to load addresses",
          addressError
        );
        throw addressError;
      }

      if (walletError) {
        console.error(
          "CustomerCheckout: failed to load wallet",
          walletError
        );
        throw walletError;
      }

      setCart(cartData as CartRecord | null);

      const loadedAddresses =
        (addressData ?? []) as AddressRecord[];

      setAddresses(loadedAddresses);

      const defaultAddress =
        loadedAddresses.find((address) => address.is_default) ??
        loadedAddresses[0];

      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }

      setWalletBalance(
        Number(walletData?.available_balance ?? 0)
      );

      if (!cartData) {
        setItems([]);
        return;
      }

      const { data: itemData, error: itemError } = await supabase
        .from("cart_item_details")
        .select(
          "id, cart_id, product_id, quantity, unit_price, subtotal, product_name, product_image, business_id, business_name, available_stock"
        )
        .eq("cart_id", cartData.id)
        .order("created_at", { ascending: true });

      if (itemError) {
        console.error(
          "CustomerCheckout: failed to load cart items",
          itemError
        );
        throw itemError;
      }

      setItems(
        (itemData ?? []).map((item) => ({
          ...(item as CartItem),
          product_image: item.product_image
            ? resolveProductImage(item.product_image)
            : null,
        })),
      );
    } catch (loadError) {
      console.error(
        "CustomerCheckout: unexpected load error",
        loadError
      );

      setError(
        getSafeErrorMessage(
          loadError,
          "We couldn't prepare checkout right now. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCheckout();
  }, []);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + Number(item.subtotal || 0),
        0
      ),
    [items]
  );

  const total = subtotal + deliveryFee;

  const selectedAddress = useMemo(
    () =>
      addresses.find(
        (address) => address.id === selectedAddressId
      ) ?? null,
    [addresses, selectedAddressId]
  );

  const hasStockIssue = useMemo(
    () =>
      items.some(
        (item) =>
          item.available_stock !== null &&
          Number(item.quantity) > Number(item.available_stock)
      ),
    [items]
  );

  const walletCanCoverOrder =
    paymentMethod === "wallet" && walletBalance >= total;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!cart || items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!selectedAddress) {
      setError("Please select a delivery address.");
      return;
    }

    if (hasStockIssue) {
      setError(
        "One or more items no longer have enough stock. Please return to your cart and adjust the quantities."
      );
      return;
    }

    if (paymentMethod === "wallet" && !walletCanCoverOrder) {
      setError(
        "Your wallet balance is not enough to complete this order. Please choose another payment method."
      );
      return;
    }

    setPlacingOrder(true);

    try {
      const { data: checkoutRows, error: checkoutError } = await supabase.rpc(
        "checkout_cart",
        {
          p_cart_id: cart.id,
          p_delivery_address: {
            address_line: selectedAddress.address,
            city: selectedAddress.city || "",
            state: selectedAddress.state || "",
            country: "Nigeria",
          },
          p_customer_note: customerNote.trim() || null,
        },
      );

      if (checkoutError) {
        console.error(
          "CustomerCheckout: checkout_cart failed",
          checkoutError,
        );
        throw checkoutError;
      }

      const createdOrders = Array.isArray(checkoutRows)
        ? checkoutRows
        : checkoutRows
          ? [checkoutRows]
          : [];

      if (createdOrders.length === 0) {
        throw new Error(
          "We couldn't create your order. Please try again.",
        );
      }

      const firstOrder = createdOrders[0] as {
        id?: string;
        order_id?: string;
      };
      const createdOrderId = firstOrder.id ?? firstOrder.order_id;

      if (createdOrderId) {
        navigate(`/customer/orders/${createdOrderId}`, {
          replace: true,
          state: {
            orderCreated: true,
            paymentRequired: false,
          },
        });
        return;
      }

      throw new Error(
        "Your order could not be completed. Please try again.",
      );
    } catch (submitError) {
      console.error(
        "CustomerCheckout: unexpected checkout error",
        submitError
      );

      setError(
        getSafeErrorMessage(
          submitError,
          "We couldn't complete your order right now. Please try again."
        )
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-7 w-40 animate-pulse rounded bg-slate-200" />

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="h-[520px] animate-pulse rounded-2xl bg-white" />
            <div className="h-[420px] animate-pulse rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-full bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-8 w-8 text-slate-400" />
            </div>

            <h1 className="mt-5 text-xl font-bold text-slate-900">
              Your cart is empty
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Add products to your cart before continuing to
              checkout.
            </p>

            <Link
              to="/explore"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Explore marketplace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to="/customer/cart"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cart
        </Link>

        <div className="mt-5">
          <p className="text-sm font-medium text-brand-600">
            Customer checkout
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Complete your order
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Confirm your delivery details and payment method.
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]"
        >
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-brand-600" />

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Delivery address
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Where should your order be delivered?
                  </p>
                </div>
              </div>

              {addresses.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                  <MapPin className="mx-auto h-7 w-7 text-slate-400" />

                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    No delivery address found
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Add a delivery address before placing your
                    order.
                  </p>

                  <Link
                    to="/customer/profile"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-900 dark-surface"
                  >
                    Add address
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {addresses.map((address) => {
                    const selected =
                      selectedAddressId === address.id;

                    return (
                      <label
                        key={address.id}
                        className={`block cursor-pointer rounded-xl border p-4 transition ${
                          selected
                            ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="delivery-address"
                            value={address.id}
                            checked={selected}
                            onChange={() =>
                              setSelectedAddressId(address.id)
                            }
                            className="mt-1 h-4 w-4 accent-brand-600"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">
                                {address.label || "Delivery address"}
                              </p>

                              {address.is_default && (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                  Default
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {address.address}
                              {address.city
                                ? `, ${address.city}`
                                : ""}
                              {address.state
                                ? `, ${address.state}`
                                : ""}
                            </p>

                            {address.phone && (
                              <p className="mt-1 text-xs text-slate-500">
                                {address.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-600" />

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Payment method
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Choose how you want to pay for this order.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <label
                  className={`block cursor-pointer rounded-xl border p-4 transition ${
                    paymentMethod === "wallet"
                      ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment-method"
                      value="wallet"
                      checked={paymentMethod === "wallet"}
                      onChange={() =>
                        setPaymentMethod("wallet")
                      }
                      className="mt-1 h-4 w-4 accent-brand-600"
                    />

                    <Wallet className="mt-0.5 h-5 w-5 text-brand-600" />

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">
                          IyanjuWorld Wallet
                        </p>

                        <span className="text-sm font-bold text-slate-900">
                          {formatNaira(walletBalance)}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        Pay directly from your available wallet
                        balance.
                      </p>

                      {walletBalance < total && (
                        <p className="mt-2 text-xs font-medium text-amber-600">
                          Insufficient wallet balance for this
                          order.
                        </p>
                      )}
                    </div>
                  </div>
                </label>

                {[
                  {
                    value: "card" as const,
                    title: "Card",
                    description:
                      "Pay securely using a supported bank card.",
                  },
                  {
                    value: "banktransfer" as const,
                    title: "Bank transfer",
                    description:
                      "Pay through a secure bank transfer checkout.",
                  },
                  {
                    value: "ussd" as const,
                    title: "USSD",
                    description:
                      "Use a supported bank USSD payment option.",
                  },
                  {
                    value: "opay" as const,
                    title: "OPay",
                    description:
                      "Pay using a supported OPay payment channel.",
                  },
                ].map((method) => (
                  <label
                    key={method.value}
                    className={`block cursor-pointer rounded-xl border p-4 transition ${
                      paymentMethod === method.value
                        ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="payment-method"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={() =>
                          setPaymentMethod(method.value)
                        }
                        className="mt-1 h-4 w-4 accent-brand-600"
                      />

                      <CreditCard className="mt-0.5 h-5 w-5 text-slate-500" />

                      <div>
                        <p className="font-semibold text-slate-900">
                          {method.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {method.description}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-brand-600" />

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Order note
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Optional instructions for the business or rider.
                  </p>
                </div>
              </div>

              <textarea
                value={customerNote}
                onChange={(event) =>
                  setCustomerNote(event.target.value)
                }
                rows={4}
                maxLength={500}
                placeholder="Add any useful delivery instructions..."
                className="mt-5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />

              <p className="mt-2 text-right text-xs text-slate-400">
                {customerNote.length}/500
              </p>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-brand-600" />
              <h2 className="text-base font-bold text-slate-900">
                Order summary
              </h2>
            </div>

            <div className="mt-5 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-5 w-5 text-slate-300" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {item.product_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-semibold text-slate-900">
                    {formatNaira(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Product subtotal</span>
                <span>{formatNaira(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Delivery fee</span>
                <span>
                  {deliveryFee > 0
                    ? formatNaira(deliveryFee)
                    : "Calculated"}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    Customer total
                  </span>

                  <span className="text-xl font-bold text-slate-900">
                    {deliveryFee > 0
                      ? formatNaira(total)
                      : formatNaira(subtotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-emerald-50 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

                <p className="text-xs leading-5 text-emerald-700">
                  You pay the product subtotal plus the applicable
                  delivery fee. There is no separate IyanjuWorld
                  platform fee for customers.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

                <p className="text-xs leading-5 text-slate-500">
                  Your payment is verified server-side before the
                  order is marked as paid.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                placingOrder ||
                addresses.length === 0 ||
                !selectedAddress ||
                hasStockIssue ||
                (paymentMethod === "wallet" && !walletCanCoverOrder)
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {placingOrder ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Processing...
                </>
              ) : (
                <>
                  Continue to payment
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
              By placing this order, you agree to the applicable
              marketplace and delivery terms.
            </p>
          </aside>
        </form>
      </div>
    </div>
  );
}
