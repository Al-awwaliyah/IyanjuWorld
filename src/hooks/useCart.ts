import { useCallback, useEffect, useState } from "react";
import { getAuthState } from "../libs/auth";
import { supabase } from "../libs/supabase";

export function useCart() {
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const auth = await getAuthState();
      if (!auth.user || !auth.profile || auth.profile.role !== "customer") {
        setCartCount(0);
        return;
      }

      const { data: cart, error: cartError } = await supabase
        .from("carts")
        .select("id")
        .eq("customer_id", auth.user.id)
        .eq("status", "active")
        .maybeSingle();

      if (cartError || !cart) {
        setCartCount(0);
        return;
      }

      const { data: items, error } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("cart_id", cart.id);

      if (error) throw error;
      setCartCount((items ?? []).reduce((sum, item) => sum + Number(item.quantity ?? 0), 0));
    } catch (error) {
      console.error("useCart: failed to load cart count", error);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const handler = () => void refresh();
    window.addEventListener("iyanjuworld:cart-updated", handler);
    return () => window.removeEventListener("iyanjuworld:cart-updated", handler);
  }, [refresh]);

  return { cartCount, loading, refresh };
}

export default useCart;
