BEGIN;

-- ============================================================
-- IYANJUWORLD
-- MIGRATION 0016
-- ATOMIC WALLET REFUND PROCESSING
-- ============================================================
--
-- PURPOSE
-- ------------------------------------------------------------
-- Performs an approved marketplace refund entirely inside one
-- PostgreSQL transaction.
--
-- IMPORTANT:
-- - Refund destination is wallet only.
-- - Flutterwave refund API is never called.
-- - Customer wallet is credited atomically.
-- - A WALLET-REFUND-XXXXXXXX transaction is created.
-- - Ledger entries are created in the same transaction.
-- - The refund record is completed in the same transaction.
-- - Payment/order refund totals are synchronized by the
--   existing complete_refund() function.
-- - Repeated calls are idempotent.
--
-- The Edge Function will only call this RPC.
-- It will never perform individual financial mutations.
-- ============================================================


-- ============================================================
-- 1. WALLET REFUND REFERENCE GENERATOR
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_wallet_refund_reference()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reference text;
BEGIN
  LOOP
    v_reference :=
      'WALLET-REFUND-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.wallet_transactions
      WHERE reference = v_reference
    );
  END LOOP;

  RETURN v_reference;
END;
$$;


REVOKE ALL ON FUNCTION public.generate_wallet_refund_reference()
FROM PUBLIC;


COMMENT ON FUNCTION public.generate_wallet_refund_reference()
IS
'Generates unique IyanjuWorld wallet refund references.';


