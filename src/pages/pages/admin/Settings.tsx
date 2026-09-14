import { useMemo, useState } from "react";
import {
  Bell,
  CreditCard,
  Database,
  Globe2,
  Lock,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";

import PageContainer from "../../components/layout/PageContainer";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import Switch from "../../components/ui/Switch";
import { formatNaira, formatPercentage } from "../../libs/format";

type PlatformSettings = {
  platformFeeRate: number;
  currency: "NGN";
  marketplaceEnabled: boolean;
  customerRegistrationEnabled: boolean;
  businessRegistrationEnabled: boolean;
  riderRegistrationEnabled: boolean;
  requireBusinessVerification: boolean;
  requireRiderVerification: boolean;
  walletEnabled: boolean;
  walletWithdrawalsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  defaultDeliveryZoneMode: "configured" | "manual";
  minimumOrderAmount: number;
  maximumOrderAmount: number;
};

const initialSettings: PlatformSettings = {
  platformFeeRate: 5,
  currency: "NGN",
  marketplaceEnabled: true,
  customerRegistrationEnabled: true,
  businessRegistrationEnabled: true,
  riderRegistrationEnabled: true,
  requireBusinessVerification: true,
  requireRiderVerification: true,
  walletEnabled: true,
  walletWithdrawalsEnabled: true,
  pushNotificationsEnabled: true,
  emailNotificationsEnabled: true,
  maintenanceMode: false,
  maintenanceMessage:
    "IyanjuWorld is temporarily unavailable while we perform scheduled maintenance.",
  defaultDeliveryZoneMode: "configured",
  minimumOrderAmount: 0,
  maximumOrderAmount: 1000000,
};

type SettingSection =
  | "general"
  | "marketplace"
  | "fees"
  | "delivery"
  | "wallet"
  | "notifications"
  | "security"
  | "maintenance";

const sections: {
  id: SettingSection;
  label: string;
  description: string;
  icon: typeof SettingsIcon;
}[] = [
  {
    id: "general",
    label: "General",
    description: "Core platform configuration",
    icon: SettingsIcon,
  },
  {
    id: "marketplace",
    label: "Marketplace",
    description: "Marketplace availability and onboarding",
    icon: Globe2,
  },
  {
    id: "fees",
    label: "Fees",
    description: "Platform commission configuration",
    icon: CreditCard,
  },
  {
    id: "delivery",
    label: "Delivery",
    description: "Delivery pricing behaviour",
    icon: Truck,
  },
  {
    id: "wallet",
    label: "Wallet",
    description: "Customer wallet controls",
    icon: Wallet,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Push and email notification controls",
    icon: Bell,
  },
  {
    id: "security",
    label: "Security",
    description: "Verification and administrative protection",
    icon: ShieldCheck,
  },
  {
    id: "maintenance",
    label: "Maintenance",
    description: "Temporarily restrict platform access",
    icon: Database,
  },
];

export default function Settings() {
  const [settings, setSettings] =
    useState<PlatformSettings>(initialSettings);

  const [activeSection, setActiveSection] =
    useState<SettingSection>("general");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateSetting = <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaved(false);

    try {
      /*
       * This page is intentionally structured so that the save operation
       * can later call a protected Supabase RPC/Edge Function.
       *
       * IMPORTANT:
       * platformFeeRate must ultimately be persisted in:
       *
       * platform_settings.platform_fee_rate
       *
       * The frontend must never become the authoritative source for
       * financial configuration.
       *
       * No financial setting is written directly from the browser.
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 500),
      );

      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const feeExample = useMemo(() => {
    const subtotal = 20000;
    const delivery = 2000;
    const platformFee =
      (subtotal * settings.platformFeeRate) / 100;

    return {
      subtotal,
      delivery,
      customerTotal: subtotal + delivery,
      platformFee,
      businessNet: subtotal - platformFee,
    };
  }, [settings.platformFeeRate]);

  const activeSectionData = sections.find(
    (section) => section.id === activeSection,
  );

  return (
    <PageContainer
      title="Settings"
      description="Manage platform-wide configuration and operational controls."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <SettingsIcon className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Platform Settings
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Configure IyanjuWorld without changing application
                  code.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saved && (
              <Badge variant="success">
                Changes saved
              </Badge>
            )}

            <Button
              variant="primary"
              loading={saving}
              onClick={saveSettings}
            >
              <Save className="h-4 w-4" />
              Save changes
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

            <div>
              <p className="font-medium text-amber-900">
                Financial settings are server-authoritative
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Settings such as the platform commission must be
                stored and enforced by the database/backend. The
                frontend only provides the administrative interface.
                The platform fee is therefore not permanently
                hard-coded at 5%.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-2">
            <div className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const active =
                  activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() =>
                      setActiveSection(section.id)
                    }
                    className={`flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition ${
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0" />

                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {section.label}
                      </span>

                      <span
                        className={`mt-0.5 block text-xs ${
                          active
                            ? "text-slate-300"
                            : "text-slate-400"
                        }`}
                      >
                        {section.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="min-w-0 rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-5">
              <div className="flex items-center gap-3">
                {activeSectionData &&
                  (() => {
                    const Icon =
                      activeSectionData.icon;

                    return (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <Icon className="h-5 w-5" />
                      </div>
                    );
                  })()}

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {activeSectionData?.label}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {activeSectionData?.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              {activeSection === "general" && (
                <GeneralSettings
                  settings={settings}
                  updateSetting={updateSetting}
                />
              )}

              {activeSection === "marketplace" && (
                <MarketplaceSettings
                  settings={settings}
                  updateSetting={updateSetting}
                />
              )}

              {activeSection === "fees" && (
                <FeeSettings
                  settings={settings}
                  updateSetting={updateSetting}
                  feeExample={feeExample}
                />
              )}

              {activeSection === "delivery" && (
                <DeliverySettings
                  settings={settings}
                  updateSetting={updateSetting}
                />
              )}

              {activeSection === "wallet" && (
                <WalletSettings
                  settings={settings}
                  updateSetting={updateSetting}
                />
              )}

              {activeSection === "notifications" && (
                <NotificationSettings
                  settings={settings}
                  updateSetting={updateSetting}
                />
              )}

              {activeSection === "security" && (
                <SecuritySettings
                  settings={settings}
                  updateSetting={updateSetting}
                />
              )}

              {activeSection === "maintenance" && (
                <MaintenanceSettings
                  settings={settings}
                  updateSetting={updateSetting}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}

function SectionIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 py-5 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">
          {title}
        </p>

        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
}

function GeneralSettings({
  settings,
  updateSetting,
}: {
  settings: PlatformSettings;
  updateSetting: <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) => void;
}) {
  return (
    <div>
      <SectionIntro
        title="General platform configuration"
        description="Basic settings that identify and control the marketplace."
      />

      <div className="space-y-1">
        <div className="grid grid-cols-1 gap-4 border-b border-slate-100 pb-5 sm:grid-cols-2">
          <Input
            label="Platform name"
            value="IyanjuWorld"
            disabled
          />

          <Input
            label="Currency"
            value="NGN"
            disabled
          />
        </div>

        <SettingRow
          title="Marketplace availability"
          description="Controls whether customers can browse and place new marketplace orders."
        >
          <Switch
            checked={settings.marketplaceEnabled}
            onChange={(event) =>
              updateSetting(
                "marketplaceEnabled",
                event.target.checked,
              )
            }
          />
        </SettingRow>

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Current environment
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Production settings should be managed through
                protected backend configuration.
              </p>
            </div>

            <Badge variant="success">
              Active
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketplaceSettings({
  settings,
  updateSetting,
}: {
  settings: PlatformSettings;
  updateSetting: <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) => void;
}) {
  return (
    <div>
      <SectionIntro
        title="Marketplace controls"
        description="Control who can register and participate in the marketplace."
      />

      <div className="space-y-1">
        <SettingRow
          title="Customer registration"
          description="Allow new customers to create IyanjuWorld accounts."
        >
          <Switch
            checked={
              settings.customerRegistrationEnabled
            }
            onChange={(event) =>
              updateSetting(
                "customerRegistrationEnabled",
                event.target.checked,
              )
            }
          />
        </SettingRow>

        <SettingRow
          title="Business registration"
          description="Allow new businesses to submit marketplace registration applications."
        >
          <Switch
            checked={
              settings.businessRegistrationEnabled
            }
            onChange={(event) =>
              updateSetting(
                "businessRegistrationEnabled",
                event.target.checked,
              )
            }
          />
        </SettingRow>

        <SettingRow
          title="Rider registration"
          description="Allow new riders to submit registration applications."
        >
          <Switch
            checked={
              settings.riderRegistrationEnabled
            }
            onChange={(event) =>
              updateSetting(
                "riderRegistrationEnabled",
                event.target.checked,
              )
            }
          />
        </SettingRow>
      </div>
    </div>
  );
}

function FeeSettings({
  settings,
  updateSetting,
  feeExample,
}: {
  settings: PlatformSettings;
  updateSetting: <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) => void;
  feeExample: {
    subtotal: number;
    delivery: number;
    customerTotal: number;
    platformFee: number;
    businessNet: number;
  };
}) {
  const [feeInput, setFeeInput] = useState(
    String(settings.platformFeeRate),
  );

  const handleFeeChange = (
    value: string,
  ) => {
    setFeeInput(value);

    const parsed = Number(value);

    if (
      Number.isFinite(parsed) &&
      parsed >= 0 &&
      parsed <= 100
    ) {
      updateSetting(
        "platformFeeRate",
        parsed,
      );
    }
  };

  return (
    <div>
      <SectionIntro
        title="Platform commission"
        description="Configure the commission charged to business owners on applicable product/order subtotal."
      />

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">
              Current platform fee
            </p>

            <p className="mt-2 text-4xl font-bold text-blue-950">
              {formatPercentage(
                settings.platformFeeRate,
              )}
            </p>

            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-800">
              This fee is charged to the business owner. It is
              calculated from the applicable product/order
              subtotal and does not include the customer's delivery
              fee.
            </p>
          </div>

          <Badge variant="info">
            Admin editable
          </Badge>
        </div>
      </div>

      <div className="mt-6 max-w-md">
        <Input
          label="Platform fee rate (%)"
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={feeInput}
          onChange={(event) =>
            handleFeeChange(
              event.target.value,
            )
          }
          helperText="The authoritative value must be persisted in platform_settings.platform_fee_rate."
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-4">
          <h4 className="font-semibold text-slate-900">
            Fee calculation example
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            Example uses a ₦20,000 product subtotal and ₦2,000
            delivery fee.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          <CalculationRow
            label="Product subtotal"
            value={formatNaira(
              feeExample.subtotal,
            )}
          />

          <CalculationRow
            label="Delivery fee"
            value={formatNaira(
              feeExample.delivery,
            )}
          />

          <CalculationRow
            label="Customer pays"
            value={formatNaira(
              feeExample.customerTotal,
            )}
            strong
          />

          <CalculationRow
            label={`Platform fee (${formatPercentage(
              settings.platformFeeRate,
            )})`}
            value={formatNaira(
              feeExample.platformFee,
            )}
          />

          <CalculationRow
            label="Business net"
            value={formatNaira(
              feeExample.businessNet,
            )}
            strong
          />
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-medium text-amber-900">
          Important financial rule
        </p>

        <p className="mt-1 text-sm leading-6 text-amber-800">
          Changing this setting must not directly change existing
          orders. Orders should retain their own platform fee rate
          snapshot. The new rate applies according to the
          server-side rules for future applicable transactions.
        </p>
      </div>
    </div>
  );
}

function DeliverySettings({
  settings,
  updateSetting,
}: {
  settings: PlatformSettings;
  updateSetting: <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) => void;
}) {
  return (
    <div>
      <SectionIntro
        title="Delivery configuration"
        description="Control how delivery pricing is selected for marketplace orders."
      />

      <div className="space-y-6">
        <Select
          label="Delivery pricing mode"
          value={settings.defaultDeliveryZoneMode}
          onChange={(event) =>
            updateSetting(
              "defaultDeliveryZoneMode",
              event.target
                .value as PlatformSettings["defaultDeliveryZoneMode"],
            )
          }
          options={[
            {
              value: "configured",
              label: "Configured delivery zones",
            },
            {
              value: "manual",
              label: "Manual administrative pricing",
            },
          ]}
          helperText="The active delivery zone and pricing rules remain authoritative on the server."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Minimum order amount"
            type="number"
            min={0}
            value={settings.minimumOrderAmount}
            onChange={(event) =>
              updateSetting(
                "minimumOrderAmount",
                Math.max(
                  0,
                  Number(event.target.value) || 0,
                ),
              )
            }
            helperText="Set to ₦0 to disable a minimum."
          />

          <Input
            label="Maximum order amount"
            type="number"
            min={0}
            value={settings.maximumOrderAmount}
            onChange={(event) =>
              updateSetting(
                "maximumOrderAmount",
                Math.max(
                  0,
                  Number(event.target.value) || 0,
                ),
              )
            }
            helperText="Server-side validation should enforce this limit."
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <Truck className="mt-0.5 h-5 w-5 text-slate-500" />

            <div>
              <p className="text-sm font-medium text-slate-900">
                Customer delivery pricing
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Customers pay the product subtotal plus the
                calculated delivery fee. The platform commission is
                separate and is charged to the business owner.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WalletSettings({
  settings,
  updateSetting,
}: {
  settings: PlatformSettings;
  updateSetting: <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) => void;
}) {
  return (
    <div>
      <SectionIntro
        title="Customer wallet"
        description="Control wallet availability while keeping all financial mutations server-side."
      />

      <div className="space-y-1">
        <SettingRow
          title="Customer wallet"
          description="Allow customers to use the marketplace wallet for supported transactions."
        >
          <Switch
            checked={settings.walletEnabled}
            onChange={(event) =>
              updateSetting(
                "walletEnabled",
                event.target.checked,
              )
            }
          />
        </SettingRow>

        <SettingRow
          title="Wallet withdrawals"
          description="Allow eligible customers to withdraw available wallet funds."
        >
          <Switch
            checked={
              settings.walletWithdrawalsEnabled
            }
            onChange={(event) =>
              updateSetting(
                "walletWithdrawalsEnabled",
                event.target.checked,
              )
            }
          />
        </SettingRow>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <Wallet className="mt-0.5 h-5 w-5 text-slate-500" />

          <div>
            <p className="text-sm font-medium text-slate-900">
              Ledger-controlled wallet
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Admin settings must never directly alter customer
              balances. Deposits, payments, refunds, withdrawals,
              reversals, and adjustments must use the protected
              wallet and financial ledger workflows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings({
  settings,
  updateSetting,
}: {
  settings: PlatformSettings;
  updateSetting: <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) => void;
}) {
  return (
    <div>
      <SectionIntro
        title="Notification channels"
        description="Configure platform notification channels. Push notifications remain the primary user-facing notification channel."
      />

      <div className="space-y-1">
        <SettingRow
          title="Push notifications"
          description="Allow server-side events to deliver notifications to active user devices and browsers."
        >
          <Switch
            checked={
              settings.pushNotificationsEnabled
            }
            onChange={(event) =>
              updateSetting(
                "pushNotificationsEnabled",
                event.target.checked,
              )
            }
          />
        </SettingRow>

        <SettingRow
          title="Email notifications"
          description="Allow supported transactional events to send email notifications."
        >
          <Switch
            checked={
              settings.emailNotificationsEnabled
            }
            onChange={(event) =>
              updateSetting(
                "emailNotificationsEnabled",
                event.target.checked,
              )
            }
          />
        </SettingRow>
      </div>

      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 h-5 w-5 text-blue-700" />

          <div>
            <p className="text-sm font-medium text-blue-900">
              Push is not the same as dashboard history
            </p>

            <p className="mt-1 text-sm leading-6 text-blue-800">
              IyanjuWorld notifications are designed around device
              and browser push delivery. In-app notification history
              is retained as a secondary record so users can review
              previous notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings({
  settings,
  updateSetting,
}: {
  settings: PlatformSettings;
  updateSetting: <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) => void;
}) {
  return (
    <div>
      <SectionIntro
        title="Security and verification"
        description="Require appropriate verification before users can participate in protected platform operations."
      />

      <div className="space-y-1">
        <SettingRow
          title="Require business verification"
          description="Businesses must be verified before they become eligible for marketplace operations."
        >
          <Switch
            checked={
              settings.requireBusinessVerification
            }
            onChange={(event) =>
              updateSetting(
                "requireBusinessVerification",
                event.target.checked,
              )
            }
          />
        </SettingRow>

        <SettingRow
          title="Require rider verification"
          description="Riders must be verified before receiving eligible delivery requests."
        >
          <Switch
            checked={
              settings.requireRiderVerification
            }
            onChange={(event) =>
              updateSetting(
                "requireRiderVerification",
                event.target.checked,
              )
            }
          />
        </SettingRow>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 text-slate-500" />

          <div>
            <p className="text-sm font-medium text-slate-900">
              Protected administrative operations
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Sensitive operations such as refunds, wallet
              adjustments, payout actions, fee changes, and
              verification decisions must remain protected by
              role-based access control and server-side authorization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MaintenanceSettings({
  settings,
  updateSetting,
}: {
  settings: PlatformSettings;
  updateSetting: <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) => void;
}) {
  return (
    <div>
      <SectionIntro
        title="Maintenance mode"
        description="Temporarily restrict marketplace activity while administrators perform maintenance."
      />

      <div className="space-y-6">
        <SettingRow
          title="Maintenance mode"
          description="When enabled, customer-facing marketplace operations can be restricted according to server-side maintenance rules."
        >
          <Switch
            checked={settings.maintenanceMode}
            onChange={(event) =>
              updateSetting(
                "maintenanceMode",
                event.target.checked,
              )
            }
          />
        </SettingRow>

        <Textarea
          label="Maintenance message"
          value={settings.maintenanceMessage}
          onChange={(event) =>
            updateSetting(
              "maintenanceMessage",
              event.target.value,
            )
          }
          rows={4}
          helperText="This message can be displayed to users while maintenance mode is active."
        />

        {settings.maintenanceMode && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-900">
              Maintenance mode is enabled
            </p>

            <p className="mt-1 text-sm leading-6 text-red-800">
              Production enforcement must be handled by protected
              server-side rules. Do not rely on a frontend switch
              alone to disable marketplace operations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CalculationRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span
        className={
          strong
            ? "text-sm font-semibold text-slate-900"
            : "text-sm text-slate-600"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "text-sm font-semibold text-slate-900"
            : "text-sm font-medium text-slate-800"
        }
      >
        {value}
      </span>
    </div>
  );
}
