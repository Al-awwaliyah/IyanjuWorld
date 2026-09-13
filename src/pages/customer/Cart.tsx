import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { getAuthState } from "../../libs/auth";
import {
  formatNaira,
  getSafeErrorMessage,
} from "../../libs/format";
import { supabase } from "../../libs/supabase";

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

export default function CustomerCart() {
  const navigate = useNavigate();

  const [cart, setCart] = useState<CartRecord | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [removingItem, setRemovingItem] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadCart() {
    setLoading(true);
    setError("");

    try {
      const authState = await getAuthState();

      if (!authState.user || !authState.profile) {
        navigate("/login", {
          replace: true,
          state: { from: "/customer/cart" },
        });
        return;
      }

      if (authState.profile.role !== "customer") {
        throw new Error("This cart is only available to customers.");
      }

      const { data: cartData, error: cartError } = await supabase
        .from("carts")
        .select("id")
        .eq("customer_id", authState.user.id)
        .maybeSingle();

      if (cartError) {
        console.error("CustomerCart: failed to load cart", cartError);
        throw cartError;
      }

      if (!cartData) {
        setCart(null);
        setItems([]);
        return;
      }

      setCart(cartData as CartRecord);

      const { data: itemData, error: itemError } = await supabase
        .from("cart_item_details")
        .select(
          "id, cart_id, product_id, quantity, unit_price, subtotal, product_name, product_image, business_id, business_name, available_stock"
        )
        .eq("cart_id", cartData.id)
        .order("created_at", { ascending: true });

      if (itemError) {
        console.error("CustomerCart: failed to load cart items", itemError);
        throw itemError;
      }

      setItems((itemData ?? []) as CartItem[]);
    } catch (loadError) {
      console.error("CustomerCart: unexpected load error", loadError);

      setError(
        getSafeErrorMessage(
          loadError,
          "We couldn't load your cart right now. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCart();
  }, []);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + Number(item.subtotal || 0),
        0
      ),
    [items]
  );

  const itemCount = useMemo(
    () =>
      items.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      ),
    [items]
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

  async function updateQuantity(item: CartItem, nextQuantity: number) {
    if (nextQuantity < 1) {
      return;
    }

    if (
      item.available_stock !== null &&
      nextQuantity > Number(item.available_stock)
    ) {
      setError(
        `Only ${item.available_stock} unit${
          Number(item.available_stock) === 1 ? "" : "s"
        } of ${item.product_name} ${Number(item.available_stock) === 1 ? "is" : "are"} currently available.`
      );
      return;
    }

    setUpdatingItem(item.id);
    setError("");

    try {
      const { data, error: updateError } = await supabase
        .from("cart_items")
        .update({ quantity: nextQuantity })
        .eq("id", item.id)
        .select("id, quantity")
        .single();

      if (updateError) {
        console.error(
          "CustomerCart: failed to update quantity",
          updateError
        );
        throw updateError;
      }

      if (data) {
        setItems((currentItems) =>
          currentItems.map((currentItem) =>
            currentItem.id === item.id
              ? {
                  ...currentItem,
                  quantity: nextQuantity,
                  subtotal:
                    Number(currentItem.unit_price) * nextQuantity,
                }
              : currentItem
          )
        );
      } else {
        await loadCart();
      }
    } catch (updateError) {
      console.error(
        "CustomerCart: unexpected quantity update error",
        updateError
      );

      setError(
        getSafeErrorMessage(
          updateError,
          "We couldn't update this item. Please try again."
        )
      );
    } finally {
      setUpdatingItem(null);
    }
  }

  async function removeItem(item: CartItem) {
    setRemovingItem(item.id);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", item.id)
        .eq("cart_id", item.cart_id);

      if (deleteError) {
        console.error(
          "CustomerCart: failed to remove item",
          deleteError
        );
        throw deleteError;
      }

      setItems((currentItems) =>
        currentItems.filter((currentItem) => currentItem.id !== item.id)
      );
    } catch (removeError) {
      console.error(
        "CustomerCart: unexpected remove error",
        removeError
      );

      setError(
        getSafeErrorMessage(
          removeError,
          "We couldn't remove this item. Please try again."
        )
      );
    } finally {
      setRemovingItem(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="h-96 animate-pulse rounded-2xl bg-white" />
            <div className="h-72 animate-pulse rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !cart && items.length === 0) {
    return (
      <div className="min-h-full bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <ShoppingBag className="h-7 w-7 text-red-500" />
            </div>

            <h1 className="mt-4 text-xl font-bold text-slate-900">
              Unable to load your cart
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadCart()}
              className="mt-5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-600">
              Customer dashboard
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Shopping cart
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review your products before continuing to checkout.
            </p>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Continue shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-8 w-8 text-slate-400" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Discover products from businesses on IyanjuWorld and add
              something you would like to purchase.
            </p>

            <Link
              to="/explore"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              Explore marketplace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Cart items
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {itemCount}{" "}
                    {itemCount === 1 ? "item" : "items"}
                  </p>
                </div>

                <Package className="h-5 w-5 text-slate-400" />
              </div>

              {hasStockIssue && (
                <div className="mx-5 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 sm:mx-6">
                  Some quantities in your cart are higher than the
                  currently available stock. Please adjust them before
                  checkout.
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const busy =
                    updatingItem === item.id ||
                    removingItem === item.id;

                  return (
                    <div
                      key={item.id}
                      className="p-5 sm:p-6"
                    >
                      <div className="flex gap-4">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {item.product_image ? (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-8 w-8 text-slate-300" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate font-semibold text-slate-900">
                                {item.product_name}
                              </h3>

                              {item.business_name && (
                                <p className="mt-1 text-sm text-slate-500">
                                  {item.business_name}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => void removeItem(item)}
                              disabled={busy}
                              aria-label={`Remove ${item.product_name}`}
                              className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <p className="text-sm text-slate-500">
                                {formatNaira(item.unit_price)} each
                              </p>

                              {item.available_stock !== null && (
                                <p
                                  className={`mt-1 text-xs ${
                                    Number(item.available_stock) <
                                    Number(item.quantity)
                                      ? "font-semibold text-red-600"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {item.available_stock} in stock
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-5 sm:justify-end">
                              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void updateQuantity(
                                      item,
                                      Number(item.quantity) - 1
                                    )
                                  }
                                  disabled={busy || item.quantity <= 1}
                                  className="flex h-9 w-9 items-center justify-center text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>

                                <span className="min-w-9 text-center text-sm font-semibold text-slate-900">
                                  {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void updateQuantity(
                                      item,
                                      Number(item.quantity) + 1
                                    )
                                  }
                                  disabled={
                                    busy ||
                                    (item.available_stock !== null &&
                                      Number(item.quantity) >=
                                        Number(item.available_stock))
                                  }
                                  className="flex h-9 w-9 items-center justify-center text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>

                              <p className="min-w-24 text-right text-base font-bold text-slate-900">
                                {formatNaira(item.subtotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-bold text-slate-900">
                Cart summary
              </h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Items</span>
                  <span>{itemCount}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Product subtotal</span>
                  <span>{formatNaira(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Delivery</span>
                  <span className="text-xs text-slate-400">
                    Calculated at checkout
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      Products total
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      {formatNaira(subtotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-brand-50 p-3 text-xs leading-5 text-brand-700">
                Your final total will include the applicable delivery
                fee. IyanjuWorld does not charge customers a separate
                platform fee.
              </div>

              <button
                type="button"
                disabled={hasStockIssue}
                onClick={() => navigate("/customer/checkout")}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Proceed to checkout
                <ArrowRight className="h-4 w-4" />
              </button>

              <Link
                to="/explore"
                className="mt-3 flex w-full items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
