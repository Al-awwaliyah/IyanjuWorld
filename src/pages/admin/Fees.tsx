import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  Percent,
  ShieldCheck,
} from "lucide-react";

import PageContainer from "../../components/layout/PageContainer";
import AdminTable, {
  type AdminTableColumn,
  type AdminTableRowAction,
} from "../../components/admin/AdminTable";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";

type PlatformFeeSetting = {
  id: string;
  name: string;
  description: string;
  rate: number;
  appliesTo: "business";
  active: boolean;
  updatedAt: string;
  updatedBy: string;
};

const initialSettings: PlatformFeeSetting[] = [
  {
    id: "platform-commission",
    name: "Marketplace Platform Commission",
    description:
      "Commission charged to the business owner on the applicable product/order subtotal.",
    rate: 5,
    appliesTo: "business",
    active: true,
    updatedAt: "2026-09-12T10:00:00.000Z",
    updatedBy: "Super Admin",
  },
];

function formatRate(rate: number) {
  return `${rate.toFixed(2).replace(/\.00$/, "")}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function calculateExample(rate: number) {
  const subtotal = 20000;
  const deliveryFee = 2000;
  const platformFee = subtotal * (rate / 100);
  const businessNet = subtotal - platformFee;
  const customerTotal = subtotal + deliveryFee;

  return {
    subtotal,
    deliveryFee,
    platformFee,
    businessNet,
    customerTotal,
  };
}

export default function Fees() {
  const [settings, setSettings] =
    useState<PlatformFeeSetting[]>(initialSettings);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [editingSetting, setEditingSetting] =
    useState<PlatformFeeSetting | null>(null);

  const [rateInput, setRateInput] = useState("");

  const currentSetting = settings.find(
    (setting) =>
      setting.id === "platform-commission",
  );

  const currentRate = currentSetting?.rate ?? 5;

  const example = useMemo(
    () => calculateExample(currentRate),
    [currentRate],
  );

  const openEditModal = () => {
    if (!currentSetting) {
      return;
    }

    setEditingSetting(currentSetting);
    setRateInput(String(currentSetting.rate));
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingSetting(null);
    setRateInput("");
  };

  const saveFeeRate = () => {
    if (!editingSetting) {
      return;
    }

    const nextRate = Number(rateInput);

    if (
      !Number.isFinite(nextRate) ||
      nextRate < 0 ||
      nextRate > 100
    ) {
      return;
    }

    const now = new Date().toISOString();

    setSettings((current) =>
      current.map((setting) =>
        setting.id === editingSetting.id
          ? {
              ...setting,
              rate: nextRate,
              updatedAt: now,
              updatedBy: "Current Admin",
            }
          : setting,
      ),
    );

    closeEditModal();
  };

  const columns: AdminTableColumn<PlatformFeeSetting>[] =
    [
      {
        id: "setting",
        header: "Fee setting",
        accessor: "name",
        sortable: true,
        render: (_, setting) => (
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Percent className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="font-medium text-slate-900">
                {setting.name}
              </div>

              <div className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                {setting.description}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "rate",
        header: "Current rate",
        accessor: "rate",
        sortable: true,
        render: (value) => (
          <span className="text-lg font-semibold text-slate-900">
            {formatRate(value)}
          </span>
        ),
      },
      {
        id: "appliesTo",
        header: "Charged to",
        accessor: "appliesTo",
        sortable: true,
        render: () => (
          <Badge variant="info">
            Business owner
          </Badge>
        ),
      },
      {
        id: "customer",
        header: "Customer fee",
        accessor: "rate",
        render: () => (
          <Badge variant="success">
            No platform fee
          </Badge>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessor: "active",
        sortable: true,
        render: (value) => (
          <Badge
            variant={value ? "success" : "default"}
          >
            {value ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "updated",
        header: "Last updated",
        accessor: "updatedAt",
        sortable: true,
        render: (value, setting) => (
          <div>
            <div className="whitespace-nowrap text-sm text-slate-700">
              {formatDate(value)}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              by {setting.updatedBy}
            </div>
          </div>
        ),
      },
    ];

  const getRowActions = (
    setting: PlatformFeeSetting,
  ): AdminTableRowAction[] => [
    {
      id: "edit",
      label: "Edit platform fee",
      icon: Edit3,
      onClick: openEditModal,
    },
  ];

  return (
    <PageContainer
      title="Fees"
      description="Manage the marketplace commission and financial fee configuration."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Fee Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Platform fee settings are controlled by authorized
              administrators and stored in the database.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={openEditModal}
            disabled={!currentSetting}
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Edit platform fee
          </Button>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

            <div>
              <p className="font-medium text-amber-900">
                Admin-controlled financial setting
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                The commission rate is intended to come from
                the protected platform settings record. The
                frontend should never become the authoritative
                source for financial calculations.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Percent className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Current platform fee
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {formatRate(currentRate)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              Charged to
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-900">
              Business owner
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Applied to the applicable product/order subtotal.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              Customer platform fee
            </p>

            <p className="mt-1 text-lg font-semibold text-emerald-700">
              ₦0
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Customers pay only the product subtotal plus delivery.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              Platform fee configuration
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              These settings correspond to the platform fee
              configuration stored by the database.
            </p>
          </div>

          <AdminTable
            columns={columns}
            data={settings}
            rowKey={(setting) => setting.id}
            getRowActions={getRowActions}
            emptyTitle="No fee settings found"
            emptyDescription="No platform fee configuration is currently available."
            stickyHeader
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />

            <div className="flex-1">
              <h2 className="font-semibold text-slate-900">
                Current calculation example
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                This illustrates the locked marketplace fee
                model using the current configured rate.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Product subtotal
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                ₦
                {example.subtotal.toLocaleString(
                  "en-NG",
                )}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Delivery fee
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                ₦
                {example.deliveryFee.toLocaleString(
                  "en-NG",
                )}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Customer pays
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                ₦
                {example.customerTotal.toLocaleString(
                  "en-NG",
                )}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Platform fee
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                ₦
                {example.platformFee.toLocaleString(
                  "en-NG",
                )}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Business earnings
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                ₦
                {example.businessNet.toLocaleString(
                  "en-NG",
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-sm text-slate-600">
              The delivery fee is not included when calculating
              the platform commission.
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={showEditModal}
        onClose={closeEditModal}
        title="Edit platform fee"
      >
        <div className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">
              Marketplace Platform Commission
            </p>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              This percentage is charged to the business owner
              and is excluded from the customer's payment total.
            </p>
          </div>

          <Input
            label="Platform commission rate (%)"
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={rateInput}
            onChange={(event) =>
              setRateInput(event.target.value)
            }
            placeholder="5"
          />

          <div className="rounded-lg bg-brand-50 px-4 py-3">
            <p className="text-sm text-brand-900">
              Current rate:{" "}
              <strong>
                {formatRate(
                  editingSetting?.rate ?? currentRate,
                )}
              </strong>
            </p>

            <p className="mt-1 text-xs leading-5 text-brand-800">
              Changing this value changes the configured
              marketplace commission. The authoritative financial
              calculation must still be performed server-side
              using the database setting.
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              onClick={closeEditModal}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              disabled={
                !rateInput.trim() ||
                !Number.isFinite(Number(rateInput)) ||
                Number(rateInput) < 0 ||
                Number(rateInput) > 100
              }
              onClick={saveFeeRate}
            >
              Save fee rate
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
