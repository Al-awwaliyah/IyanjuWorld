import {
  Bell,
  Database,
  LockKeyhole,
  MessageSquare,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PageContainer } from "../../components/layout/PageContainer";

const sections = [
  {
    title: "1. Information We Collect",
    content: [
      "IyanjuWorld may collect information that is necessary to create and manage accounts, operate the marketplace, process transactions, provide delivery services, communicate with users, and protect the platform.",
      "Depending on how you use IyanjuWorld, this may include account information, contact information, business information, order information, delivery information, transaction records, messages, support requests, and technical information associated with your use of the platform.",
    ],
  },
  {
    title: "2. Account Information",
    content: [
      "When you create an account, we may collect information such as your name, email address, phone number, account role, profile information, and other information required for the relevant account type.",
      "Businesses and riders may be required to provide additional information for verification and operational purposes.",
      "You should provide accurate information and keep your account information reasonably up to date.",
    ],
  },
  {
    title: "3. Marketplace and Order Information",
    content: [
      "When customers browse, add products to carts, place orders, or interact with businesses, the platform may process information necessary to complete those activities.",
      "This may include products viewed or purchased, quantities, prices, order references, delivery addresses, order status, customer notes, seller information, delivery information, and related transaction records.",
      "Businesses may receive information necessary to fulfil customer orders, communicate with customers, and provide the purchased products or services.",
    ],
  },
  {
    title: "4. Payment and Financial Information",
    content: [
      "IyanjuWorld may process payment-related information through supported payment providers and financial infrastructure.",
      "Payment transaction references, payment status, amounts, timestamps, wallet transactions, refunds, withdrawals, payouts, and financial ledger records may be retained for transaction processing, reconciliation, fraud prevention, customer support, and legal or regulatory purposes.",
      "Sensitive payment credentials should be handled by the applicable payment provider and should not be unnecessarily submitted through IyanjuWorld messaging, support forms, or other general platform interfaces.",
    ],
  },
  {
    title: "5. Wallet Information",
    content: [
      "Where wallet functionality is available, IyanjuWorld may maintain records of wallet deposits, marketplace payments, refunds, withdrawals, reversals, adjustments, and related ledger entries.",
      "Wallet balances and transaction records are maintained to support accurate financial reconciliation and account history.",
      "Wallet activity may be subject to verification, transaction limits, fraud controls, and other applicable security requirements.",
    ],
  },
  {
    title: "6. Delivery Information",
    content: [
      "Delivery-related information may be processed to coordinate eligible orders between customers, businesses, and riders.",
      "This can include delivery addresses, delivery instructions, operating areas, rider availability, assignment information, pickup and delivery status, and other information required to complete an order.",
      "Location-related information should only be processed where it is reasonably necessary for an applicable platform or delivery function and in accordance with applicable requirements.",
    ],
  },
  {
    title: "7. Messages and Communications",
    content: [
      "IyanjuWorld may provide messaging between customers, businesses, riders, and authorized platform personnel.",
      "Messages, attachments, timestamps, conversation membership, and related communication records may be processed to provide communication services, resolve disputes, investigate abuse, provide customer support, and protect the platform.",
      "Users should avoid sending passwords, payment-card information, PINs, authentication codes, or other unnecessary sensitive credentials through ordinary messaging.",
    ],
  },
  {
    title: "8. Push Notifications",
    content: [
      "IyanjuWorld is designed to use push notifications as a primary notification channel for important marketplace events.",
      "Depending on user preferences and platform capabilities, notifications may relate to payments, orders, rider assignments, delivery updates, wallet activity, messages, account activity, security events, and platform announcements.",
      "The platform may store push subscription or device-token information required to deliver notifications. Users may control supported notification permissions through their device or browser settings.",
    ],
  },
  {
    title: "9. Technical Information",
    content: [
      "The platform may automatically process technical information required to operate, secure, monitor, and improve the service.",
      "This may include browser or device information, IP address, operating information, application events, error information, security events, timestamps, and other technical metadata.",
      "Technical information may be used to diagnose problems, prevent abuse, protect accounts, monitor system health, and improve platform performance.",
    ],
  },
  {
    title: "10. How We Use Information",
    content: [
      "Information may be used to provide and operate IyanjuWorld services, including account management, marketplace discovery, order processing, payment verification, delivery coordination, messaging, wallet services, customer support, and notifications.",
      "Information may also be used for security, fraud prevention, dispute resolution, audit logging, reconciliation, system monitoring, analytics, service improvement, and compliance with applicable legal obligations.",
    ],
  },
  {
    title: "11. How Information Is Shared",
    content: [
      "IyanjuWorld may share information with another marketplace participant when that information is necessary to complete a transaction or provide an expected platform service.",
      "For example, a business may receive customer information needed to fulfil an order, while an assigned rider may receive information needed to collect and deliver that order.",
      "Information may also be processed by trusted technology, payment, infrastructure, communication, analytics, security, or service providers where necessary to operate the platform.",
    ],
  },
  {
    title: "12. Security",
    content: [
      "IyanjuWorld is designed with security controls intended to protect user and financial information.",
      "These controls may include authentication, role-based access control, database access policies, server-side payment verification, webhook verification, idempotent financial processing, audit logs, protected storage, and controlled administrative access.",
      "No online system can guarantee absolute security. Users should protect their account credentials and report suspected unauthorized activity promptly.",
    ],
  },
  {
    title: "13. Data Retention",
    content: [
      "Information may be retained for as long as reasonably necessary to provide services, maintain transaction and financial records, resolve disputes, protect the platform, meet legal obligations, and support legitimate operational requirements.",
      "Retention periods may differ depending on the type of information and the reason it was collected.",
    ],
  },
  {
    title: "14. Your Choices",
    content: [
      "Depending on the available platform functionality, users may be able to update account information, manage notification preferences, control device or browser notification permissions, and request assistance with account-related information.",
      "Some information may need to be retained even after an account change or closure where it is required for financial reconciliation, security, dispute handling, fraud prevention, or legal obligations.",
    ],
  },
  {
    title: "15. Children's Privacy",
    content: [
      "IyanjuWorld is not designed to knowingly collect personal information from children in violation of applicable law.",
      "Where age restrictions apply, users should not create or operate accounts contrary to those requirements.",
    ],
  },
  {
    title: "16. Third-Party Services",
    content: [
      "IyanjuWorld may depend on third-party services for areas such as payments, authentication infrastructure, hosting, storage, communications, analytics, maps, notifications, or other technical functionality.",
      "Those services may process information according to their own applicable terms and privacy policies.",
    ],
  },
  {
    title: "17. Changes to This Privacy Policy",
    content: [
      "This Privacy Policy may be updated as IyanjuWorld develops, introduces new services, changes infrastructure, or responds to legal and regulatory requirements.",
      "Where appropriate, material changes may be communicated through platform notifications or other suitable channels.",
    ],
  },
];

