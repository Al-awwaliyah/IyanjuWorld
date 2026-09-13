import { useEffect, useState } from "react";
import {
  ArrowUpFromLine,
  ShieldCheck,
} from "lucide-react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { formatNaira } from "../../libs/format";

export interface WithdrawalAccount {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
}

export interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    amount: number,
    account: WithdrawalAccount,
  ) => Promise<void> | void;
  loading?: boolean;
  availableBalance: number;
  minimumAmount?: number;
  maximumAmount?: number;
  banks?: Array<{
    value: string;
    label: string;
  }>;
  defaultAccount?: WithdrawalAccount | null;
}

export default function WithdrawModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  availableBalance,
  minimumAmount = 100,
  maximumAmount = 1000000,
  banks = [],
  defaultAccount = null,
}: WithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [accountName, setAccountName] =
    useState("");
  const [accountNumber, setAccountNumber] =
    useState("");
  const [bankCode, setBankCode] =
    useState("");
  const [bankName, setBankName] =
    useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setAmount("");
      setAccountName("");
      setAccountNumber("");
      setBankCode("");
      setBankName("");
      setError("");
      return;
    }

    if (defaultAccount) {
      setAccountName(
        defaultAccount.accountName,
      );
      setAccountNumber(
        defaultAccount.accountNumber,
      );
      setBankCode(defaultAccount.bankCode);
      setBankName(defaultAccount.bankName);
    }
  }, [open, defaultAccount]);

  const numericAmount = Number(
    amount.replace(/,/g, ""),
  );

  const handleAmountChange = (
    value: string,
  ) => {
    const cleaned = value
      .replace(/[^\d]/g, "")
      .replace(/^0+(?=\d)/, "");

    setAmount(cleaned);

    if (error) {
      setError("");
    }
  };

  const validate = () => {
    if (!amount.trim()) {
      setError(
        "Enter the amount you want to withdraw.",
      );
      return false;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError("Enter a valid withdrawal amount.");
      return false;
    }

    if (!Number.isInteger(numericAmount)) {
      setError(
        "Enter a whole naira amount.",
      );
      return false;
    }

    if (numericAmount < minimumAmount) {
      setError(
        `Minimum withdrawal is ${formatNaira(
          minimumAmount,
        )}.`,
      );
      return false;
    }

    if (numericAmount > maximumAmount) {
      setError(
        `Maximum withdrawal is ${formatNaira(
          maximumAmount,
        )}.`,
      );
      return false;
    }

    if (numericAmount > availableBalance) {
      setError(
        "The withdrawal amount exceeds your available wallet balance.",
      );
      return false;
    }

    if (!accountName.trim()) {
      setError("Enter the account name.");
      return false;
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      setError(
        "Enter a valid 10-digit bank account number.",
      );
      return false;
    }

    if (!bankCode) {
      setError("Select your bank.");
      return false;
    }

    setError("");
    return true;
  };

  const handleBankChange = (
    value: string,
  ) => {
    const selectedBank = banks.find(
      (bank) => bank.value === value,
    );

    setBankCode(value);
    setBankName(selectedBank?.label ?? "");

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit(numericAmount, {
        accountName: accountName.trim(),
        accountNumber,
        bankCode,
        bankName,
      });
    } catch {
      setError(
        "We couldn't process your withdrawal request. Please try again.",
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onClose}
      title="Withdraw money"
      description="Send available wallet funds to your bank account."
      size="md"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-500">
              Available balance
            </span>

            <span className="text-base font-bold text-slate-900">
              {formatNaira(
                availableBalance,
              )}
            </span>
          </div>
        </div>

        <Input
          label="Withdrawal amount"
          type="text"
          inputMode="numeric"
          placeholder="Enter amount"
          value={amount}
          onChange={(event) =>
            handleAmountChange(
              event.target.value,
            )
          }
          error={error}
          disabled={loading}
          leftIcon={
            <span className="text-sm font-semibold">
              ₦
            </span>
          }
          autoFocus
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Bank"
            value={bankCode}
            onChange={(event) =>
              handleBankChange(
                event.target.value,
              )
            }
            options={banks}
            placeholder="Select bank"
            disabled={loading}
          />

          <Input
            label="Account number"
            type="text"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit account number"
            value={accountNumber}
            onChange={(event) =>
              setAccountNumber(
                event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 10),
              )
            }
            disabled={loading}
          />
        </div>

        <Input
          label="Account name"
          type="text"
          placeholder="Enter account name"
          value={accountName}
          onChange={(event) =>
            setAccountName(
              event.target.value,
            )
          }
          disabled={loading}
        />

        {bankName &&
          accountName &&
          accountNumber && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Withdrawal destination
              </p>

              <div className="mt-2">
                <p className="text-sm font-semibold text-slate-900">
                  {accountName}
                </p>

                <p className="mt-0.5 text-sm text-slate-500">
                  {bankName} · {accountNumber}
                </p>
              </div>
            </div>
          )}

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
              aria-hidden="true"
            />

            <p className="text-xs leading-5 text-amber-800">
              Make sure your bank details are correct
              before submitting. Withdrawals are
              processed securely and may take some
              time to complete.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <span className="text-slate-500">
            Withdrawal amount
          </span>

          <span className="font-bold text-slate-900">
            {numericAmount > 0
              ? formatNaira(numericAmount)
              : "₦0"}
          </span>
        </div>

        {error && (
          <p
            className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            <ArrowUpFromLine
              className="h-4 w-4"
              aria-hidden="true"
            />
            Withdraw money
          </Button>
        </div>
      </form>
    </Modal>
  );
}
