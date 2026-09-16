import {
  supabase,
} from "./supabase";

import {
  createAppError,
  logAppError,
} from "./errors";

export async function getProfile(
  userId: string,
) {
  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .select(
      [
        "id",
        "full_name",
        "phone",
        "role",
        "admin_role",
        "avatar",
        "active",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    logAppError(
      "Failed to load profile.",
      error,
    );

    throw createAppError(
      error,
      "SERVER_ERROR",
    );
  }

  return data;
}

export async function getActiveBusinesses(
  limit = 50,
) {
  const {
    data,
    error,
  } = await supabase
    .from("businesses")
    .select(
      [
        "id",
        "name",
        "slug",
        "description",
        "logo",
        "cover",
        "phone",
        "whatsapp",
        "email",
        "address",
        "city",
        "state",
        "country",
        "latitude",
        "longitude",
        "status",
        "verified",
        "open",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .eq("status", "active")
    .eq("open", true)
    .order("created_at", {
      ascending: false,
    })
    .limit(limit);

  if (error) {
    logAppError(
      "Failed to load businesses.",
      error,
    );

    throw createAppError(
      error,
      "SERVER_ERROR",
    );
  }

  return data ?? [];
}

export async function getBusinessBySlug(
  slug: string,
) {
  const {
    data,
    error,
  } = await supabase
    .from("businesses")
    .select(
      [
        "id",
        "name",
        "slug",
        "description",
        "logo",
        "cover",
        "phone",
        "whatsapp",
        "email",
        "address",
        "city",
        "state",
        "country",
        "latitude",
        "longitude",
        "status",
        "verified",
        "open",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    logAppError(
      "Failed to load business.",
      error,
    );

    throw createAppError(
      error,
      "SERVER_ERROR",
    );
  }

  return data;
}

export async function getActiveCategories() {
  const {
    data,
    error,
  } = await supabase
    .from("categories")
    .select(
      [
        "id",
        "name",
        "slug",
        "description",
        "parent_id",
        "sort_order",
        "active",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .eq("active", true)
    .order("sort_order", {
      ascending: true,
    })
    .order("name", {
      ascending: true,
    });

  if (error) {
    logAppError(
      "Failed to load categories.",
      error,
    );

    throw createAppError(
      error,
      "SERVER_ERROR",
    );
  }

  return data ?? [];
}

export async function getPublicProducts(
  options?: {
    categoryId?: string;
    businessId?: string;
    search?: string;
    featured?: boolean;
    limit?: number;
  },
) {
  const limit =
    options?.limit ?? 50;

  let query = supabase
    .from("products")
    .select(
      `
        id,
        business_id,
        category_id,
        name,
        slug,
        description,
        sku,
        price,
        compare_at_price,
        stock,
        status,
        available,
        featured,
        sort_order,
        metadata,
        created_at,
        updated_at,
        businesses!inner (
          id,
          name,
          slug,
          logo,
          city,
          state,
          status,
          verified,
          open
        ),
        categories!inner (
          id,
          name,
          slug,
          active
        ),
        product_images (
          id,
          storage_path,
          alt_text,
          sort_order,
          is_primary
        )
      `,
    )
    .eq("status", "active")
    .eq("available", true)
    .gt("stock", 0)
    .eq("businesses.status", "active")
    .eq("categories.active", true);

  if (options?.categoryId) {
    query = query.eq(
      "category_id",
      options.categoryId,
    );
  }

  if (options?.businessId) {
    query = query.eq(
      "business_id",
      options.businessId,
    );
  }

  if (
    options?.search &&
    options.search.trim()
  ) {
    query = query.ilike(
      "name",
      `%${options.search.trim()}%`,
    );
  }

  if (
    typeof options?.featured ===
    "boolean"
  ) {
    query = query.eq(
      "featured",
      options.featured,
    );
  }

  const {
    data,
    error,
  } = await query
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: false,
    })
    .limit(limit);

  if (error) {
    logAppError(
      "Failed to load products.",
      error,
    );

    throw createAppError(
      error,
      "SERVER_ERROR",
    );
  }

  return data ?? [];
}

export async function getProductBySlug(
  businessId: string,
  slug: string,
) {
  const {
    data,
    error,
  } = await supabase
    .from("products")
    .select(
      `
        id,
        business_id,
        category_id,
        name,
        slug,
        description,
        sku,
        price,
        compare_at_price,
        stock,
        status,
        available,
        featured,
        sort_order,
        metadata,
        created_at,
        updated_at,
        businesses!inner (
          id,
          name,
          slug,
          logo,
          cover,
          phone,
          whatsapp,
          email,
          address,
          city,
          state,
          country,
          status,
          verified,
          open
        ),
        categories!inner (
          id,
          name,
          slug,
          active
        ),
        product_images (
          id,
          storage_path,
          alt_text,
          sort_order,
          is_primary
        )
      `,
    )
    .eq("business_id", businessId)
    .eq("slug", slug)
    .eq("status", "active")
    .eq("available", true)
    .gt("stock", 0)
    .eq("businesses.status", "active")
    .eq("categories.active", true)
    .maybeSingle();

  if (error) {
    logAppError(
      "Failed to load product.",
      error,
    );

    throw createAppError(
      error,
      "SERVER_ERROR",
    );
  }

  return data;
}

export async function getOrCreateActiveCart(
  userId: string,
) {
  const {
    data,
    error,
  } = await supabase.rpc(
    "get_or_create_active_cart",
    {},
  );

  if (error) {
    logAppError(
      "Failed to load customer cart.",
      error,
    );

    throw createAppError(
      error,
      "WALLET_ERROR",
    );
  }

  return data;
}

export async function getCart(
  cartId: string,
) {
  const {
    data,
    error,
  } = await supabase
    .from("cart_item_details")
    .select("*")
    .eq("cart_id", cartId);

  if (error) {
    logAppError(
      "Failed to load cart.",
      error,
    );

    throw createAppError(
      error,
      "SERVER_ERROR",
    );
  }

  return data ?? [];
}

export async function getCartSubtotal(
  cartId: string,
) {
  const {
    data,
    error,
  } = await supabase.rpc(
    "get_cart_subtotal",
    {
      p_cart_id: cartId,
    },
  );

  if (error) {
    logAppError(
      "Failed to calculate cart subtotal.",
      error,
    );

    throw createAppError(
      error,
      "SERVER_ERROR",
    );
  }

  return Number(data ?? 0);
}

export async function addToCart(
  cartId: string,
  productId: string,
  quantity: number,
) {
  if (
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    throw createAppError(
      new Error(
        "Invalid cart quantity.",
      ),
      "VALIDATION_ERROR",
    );
  }

  const {
    data: existingItem,
    error: existingError,
  } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existingError) {
    logAppError("Failed to inspect existing cart item.", existingError);
    throw createAppError(existingError, "VALIDATION_ERROR");
  }

  const nextQuantity = Number(existingItem?.quantity ?? 0) + quantity;

  const {
    data,
    error,
  } = existingItem
    ? await supabase
        .from("cart_items")
        .update({ quantity: nextQuantity })
        .eq("id", existingItem.id)
        .select()
        .single()
    : await supabase
        .from("cart_items")
        .insert({
          cart_id: cartId,
          product_id: productId,
          quantity,
        })
        .select()
        .single();

  if (error) {
    logAppError(
      "Failed to add product to cart.",
      error,
    );

    throw createAppError(
      error,
      "VALIDATION_ERROR",
    );
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("iyanjuworld:cart-updated"));
  }

  return data;
}

export async function updateCartItem(
  cartItemId: string,
  quantity: number,
) {
  if (
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    throw createAppError(
      new Error(
        "Invalid cart quantity.",
      ),
      "VALIDATION_ERROR",
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("cart_items")
    .update({
      quantity,
    })
    .eq("id", cartItemId)
    .select()
    .single();

  if (error) {
    logAppError(
      "Failed to update cart item.",
      error,
    );

    throw createAppError(
      error,
      "VALIDATION_ERROR",
    );
  }

  return data;
}

export async function removeFromCart(
  cartItemId: string,
) {
  const {
    error,
  } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId);

  if (error) {
    logAppError(
      "Failed to remove cart item.",
      error,
    );

    throw createAppError(
      error,
      "SERVER_ERROR",
    );
  }
}

export async function getCustomerWallet(
  userId: string,
) {
  const {
    data,
    error,
  } = await supabase
    .from("customer_wallets")
    .select(
      [
        "id",
        "customer_id",
        "available_balance",
        "pending_balance",
        "currency",
        "active",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .eq(
      "customer_id",
      userId,
    )
    .maybeSingle();

  if (error) {
    logAppError(
      "Failed to load customer wallet.",
      error,
    );

    throw createAppError(
      error,
      "WALLET_ERROR",
    );
  }

  return data;
}

export async function getWalletTransactions(
  userId: string,
  limit = 50,
) {
  const {
    data,
    error,
  } = await supabase
    .from("wallet_transactions")
    .select(
      [
        "id",
        "customer_id",
        "transaction_type",
        "status",
        "reference",
        "amount",
        "balance_before",
        "balance_after",
        "currency",
        "order_id",
        "payment_transaction_id",
        "parent_transaction_id",
        "metadata",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .eq(
      "customer_id",
      userId,
    )
    .order("created_at", {
      ascending: false,
    })
    .limit(limit);

  if (error) {
    logAppError(
      "Failed to load wallet transactions.",
      error,
    );

    throw createAppError(
      error,
      "WALLET_ERROR",
    );
  }

  return data ?? [];
}

export async function getCustomerOrders(
  userId: string,
  limit = 50,
) {
  const {
    data,
    error,
  } = await supabase
    .from("orders")
    .select(
      `
        id,
        order_reference,
        customer_id,
        business_id,
        status,
        payment_status,
        currency,
        subtotal,
        delivery_fee,
        platform_fee_rate,
        platform_fee,
        customer_total,
        business_net_amount,
        refunded_amount,
        delivery_address,
        delivery_city,
        delivery_state,
        delivery_country,
        delivery_postal_code,
        customer_note,
        created_at,
        updated_at,
        delivered_at,
        completed_at,
        businesses (
          id,
          name,
          slug,
          logo
        )
      `,
    )
    .eq(
      "customer_id",
      userId,
    )
    .order("created_at", {
      ascending: false,
    })
    .limit(limit);

  if (error) {
    logAppError(
      "Failed to load customer orders.",
      error,
    );

    throw createAppError(
      error,
      "SERVER_ERROR",
    );
  }

  return data ?? [];
}

export async function getOrder(
  orderId: string,
) {
  const {
    data,
    error,
  } = await supabase
    .from("orders")
    .select(
      `
        id,
        order_reference,
        customer_id,
        business_id,
        status,
        payment_status,
        currency,
        subtotal,
        delivery_fee,
        platform_fee_rate,
        platform_fee,
        customer_total,
        business_net_amount,
        refunded_amount,
        delivery_address,
        delivery_city,
        delivery_state,
        delivery_country,
        delivery_postal_code,
        customer_note,
        created_at,
        updated_at,
        delivered_at,
        completed_at,
        businesses (
          id,
          name,
          slug,
          logo,
          phone,
          whatsapp,
          email
        ),
        order_items (
          id,
          product_id,
          product_name,
          sku,
          image_url,
          quantity,
          unit_price,
          line_total,
          metadata
        )
      `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    logAppError(
      "Failed to load order.",
      error,
    );

    throw createAppError(
      error,
      "SERVER_ERROR",
    );
  }

  return data;
}

export async function validateCartForCheckout(
  cartId: string,
) {
  const {
    data,
    error,
  } = await supabase.rpc(
    "validate_cart_for_checkout",
    {
      p_cart_id: cartId,
    },
  );

  if (error) {
    logAppError(
      "Cart checkout validation failed.",
      error,
    );

    throw createAppError(
      error,
      "VALIDATION_ERROR",
    );
  }

  return data;
}

export async function checkoutCart(
  cartId: string,
  deliveryAddress: {
    address: string;
    city: string;
    state: string;
    country?: string;
    postalCode?: string;
    latitude?: number | null;
    longitude?: number | null;
  },
  customerNote?: string,
) {
  const {
    data,
    error,
  } = await supabase.rpc(
    "checkout_cart",
    {
      p_cart_id: cartId,
      p_delivery_address: {
        address:
          deliveryAddress.address,
        city:
          deliveryAddress.city,
        state:
          deliveryAddress.state,
        country:
          deliveryAddress.country ??
          "Nigeria",
        postal_code:
          deliveryAddress.postalCode ??
          null,
        latitude:
          deliveryAddress.latitude ??
          null,
        longitude:
          deliveryAddress.longitude ??
          null,
      },
      p_customer_note:
        customerNote?.trim() ||
        null,
    },
  );

  if (error) {
    logAppError(
      "Cart checkout failed.",
      error,
    );

    throw createAppError(
      error,
      "SERVER_ERROR",
    );
  }

  return data;
}

export async function applyDeliveryPricing(
  orderId: string,
) {
  const {
    data,
    error,
  } = await supabase.rpc(
    "apply_delivery_pricing",
    {
      p_order_id: orderId,
    },
  );

  if (error) {
    logAppError(
      "Delivery pricing failed.",
      error,
    );

    throw createAppError(
      error,
      "VALIDATION_ERROR",
    );
  }

  return data;
}

export async function previewDeliveryFee(
  orderId: string,
) {
  const {
    data,
    error,
  } = await supabase.rpc(
    "preview_delivery_fee",
    {
      p_order_id: orderId,
    },
  );

  if (error) {
    logAppError(
      "Delivery fee preview failed.",
      error,
    );

    throw createAppError(
      error,
      "VALIDATION_ERROR",
    );
  }

  return data;
}