const privacyHighlights = [
  {
    icon: LockKeyhole,
    title: "Protected access",
    description:
      "Authentication and role-based controls help limit access to protected account and operational data.",
  },
  {
    icon: Database,
    title: "Controlled records",
    description:
      "Orders, payments, wallet activity, and important operational events are designed to be recorded and auditable.",
  },
  {
    icon: Bell,
    title: "Push notifications",
    description:
      "Important marketplace events can be delivered through device or browser push notifications.",
  },
  {
    icon: ShieldCheck,
    title: "Security-focused design",
    description:
      "Payment verification, access controls, audit logging, and protected backend operations form part of the platform architecture.",
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-slate-200 bg-slate-50">
        <PageContainer className="py-14 sm:py-18">
          <div className="mx-auto max-w-4xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-brand-600">
              Privacy
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Privacy Policy
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
              This Privacy Policy explains the types of information IyanjuWorld
              may process, why that information is needed, how it may be used,
              and the security principles guiding the platform.
            </p>

            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm leading-6 text-amber-900">
                <strong>Important:</strong> This is a product-policy draft for
                IyanjuWorld and should receive appropriate legal and privacy
                compliance review before public production launch.
              </p>
            </div>
          </div>
        </PageContainer>
      </section>

      <section>
        <PageContainer className="py-12 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-4 sm:grid-cols-2">
              {privacyHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon className="h-5 w-5" />
                    </div>

                    <h2 className="mt-4 text-base font-semibold text-slate-950">
                      {item.title}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 space-y-10">
              {sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
                    {section.title}
                  </h2>

                  <div className="mt-4 space-y-4">
                    {section.content.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="text-sm leading-7 text-slate-600 sm:text-base"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                  <UserRound className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-950">
                    Questions about privacy?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    If you have questions about your information or privacy
                    practices, contact the IyanjuWorld support team through the
                    Contact page.
                  </p>

                  <Link
                    to="/contact"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800"
                  >
                    Contact IyanjuWorld
                    <MessageSquare className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-8">
              <p className="text-sm leading-6 text-slate-500">
                IyanjuWorld is currently under active development. Specific
                data practices, retention periods, legal bases, user rights,
                third-party processors, and contact details should be finalized
                before public production release.
              </p>

              <div className="mt-5 flex flex-wrap gap-4 text-sm font-medium">
                <Link
                  to="/terms"
                  className="text-brand-600 hover:text-brand-800"
                >
                  Terms of Service
                </Link>

                <Link
                  to="/contact"
                  className="text-brand-600 hover:text-brand-800"
                >
                  Contact Support
                </Link>

                <Link to="/about" className="text-brand-600 hover:text-brand-800">
                  About IyanjuWorld
                </Link>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
