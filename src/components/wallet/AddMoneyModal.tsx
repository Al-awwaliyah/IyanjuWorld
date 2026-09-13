import { useEffect, useState } from "react";
import { ArrowDownToLine, ShieldCheck } from "lucide-react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { formatNaira } from "../../libs/format";

export interface AddMoneyModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<void> | void;
  loading?: boolean;
  minimumAmount?: number;
  maximumAmount?: number;
}

export default function AddMoneyModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  minimumAmount = 100,
  maximumAmount = 1000000,
}: AddMoneyModalProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setAmount("");
      setError("");
    }
  }, [open]);

  const numericAmount = Number(
    amount.replace(/,/g, ""),
  );

  const validate = () => {
    if (!amount.trim()) {
      setError("Enter the amount you want to add.");
      return false;
    }

    if (!Number.isFinite(numericAmount)) {
      setError("Enter a valid amount.");
      return false;
    }

    if (numericAmount < minimumAmount) {
      setError(
        `Minimum wallet funding is ${formatNaira(
          minimumAmount,
        )}.`,
      );
      return false;
    }

    if (numericAmount > maximumAmount) {
      setError(
        `Maximum wallet funding is ${formatNaira(
          maximumAmount,
        )}.`,
      );
      return false;
    }

    if (!Number.isInteger(numericAmount)) {
      setError("Enter a whole naira amount.");
      return false;
    }

    setError("");
    return true;
  };

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

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit(numericAmount);
    } catch {
      setError(
        "We couldn't start the wallet funding process. Please try again.",
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onClose}
      title="Add money"
      description="Fund your IyanjuWorld wallet securely."
      size="sm"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <Input
          label="Amount"
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

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
              <ShieldCheck
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Secure wallet funding
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                You will be redirected to the secure
                payment checkout to complete your
                wallet deposit.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <span className="text-slate-500">
            Amount to add
          </span>

          <span className="font-bold text-slate-900">
            {numericAmount > 0
              ? formatNaira(numericAmount)
              : "₦0"}
          </span>
        </div>

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
            disabled={
              loading ||
              !amount.trim()
            }
          >
            <ArrowDownToLine
              className="h-4 w-4"
              aria-hidden="true"
            />
            Continue to payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