-- ============================================================
-- 2. ATOMIC WALLET REFUND PROCESSOR
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_wallet_refund(
  p_refund_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_refund public.refunds%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_payment public.payment_transactions%ROWTYPE;
  v_wallet public.customer_wallets%ROWTYPE;

  v_wallet_transaction_id uuid;
  v_wallet_reference text;

  v_wallet_balance_before numeric;
  v_wallet_balance_after numeric;

  v_amount numeric;

  v_wallet_account_id uuid;
  v_refund_expense_account_id uuid;

  v_existing_wallet_transaction public.wallet_transactions%ROWTYPE;

  v_result jsonb;
BEGIN

  -- ==========================================================
  -- BASIC VALIDATION
  -- ==========================================================

  IF p_refund_id IS NULL THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_ID_REQUIRED';
  END IF;


  -- ==========================================================
  -- LOCK REFUND
  -- ==========================================================
  --
  -- The refund row is locked before anything financial happens.
  -- This prevents two simultaneous workers/admin requests from
  -- processing the same refund.
  -- ==========================================================

  SELECT *
  INTO v_refund
  FROM public.refunds
  WHERE id = p_refund_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_NOT_FOUND';
  END IF;


  -- ==========================================================
  -- WALLET-ONLY ENFORCEMENT
  -- ==========================================================

  IF v_refund.destination::text <> 'wallet' THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_WALLET_ONLY';
  END IF;


  -- ==========================================================
  -- IDEMPOTENCY
  -- ==========================================================
  --
  -- If the refund already has a wallet transaction attached,
  -- return the existing successful result rather than crediting
  -- the wallet again.
  -- ==========================================================

  IF v_refund.wallet_transaction_id IS NOT NULL THEN

    SELECT *
    INTO v_existing_wallet_transaction
    FROM public.wallet_transactions
    WHERE id = v_refund.wallet_transaction_id
    FOR UPDATE;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'already_processed', true,
        'refund_id', v_refund.id,
        'refund_reference', v_refund.refund_reference,
        'wallet_transaction_id', v_existing_wallet_transaction.id,
        'wallet_reference', v_existing_wallet_transaction.reference,
        'amount', v_existing_wallet_transaction.amount,
        'status', v_refund.status
      );
    END IF;

  END IF;


  -- ==========================================================
  -- REFUND STATUS VALIDATION
  -- ==========================================================

  IF v_refund.status = 'completed' THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_ALREADY_COMPLETED';
  END IF;


  IF v_refund.status NOT IN ('approved', 'processing') THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_NOT_READY';
  END IF;


  -- ==========================================================
  -- AMOUNT VALIDATION
  -- ==========================================================

  v_amount := COALESCE(v_refund.amount, 0);

  IF v_amount <= 0 THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_INVALID_AMOUNT';
  END IF;


  IF v_refund.currency <> 'NGN' THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_CURRENCY_UNSUPPORTED';
  END IF;


  -- ==========================================================
  -- LOCK ORDER
  -- ==========================================================

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = v_refund.order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_ORDER_NOT_FOUND';
  END IF;


  -- ==========================================================
  -- LOCK PAYMENT
  -- ==========================================================

  SELECT *
  INTO v_payment
  FROM public.payment_transactions
  WHERE id = v_refund.payment_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_PAYMENT_NOT_FOUND';
  END IF;


  -- ==========================================================
  -- OWNERSHIP / RELATIONSHIP VALIDATION
  -- ==========================================================

  IF v_refund.order_id <> v_payment.order_id THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_PAYMENT_ORDER_MISMATCH';
  END IF;


  IF v_refund.customer_id <> v_order.customer_id THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_CUSTOMER_ORDER_MISMATCH';
  END IF;


  IF v_refund.customer_id <> v_payment.customer_id THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_CUSTOMER_PAYMENT_MISMATCH';
  END IF;


  IF v_payment.status NOT IN ('successful', 'partially_refunded') THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_PAYMENT_NOT_REFUNDABLE';
  END IF;


  -- ==========================================================
  -- REMAINING REFUND VALIDATION
  -- ==========================================================

  IF v_amount > COALESCE(v_refund.remaining_refundable_amount, 0) THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_AMOUNT_EXCEEDS_REMAINING';
  END IF;


  -- ==========================================================
  -- LOCK CUSTOMER WALLET
  -- ==========================================================

  SELECT *
  INTO v_wallet
  FROM public.customer_wallets
  WHERE customer_id = v_refund.customer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'CUSTOMER_WALLET_NOT_FOUND';
  END IF;


  IF v_wallet.currency <> 'NGN' THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'WALLET_CURRENCY_UNSUPPORTED';
  END IF;


  IF NOT COALESCE(v_wallet.active, false) THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'CUSTOMER_WALLET_INACTIVE';
  END IF;


  -- ==========================================================
  -- WALLET BALANCE SNAPSHOT
  -- ==========================================================

  v_wallet_balance_before :=
    COALESCE(v_wallet.available_balance, 0);

  v_wallet_balance_after :=
    v_wallet_balance_before + v_amount;


  -- ==========================================================
  -- WALLET REFERENCE
  -- ==========================================================

  v_wallet_reference :=
    public.generate_wallet_refund_reference();


  -- ==========================================================
  -- MARK REFUND AS PROCESSING
  -- ==========================================================

  UPDATE public.refunds
  SET
    status = 'processing',
    processed_at = COALESCE(processed_at, now()),
    updated_at = now()
  WHERE id = v_refund.id;


  -- ==========================================================
  -- CREATE WALLET TRANSACTION
  -- ==========================================================

  INSERT INTO public.wallet_transactions (
    customer_id,
    transaction_type,
    amount,
    status,
    reference,
    description,
    currency,
    balance_before,
    balance_after,
    order_id,
    payment_transaction_id,
    parent_transaction_id,
    metadata,
    created_at,
    completed_at
  )
  VALUES (
    v_refund.customer_id,
    'refund',
    v_amount,
    'completed',
    v_wallet_reference,
    'Marketplace refund credited to IyanjuWorld wallet',
    'NGN',
    v_wallet_balance_before,
    v_wallet_balance_after,
    v_refund.order_id,
    v_refund.payment_transaction_id,
    NULL,
    jsonb_build_object(
      'refund_id', v_refund.id,
      'refund_reference', v_refund.refund_reference,
      'destination', 'wallet',
      'source', 'marketplace_refund',
      'provider_refund', false
    ),
    now(),
    now()
  )
  RETURNING id
  INTO v_wallet_transaction_id;


  -- ==========================================================
  -- UPDATE WALLET BALANCE
  -- ==========================================================

  UPDATE public.customer_wallets
  SET
    available_balance = v_wallet_balance_after,
    updated_at = now()
  WHERE id = v_wallet.id;


  -- ==========================================================
  -- FIND WALLET LEDGER ACCOUNT
  -- ==========================================================

  SELECT id
  INTO v_wallet_account_id
  FROM public.ledger_accounts
  WHERE user_id = v_refund.customer_id
    AND wallet_id = v_wallet.id
    AND currency = 'NGN'
  ORDER BY created_at ASC
  LIMIT 1;


  -- Fallback to the platform customer-wallet account when
  -- a dedicated wallet ledger account does not exist.
  IF v_wallet_account_id IS NULL THEN
    SELECT id
    INTO v_wallet_account_id
    FROM public.ledger_accounts
    WHERE code = '1010'
      AND currency = 'NGN'
    LIMIT 1;
  END IF;


  IF v_wallet_account_id IS NULL THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_WALLET_LEDGER_ACCOUNT_NOT_FOUND';
  END IF;


  -- ==========================================================
  -- FIND REFUND EXPENSE ACCOUNT
  -- ==========================================================

  SELECT id
  INTO v_refund_expense_account_id
  FROM public.ledger_accounts
  WHERE code = '5000'
    AND currency = 'NGN'
  LIMIT 1;


  IF v_refund_expense_account_id IS NULL THEN
    RAISE EXCEPTION
      USING
        ERRCODE = 'P0001',
        MESSAGE = 'REFUND_EXPENSE_LEDGER_ACCOUNT_NOT_FOUND';
  END IF;


  -- ==========================================================
  -- CREATE LEDGER ENTRIES
  -- ==========================================================
  --
  -- Customer wallet funds increase:
  --     DEBIT customer wallet funds
  --
  -- Refund expense increases:
  --     CREDIT refund expense
  --
  -- Both entries share the wallet transaction ID.
  -- ==========================================================

  INSERT INTO public.ledger_entries (
    transaction_id,
    ledger_account_id,
    user_id,
    direction,
    entry_type,
    amount,
    currency
  )
  VALUES (
    v_wallet_transaction_id,
    v_wallet_account_id,
    v_refund.customer_id,
    'DEBIT',
    'REFUND',
    v_amount,
    'NGN'
  );


  INSERT INTO public.ledger_entries (
    transaction_id,
    ledger_account_id,
    user_id,
    direction,
    entry_type,
    amount,
    currency
  )
  VALUES (
    v_wallet_transaction_id,
    v_refund_expense_account_id,
    v_refund.customer_id,
    'CREDIT',
    'REFUND',
    v_amount,
    'NGN'
  );


  -- ==========================================================
  -- ATTACH WALLET TRANSACTION TO REFUND
  -- ==========================================================

  UPDATE public.refunds
  SET
    wallet_transaction_id = v_wallet_transaction_id,
    status = 'processing',
    processed_at = COALESCE(processed_at, now()),
    updated_at = now()
  WHERE id = v_refund.id;


  -- ==========================================================
  -- COMPLETE EXISTING REFUND LIFECYCLE
  -- ==========================================================
  --
  -- Existing migration 0014 owns the payment/order refund
  -- totals. We reuse that lifecycle instead of duplicating
  -- its accounting logic here.
  -- ==========================================================

  PERFORM public.complete_refund(
    v_refund.id,
    v_wallet_transaction_id,
    NULL,
    NULL,
    NULL,
    NULL
  );


  -- ==========================================================
  -- RETURN SUCCESS
  -- ==========================================================

  v_result :=
    jsonb_build_object(
      'success', true,
      'already_processed', false,
      'refund_id', v_refund.id,
      'refund_reference', v_refund.refund_reference,
      'wallet_transaction_id', v_wallet_transaction_id,
      'wallet_reference', v_wallet_reference,
      'amount', v_amount,
      'currency', 'NGN',
      'wallet_balance_before', v_wallet_balance_before,
      'wallet_balance_after', v_wallet_balance_after,
      'status', 'completed'
    );

  RETURN v_result;


