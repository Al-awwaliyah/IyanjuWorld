import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * ============================================================
 * IYANJUWORLD — WALLET REFUND EDGE FUNCTION
 * ============================================================
 *
 * PURPOSE
 * ------------------------------------------------------------
 * Secure administrative entry point for marketplace refunds.
 *
 * IMPORTANT:
 * - Marketplace refunds are WALLET ONLY.
 * - This function NEVER calls Flutterwave.
 * - This function NEVER directly modifies wallet balances.
 * - All financial mutations happen atomically inside:
 *
 *     public.process_wallet_refund(uuid)
 *
 * - The PostgreSQL function handles:
 *     • refund validation
 *     • wallet locking
 *     • idempotency
 *     • wallet credit
 *     • wallet transaction
 *     • ledger entries
 *     • refund completion
 *     • order/payment refund totals
 *
 * SECURITY
 * ------------------------------------------------------------
 * - Caller must be authenticated.
 * - Caller must have an admin profile.
 * - Service-role credentials are used only server-side.
 * - Raw database errors are never returned to the frontend.
 * ============================================================
 */

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ?? "";

const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";


/* ============================================================
 * CORS
 * ============================================================ */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
  "Content-Type":
    "application/json",
};


/* ============================================================
 * SAFE JSON RESPONSE
 * ============================================================ */

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: corsHeaders,
    },
  );
}


/* ============================================================
 * SAFE FRONTEND ERROR MAPPING
 * ============================================================ */

function safeErrorMessage(
  error: unknown,
): string {
  const raw =
    error instanceof Error
      ? error.message
      : String(error ?? "");

  const message =
    raw.toUpperCase();


  if (
    message.includes(
      "REFUND_ID_REQUIRED",
    )
  ) {
    return "Refund ID is required.";
  }


  if (
    message.includes(
      "REFUND_NOT_FOUND",
    )
  ) {
    return "The requested refund could not be found.";
  }


  if (
    message.includes(
      "REFUND_WALLET_ONLY",
    )
  ) {
    return "Marketplace refunds can only be credited to the IyanjuWorld wallet.";
  }


  if (
    message.includes(
      "REFUND_ALREADY_COMPLETED",
    )
  ) {
    return "This refund has already been completed.";
  }


  if (
    message.includes(
      "REFUND_NOT_READY",
    )
  ) {
    return "This refund is not ready for processing.";
  }


  if (
    message.includes(
      "REFUND_INVALID_AMOUNT",
    )
  ) {
    return "The refund amount is invalid.";
  }


  if (
    message.includes(
      "REFUND_CURRENCY_UNSUPPORTED",
    )
  ) {
    return "This refund uses an unsupported currency.";
  }


  if (
    message.includes(
      "REFUND_ORDER_NOT_FOUND",
    )
  ) {
    return "The order associated with this refund could not be found.";
  }


  if (
    message.includes(
      "REFUND_PAYMENT_NOT_FOUND",
    )
  ) {
    return "The payment associated with this refund could not be found.";
  }


  if (
    message.includes(
      "REFUND_PAYMENT_ORDER_MISMATCH",
    )
  ) {
    return "The refund payment information could not be verified.";
  }


  if (
    message.includes(
      "REFUND_CUSTOMER_ORDER_MISMATCH",
    )
  ) {
    return "The refund customer information could not be verified.";
  }


  if (
    message.includes(
      "REFUND_CUSTOMER_PAYMENT_MISMATCH",
    )
  ) {
    return "The refund payment ownership could not be verified.";
  }


  if (
    message.includes(
      "REFUND_PAYMENT_NOT_REFUNDABLE",
    )
  ) {
    return "This payment is not currently eligible for a refund.";
  }


  if (
    message.includes(
      "REFUND_AMOUNT_EXCEEDS_REMAINING",
    )
  ) {
    return "The refund amount exceeds the remaining refundable amount.";
  }


  if (
    message.includes(
      "CUSTOMER_WALLET_NOT_FOUND",
    )
  ) {
    return "The customer's wallet could not be found.";
  }


  if (
    message.includes(
      "CUSTOMER_WALLET_INACTIVE",
    )
  ) {
    return "The customer's wallet is currently inactive.";
  }


  if (
    message.includes(
      "WALLET_CURRENCY_UNSUPPORTED",
    )
  ) {
    return "The customer's wallet uses an unsupported currency.";
  }


  if (
    message.includes(
      "REFUND_WALLET_LEDGER_ACCOUNT_NOT_FOUND",
    )
  ) {
    return "The wallet accounting configuration is unavailable. Please contact support.";
  }


  if (
    message.includes(
      "REFUND_EXPENSE_LEDGER_ACCOUNT_NOT_FOUND",
    )
  ) {
    return "The refund accounting configuration is unavailable. Please contact support.";
  }


  if (
    message.includes(
      "JWT",
    ) ||
    message.includes(
      "AUTHENTICATION",
    ) ||
    message.includes(
      "TOKEN",
    )
  ) {
    return "Your session could not be verified. Please sign in again.";
  }


  return "The refund could not be processed. Please try again.";
}


