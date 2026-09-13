-- ============================================================
-- IYANJUWORLD
-- MIGRATION 0015
-- WALLET-ONLY REFUNDS
-- ============================================================
--
-- REFUND POLICY:
--
-- Every approved marketplace refund is credited to the
-- customer's IyanjuWorld wallet.
--
-- Flutterwave refunds are NOT supported by IyanjuWorld's
-- marketplace refund system.
--
-- MONEY FLOW:
--
-- Customer order payment
--        ↓
-- Refund approved
--        ↓
-- IyanjuWorld wallet
--        ↓
-- Customer available wallet balance
--
-- IMPORTANT:
--
-- There is exactly ONE refund destination:
--
--     wallet
--
-- No refund may be directed to Flutterwave.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. VERIFY THAT NO EXISTING REFUND USES FLUTTERWAVE
-- ============================================================
--
-- We deliberately refuse to silently convert an existing
-- Flutterwave refund into a wallet refund.
--
-- If such a record exists, the migration stops so that the
-- existing financial record can be reviewed safely.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.refunds
    WHERE destination::text = 'flutterwave'
  ) THEN
    RAISE EXCEPTION
      'WALLET_ONLY_REFUND_MIGRATION_BLOCKED: Existing Flutterwave refund records must be resolved before enabling wallet-only refunds.';
  END IF;
END
$$;


-- ============================================================
-- 2. RESTRICT REFUND DESTINATION TO WALLET
-- ============================================================
--
-- Keep the existing enum for compatibility with existing
-- functions and historical schema, but make the actual
-- refunds table accept ONLY wallet.
--
-- This means:
--
--     wallet       -> allowed
--     flutterwave  -> rejected
--
-- Even direct SQL cannot create a Flutterwave refund record.
-- ============================================================

ALTER TABLE public.refunds
DROP CONSTRAINT IF EXISTS refunds_wallet_only_destination_check;

ALTER TABLE public.refunds
ADD CONSTRAINT refunds_wallet_only_destination_check
CHECK (
  destination::text = 'wallet'
);


-- ============================================================
-- 3. ADD A DEFENSIVE TRIGGER
-- ============================================================
--
-- The CHECK constraint is the primary database protection.
--
-- This trigger provides an additional explicit safety layer
-- and makes the business rule obvious in the database.
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_wallet_only_refund()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.destination::text <> 'wallet' THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_WALLET_ONLY';
  END IF;

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS trg_enforce_wallet_only_refund
ON public.refunds;

CREATE TRIGGER trg_enforce_wallet_only_refund
BEFORE INSERT OR UPDATE OF destination
ON public.refunds
FOR EACH ROW
EXECUTE FUNCTION public.enforce_wallet_only_refund();


-- ============================================================
-- 4. DOCUMENT THE REFUND POLICY
-- ============================================================

COMMENT ON TABLE public.refunds IS
'IyanjuWorld marketplace refunds. All refunds are credited exclusively to the customer IyanjuWorld wallet. Flutterwave refunds are not supported.';

COMMENT ON COLUMN public.refunds.destination IS
'Refund destination. IyanjuWorld marketplace refunds are wallet-only. The only permitted value is wallet.';


-- ============================================================
-- 5. SAFETY FUNCTION FOR REFUND DESTINATION
-- ============================================================
--
-- Backend functions should use this function before starting
-- any refund processing.
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_refund_destination(
  p_destination public.refund_destination
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_destination::text <> 'wallet' THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_WALLET_ONLY';
  END IF;

  RETURN true;
END;
$$;


-- ============================================================
-- 6. ENSURE ALL NEW REFUND REQUESTS ARE WALLET REFUNDS
-- ============================================================
--
-- This wrapper is intentionally strict.
--
-- If the existing create_refund_request function receives
-- anything other than wallet, the request is rejected.
--
-- The existing function remains the authoritative creator
-- of refund records.
-- ============================================================

COMMENT ON FUNCTION public.validate_refund_destination(
  public.refund_destination
) IS
'Validates that a marketplace refund uses the IyanjuWorld wallet. Flutterwave refunds are prohibited.';


-- ============================================================
-- 7. PROTECT EXISTING COMPLETION FLOW
-- ============================================================
--
-- A refund may only complete through the wallet destination.
-- This trigger guarantees that a refund cannot later be
-- changed from wallet to another destination.
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_refund_destination()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.destination::text <> 'wallet' THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_WALLET_ONLY';
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.destination::text <> 'wallet' THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_WALLET_ONLY';
  END IF;

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS trg_protect_refund_destination
ON public.refunds;

CREATE TRIGGER trg_protect_refund_destination
BEFORE UPDATE OF destination
ON public.refunds
FOR EACH ROW
EXECUTE FUNCTION public.protect_refund_destination();


-- ============================================================
-- 8. SECURITY COMMENTS
-- ============================================================

COMMENT ON FUNCTION public.enforce_wallet_only_refund()
IS
'Prevents marketplace refunds from being directed to Flutterwave.';

COMMENT ON FUNCTION public.protect_refund_destination()
IS
'Prevents refund destination from being changed away from the IyanjuWorld wallet.';


-- ============================================================
-- 9. FINAL VALIDATION
-- ============================================================

DO $$
DECLARE
  v_invalid_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_invalid_count
  FROM public.refunds
  WHERE destination::text <> 'wallet';

  IF v_invalid_count > 0 THEN
    RAISE EXCEPTION
      'WALLET_ONLY_REFUND_VALIDATION_FAILED: Invalid refund destinations remain.';
  END IF;
END
$$;


COMMIT;
