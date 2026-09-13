import { useState } from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";
import Button from "../ui/Button";

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  landmark?: string;
}

export interface DeliveryAddressFormProps {
  value?: Partial<DeliveryAddress>;
  onChange?: (address: DeliveryAddress) => void;
  onSubmit?: (address: DeliveryAddress) => void;
  loading?: boolean;
  disabled?: boolean;
  submitLabel?: string;
  showSubmit?: boolean;
  className?: string;
}

const stateOptions = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "Federal Capital Territory",
].map((state) => ({
  value: state,
  label: state,
}));

export default function DeliveryAddressForm({
  value,
  onChange,
  onSubmit,
  loading = false,
  disabled = false,
  submitLabel = "Continue",
  showSubmit = true,
  className = "",
}: DeliveryAddressFormProps) {
  const [form, setForm] = useState<DeliveryAddress>({
    fullName: value?.fullName ?? "",
    phone: value?.phone ?? "",
    addressLine1: value?.addressLine1 ?? "",
    addressLine2: value?.addressLine2 ?? "",
    city: value?.city ?? "",
    state: value?.state ?? "",
    landmark: value?.landmark ?? "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof DeliveryAddress, string>>
  >({});

  const updateField = (
    field: keyof DeliveryAddress,
    fieldValue: string,
  ) => {
    const next = {
      ...form,
      [field]: fieldValue,
    };

    setForm(next);

    if (errors[field]) {
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }

    onChange?.(next);
  };

  const validate = () => {
    const nextErrors: Partial<
      Record<keyof DeliveryAddress, string>
    > = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName =
        "Enter the recipient's full name.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone =
        "Enter a phone number for delivery.";
    }

    if (!form.addressLine1.trim()) {
      nextErrors.addressLine1 =
        "Enter the delivery address.";
    }

    if (!form.city.trim()) {
      nextErrors.city = "Enter the delivery city.";
    }

    if (!form.state.trim()) {
      nextErrors.state =
        "Select the delivery state.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    onSubmit?.(form);
  };

  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">
          Delivery Address
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Enter where your order should be delivered.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          value={form.fullName}
          onChange={(event) =>
            updateField(
              "fullName",
              event.target.value,
            )
          }
          placeholder="Recipient's full name"
          autoComplete="name"
          error={errors.fullName}
          disabled={disabled || loading}
        />

        <Input
          label="Phone number"
          value={form.phone}
          onChange={(event) =>
            updateField(
              "phone",
              event.target.value,
            )
          }
          placeholder="08012345678"
          type="tel"
          autoComplete="tel"
          error={errors.phone}
          disabled={disabled || loading}
        />

        <div className="sm:col-span-2">
          <Input
            label="Address"
            value={form.addressLine1}
            onChange={(event) =>
              updateField(
                "addressLine1",
                event.target.value,
              )
            }
            placeholder="House number, street name"
            autoComplete="street-address"
            error={errors.addressLine1}
            disabled={disabled || loading}
          />
        </div>

        <div className="sm:col-span-2">
          <Input
            label="Address line 2"
            value={form.addressLine2}
            onChange={(event) =>
              updateField(
                "addressLine2",
                event.target.value,
              )
            }
            placeholder="Apartment, suite, unit, etc. (optional)"
            disabled={disabled || loading}
          />
        </div>

        <Input
          label="City"
          value={form.city}
          onChange={(event) =>
            updateField(
              "city",
              event.target.value,
            )
          }
          placeholder="e.g. Osogbo"
          autoComplete="address-level2"
          error={errors.city}
          disabled={disabled || loading}
        />

        <Select
          label="State"
          value={form.state}
          onChange={(event) =>
            updateField(
              "state",
              event.target.value,
            )
          }
          options={stateOptions}
          placeholder="Select state"
          error={errors.state}
          disabled={disabled || loading}
        />

        <div className="sm:col-span-2">
          <Textarea
            label="Landmark"
            value={form.landmark}
            onChange={(event) =>
              updateField(
                "landmark",
                event.target.value,
              )
            }
            placeholder="Nearby landmark or additional delivery directions (optional)"
            rows={3}
            disabled={disabled || loading}
          />
        </div>
      </div>

      {showSubmit && onSubmit && (
        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={disabled || loading}
            onClick={handleSubmit}
          >
            {submitLabel}
          </Button>
        </div>
      )}
    </section>
  );
}