/* ============================================================
 * REQUEST BODY
 * ============================================================ */

type RefundRequest = {
  refund_id?: unknown;
};


/* ============================================================
 * MAIN HANDLER
 * ============================================================ */

Deno.serve(
  async (request) => {

    /* --------------------------------------------------------
     * OPTIONS
     * -------------------------------------------------------- */

    if (request.method === "OPTIONS") {
      return new Response(
        null,
        {
          status: 204,
          headers: corsHeaders,
        },
      );
    }


    /* --------------------------------------------------------
     * METHOD
     * -------------------------------------------------------- */

    if (request.method !== "POST") {
      return jsonResponse(
        {
          success: false,
          error:
            "This endpoint only accepts POST requests.",
        },
        405,
      );
    }


    /* --------------------------------------------------------
     * ENVIRONMENT VALIDATION
     * -------------------------------------------------------- */

    if (
      !SUPABASE_URL ||
      !SUPABASE_ANON_KEY ||
      !SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.error(
        "Refund wallet configuration is incomplete.",
      );

      return jsonResponse(
        {
          success: false,
          error:
            "Refund service is temporarily unavailable.",
        },
        503,
      );
    }


    try {

      /* ======================================================
       * 1. AUTHENTICATION CLIENT
       * ====================================================== */

      const authorization =
        request.headers.get(
          "Authorization",
        );

      if (
        !authorization ||
        !authorization
          .toLowerCase()
          .startsWith("bearer ")
      ) {
        return jsonResponse(
          {
            success: false,
            error:
              "Authentication is required.",
          },
          401,
        );
      }


      const userClient =
        createClient(
          SUPABASE_URL,
          SUPABASE_ANON_KEY,
          {
            global: {
              headers: {
                Authorization:
                  authorization,
              },
            },
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          },
        );


      /* ======================================================
       * 2. VERIFY USER
       * ====================================================== */

      const {
        data: userData,
        error: userError,
      } =
        await userClient.auth.getUser();


      if (
        userError ||
        !userData?.user
      ) {
        console.error(
          "Refund wallet authentication failed:",
          userError,
        );

        return jsonResponse(
          {
            success: false,
            error:
              "Your session could not be verified. Please sign in again.",
          },
          401,
        );
      }


      const user =
        userData.user;


      /* ======================================================
       * 3. VERIFY ADMIN ROLE
       * ====================================================== */

      const {
        data: profile,
        error: profileError,
      } =
        await userClient
          .from("profiles")
          .select(
            "id, role, admin_role, active",
          )
          .eq(
            "id",
            user.id,
          )
          .maybeSingle();


      if (profileError) {
        console.error(
          "Refund wallet profile lookup failed:",
          profileError,
        );

        return jsonResponse(
          {
            success: false,
            error:
              "Your account permissions could not be verified.",
          },
          403,
        );
      }


      if (
        !profile ||
        profile.role !== "admin" ||
        profile.active !== true
      ) {
        console.error(
          "Unauthorized refund wallet attempt:",
          {
            user_id: user.id,
            role: profile?.role ?? null,
            admin_role:
              profile?.admin_role ?? null,
            active:
              profile?.active ?? null,
          },
        );

        return jsonResponse(
          {
            success: false,
            error:
              "You do not have permission to process refunds.",
          },
          403,
        );
      }


      /* ======================================================
       * 4. ADMIN CLIENT
       * ====================================================== */

      const adminClient =
        createClient(
          SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          },
        );


      /* ======================================================
       * 5. PARSE REQUEST
       * ====================================================== */

      let body:
        | RefundRequest
        | null = null;

      try {
        body =
          await request.json();
      } catch {
        return jsonResponse(
          {
            success: false,
            error:
              "Invalid request.",
          },
          400,
        );
      }


      const refundId =
        typeof body?.refund_id === "string"
          ? body.refund_id.trim()
          : "";


      /* ======================================================
       * 6. VALIDATE REFUND ID
       * ====================================================== */

      if (!refundId) {
        return jsonResponse(
          {
            success: false,
            error:
              "Refund ID is required.",
          },
          400,
        );
      }


      /*
       * UUID validation prevents malformed values from reaching
       * the database function.
       */

      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;


      if (
        !uuidPattern.test(
          refundId,
        )
      ) {
        return jsonResponse(
          {
            success: false,
            error:
              "Invalid refund ID.",
          },
          400,
        );
      }


      /* ======================================================
       * 7. PROCESS ATOMIC REFUND
       * ====================================================== */

      console.log(
        "Processing IyanjuWorld wallet refund:",
        {
          refund_id: refundId,
          admin_user_id: user.id,
          admin_role:
            profile.admin_role,
        },
      );


      const {
        data: result,
        error: refundError,
      } =
        await adminClient.rpc(
          "process_wallet_refund",
          {
            p_refund_id:
              refundId,
          },
        );


      /* ======================================================
       * 8. DATABASE ERROR
       * ====================================================== */

      if (refundError) {

        console.error(
          "Wallet refund RPC failed:",
          {
            refund_id: refundId,
            admin_user_id: user.id,
            error: refundError,
          },
        );


        return jsonResponse(
          {
            success: false,
            error:
              safeErrorMessage(
                refundError,
              ),
          },
          400,
        );
      }


      /* ======================================================
       * 9. VALIDATE RPC RESULT
       * ====================================================== */

      if (
        !result ||
        result.success !== true
      ) {

        console.error(
          "Wallet refund returned an unexpected result:",
          {
            refund_id: refundId,
            result,
          },
        );


        return jsonResponse(
          {
            success: false,
            error:
              "The refund could not be completed. Please try again.",
          },
          500,
        );
      }


      /* ======================================================
       * 10. SUCCESS
       * ====================================================== */

      console.log(
        "IyanjuWorld wallet refund completed:",
        {
          refund_id:
            result.refund_id,
          refund_reference:
            result.refund_reference,
          wallet_transaction_id:
            result.wallet_transaction_id,
          wallet_reference:
            result.wallet_reference,
          amount:
            result.amount,
          already_processed:
            result.already_processed,
        },
      );


      return jsonResponse(
        {
          success: true,

          message:
            result.already_processed
              ? "This refund has already been credited to the customer's wallet."
              : "Refund credited to the customer's IyanjuWorld wallet.",

          refund: {
            id:
              result.refund_id,
            reference:
              result.refund_reference,
            amount:
              result.amount,
            currency:
              result.currency ?? "NGN",
            status:
              result.status ?? "completed",
          },

          wallet_transaction: {
            id:
              result.wallet_transaction_id,
            reference:
              result.wallet_reference,
          },

          already_processed:
            result.already_processed === true,
        },
        200,
      );

    } catch (error) {

      /* ======================================================
       * INTERNAL ERROR
       * ====================================================== */

      console.error(
        "Wallet refund Edge Function internal error:",
        error,
      );


      return jsonResponse(
        {
          success: false,
          error:
            "The refund could not be processed right now. Please try again.",
        },
        500,
      );
    }
  },
);