EXCEPTION
  WHEN unique_violation THEN

    -- --------------------------------------------------------
    -- Safe idempotency recovery.
    -- --------------------------------------------------------

    SELECT *
    INTO v_existing_wallet_transaction
    FROM public.wallet_transactions
    WHERE reference = v_wallet_reference
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'already_processed', true,
        'refund_id', v_refund.id,
        'refund_reference', v_refund.refund_reference,
        'wallet_transaction_id', v_existing_wallet_transaction.id,
        'wallet_reference', v_existing_wallet_transaction.reference,
        'amount', v_existing_wallet_transaction.amount,
        'status', 'completed'
      );
    END IF;

    RAISE;

END;
$$;


-- ============================================================
-- 3. SECURITY
-- ============================================================

REVOKE ALL ON FUNCTION public.process_wallet_refund(uuid)
FROM PUBLIC;

REVOKE ALL ON FUNCTION public.process_wallet_refund(uuid)
FROM anon;

REVOKE ALL ON FUNCTION public.process_wallet_refund(uuid)
FROM authenticated;


COMMENT ON FUNCTION public.process_wallet_refund(uuid)
IS
'Atomically processes an approved IyanjuWorld marketplace refund into the customer wallet. Never calls Flutterwave. Idempotent and protected against duplicate wallet credits.';


-- ============================================================
-- 4. GRANT ONLY TO SERVICE ROLE
-- ============================================================
--
-- The public frontend must never be allowed to execute this
-- financial RPC directly.
--
-- The Edge Function will execute it with the Supabase service
-- role after authenticating and authorizing the administrator.
-- ============================================================

GRANT EXECUTE ON FUNCTION public.process_wallet_refund(uuid)
TO service_role;


-- ============================================================
-- 5. VALIDATION
-- ============================================================

DO $$
DECLARE
  v_invalid integer;
BEGIN

  SELECT COUNT(*)
  INTO v_invalid
  FROM public.refunds
  WHERE destination::text <> 'wallet';

  IF v_invalid > 0 THEN
    RAISE EXCEPTION
      'WALLET_ONLY_REFUND_VALIDATION_FAILED';
  END IF;

END;
$$;


COMMIT;
