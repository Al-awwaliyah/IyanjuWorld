import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  ShoppingBag,
  XCircle,
} from "lucide-react";

import { Button } from "../../components/ui/button";
import { getAuthState } from "../../libs/auth";
import {
  getSafeErrorMessage,
  logAppError,
} from "../../libs/errors";
import { supabase } from "../../libs/supabase";
import { formatNaira } from "../../libs/format";

type PaymentState =
  | "verifying"
  | "success"
  | "pending"
  | "failed"
  | "invalid";

interface PaymentVerificationResponse {
  success?: boolean;
  status?: string;
  order_id?: string;
  order_reference?: string;
  amount?: number;
  message?: string;
}

function getStatusFromResponse(
  response: PaymentVerificationResponse
): PaymentState {
  const status = String(response.status ?? "").toLowerCase();

  if (
    response.success === true ||
    ["successful", "success", "completed", "paid"].includes(status)
  ) {
    return "success";
  }

  if (
    ["pending", "processing", "queued", "awaiting_confirmation"].includes(
      status
    )
  ) {
    return "pending";
  }

  return "failed";
}

export default function PaymentResult() {
  const [searchParams] = useSearchParams();

  const [state, setState] = useState<PaymentState>("verifying");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orderReference, setOrderReference] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [retrying, setRetrying] = useState(false);

  const transactionId = useMemo(
    () =>
      searchParams.get("transaction_id") ||
      searchParams.get("transactionId") ||
      "",
    [searchParams]
  );

  const transactionReference = useMemo(
    () =>
      searchParams.get("tx_ref") ||
      searchParams.get("txRef") ||
      searchParams.get("transaction_reference") ||
      "",
    [searchParams]
  );

  const checkoutStatus = useMemo(
    () => searchParams.get("status") || "",
    [searchParams]
  );

  const orderIdFromUrl = useMemo(
    () => searchParams.get("order_id") || "",
    [searchParams]
  );

  const verifyPayment = async () => {
    try {
      setState("verifying");
      setMessage("");

      const authState = await getAuthState();

      if (!authState.user) {
        setState("invalid");
        setMessage(
          "Your session has expired. Please sign in to continue."
        );
        return;
      }

      if (!transactionId && !transactionReference && !orderIdFromUrl) {
        setState("invalid");
        setMessage(
          "We could not identify this payment attempt. Please return to your orders and check the order status."
        );
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "verify-order-payment",
        {
          body: {
            transaction_id: transactionId || null,
            transaction_reference: transactionReference || null,
            order_id: orderIdFromUrl || null,
            checkout_status: checkoutStatus || null,
          },
        }
      );

      if (error) {
        logAppError(error, {
          action: "customer.payment_result.verify",
          metadata: {
            hasTransactionId: Boolean(transactionId),
            hasTransactionReference: Boolean(transactionReference),
            hasOrderId: Boolean(orderIdFromUrl),
          },
        });

        setState("pending");
        setMessage(
          "We could not confirm the payment immediately. Your payment may still be processing. Please check your order shortly."
        );
        return;
      }

      const verification =
        (data ?? {}) as PaymentVerificationResponse;

      if (verification.order_id) {
        setOrderId(verification.order_id);
      }

      if (verification.order_reference) {
        setOrderReference(verification.order_reference);
      }

      if (
        typeof verification.amount === "number" &&
        Number.isFinite(verification.amount)
      ) {
        setAmount(verification.amount);
      }

      const resultState = getStatusFromResponse(verification);

      setState(resultState);

      if (verification.message) {
        setMessage(verification.message);
        return;
      }

      if (resultState === "success") {
        setMessage(
          "Your payment has been confirmed and your order is being processed."
        );
      } else if (resultState === "pending") {
        setMessage(
          "Your payment is still being confirmed. You do not need to pay again."
        );
      } else {
        setMessage(
          "The payment could not be confirmed. Please check your order before trying again."
        );
      }
    } catch (error) {
      logAppError(error, {
        action: "customer.payment_result.verify.unexpected",
      });

      setState("pending");
      setMessage(
        "We could not confirm the payment right now. Please check your order shortly."
      );
    }
  };

  useEffect(() => {
    void verifyPayment();
  }, []);

  const handleRetry = async () => {
    setRetrying(true);

    try {
      await verifyPayment();
    } finally {
      setRetrying(false);
    }
  };

  const title =
    state === "verifying"
      ? "Confirming your payment"
      : state === "success"
        ? "Payment successful"
        : state === "pending"
          ? "Payment is being confirmed"
          : state === "failed"
            ? "Payment not confirmed"
            : "Payment information unavailable";

  const Icon =
    state === "verifying"
      ? Loader2
      : state === "success"
        ? CheckCircle2
        : state === "pending"
          ? Clock3
          : state === "failed"
            ? XCircle
            : AlertCircle;

  const iconClass =
    state === "success"
      ? "text-emerald-600"
      : state === "pending" || state === "verifying"
        ? "text-amber-600"
        : "text-red-600";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Icon
                className={`h-9 w-9 ${iconClass} ${
                  state === "verifying" ? "animate-spin" : ""
                }`}
              />
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              {title}
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
              {message ||
                "Please wait while we securely verify your payment."}
            </p>

            {state === "success" &&
              (orderReference || amount !== null) && (
                <div className="mt-6 w-full rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-left">
                  {orderReference && (
                    <div className="flex items-center justify-between gap-4 border-b border-emerald-100 pb-3">
                      <span className="text-sm text-slate-600">
                        Order
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {orderReference}
                      </span>
                    </div>
                  )}

                  {amount !== null && (
                    <div
                      className={`flex items-center justify-between gap-4 ${
                        orderReference ? "pt-3" : ""
                      }`}
                    >
                      <span className="text-sm text-slate-600">
                        Amount
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {formatNaira(amount)}
                      </span>
                    </div>
                  )}
                </div>
              )}

            {state === "pending" && (
              <div className="mt-6 w-full rounded-xl border border-amber-100 bg-amber-50 p-4 text-left">
                <p className="text-sm leading-6 text-amber-900">
                  Payment confirmation can sometimes take a little
                  longer. Please do not make another payment for the
                  same order while this one is being confirmed.
                </p>
              </div>
            )}

            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              {orderId && (
                <Button asChild className="w-full sm:w-auto">
                  <Link to={`/customer/orders/${orderId}`}>
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    View order
                  </Link>
                </Button>
              )}

              {state === "pending" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="w-full sm:w-auto"
                >
                  {retrying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Check again
                </Button>
              )}

              {(state === "failed" || state === "invalid") && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="w-full sm:w-auto"
                >
                  {retrying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Try again
                </Button>
              )}

              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Link to="/customer/orders">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  My orders
                </Link>
              </Button>
            </div>

            <div className="mt-6">
              <Link
                to="/customer/dashboard"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                Return to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
