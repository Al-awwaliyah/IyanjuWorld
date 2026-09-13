import { FileText, ShieldCheck, Store, Truck, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

import { PageContainer } from "../../components/layout/PageContainer";

const sections = [
  {
    title: "1. About IyanjuWorld",
    content: [
      "IyanjuWorld is a multi-vendor digital marketplace that connects customers with independent businesses and facilitates eligible delivery services through verified riders.",
      "Businesses using the platform remain responsible for the products, descriptions, prices, availability, quality, legality, and fulfilment of the products they list.",
    ],
  },
  {
    title: "2. Customer Accounts",
    content: [
      "Customers may browse publicly available marketplace content without creating an account. An account is required for transactional features such as placing orders, managing purchases, using wallet services, and accessing protected account features.",
      "You are responsible for keeping your account credentials secure and for activities performed through your account. You should notify IyanjuWorld if you believe your account has been accessed without authorization.",
    ],
  },
  {
    title: "3. Business Accounts",
    content: [
      "Businesses must provide accurate information during registration and maintain accurate storefront, product, pricing, inventory, and contact information.",
      "IyanjuWorld may require verification before a business can participate in marketplace transactions. Verification does not mean that IyanjuWorld manufactures, owns, or guarantees every product offered by that business.",
    ],
  },
  {
    title: "4. Products and Listings",
    content: [
      "Businesses are responsible for ensuring that their products and listings comply with applicable laws and platform requirements.",
      "Product information should be accurate and should clearly communicate relevant details such as price, availability, condition, quantity, and applicable product information.",
      "IyanjuWorld may remove, restrict, suspend, or request changes to listings that violate platform rules, applicable law, or marketplace safety requirements.",
    ],
  },
  {
    title: "5. Orders",
    content: [
      "Submitting an order creates a request to purchase the selected products. An order may remain pending until payment and applicable business confirmation requirements have been completed.",
      "Order status may progress through payment, business confirmation, delivery assignment, pickup, delivery, and completion stages.",
      "Orders may be cancelled or otherwise changed where permitted by the platform's applicable policies and the circumstances of the transaction.",
    ],
  },
  {
    title: "6. Payments",
    content: [
      "IyanjuWorld may provide multiple supported payment methods through its payment infrastructure.",
      "Payments are subject to server-side verification before an order is treated as successfully paid.",
      "The customer-facing order amount consists of the applicable product subtotal and delivery fee. The platform commission charged to a business is not added as a separate platform fee to the customer's order total.",
    ],
  },
  {
    title: "7. Platform Commission",
    content: [
      "IyanjuWorld may charge businesses a platform commission on applicable product or order value.",
      "The platform commission rate is controlled by the platform's applicable settings and policies. Unless otherwise stated for a particular transaction, the current marketplace model is designed around a 5% business platform commission on the applicable product subtotal, excluding delivery fees.",
      "The applicable commission may be recorded as part of the business financial settlement for an order.",
    ],
  },
  {
    title: "8. Delivery",
    content: [
      "Eligible paid orders may be made available to verified and available riders for delivery.",
      "Delivery availability, delivery zones, fees, estimated delivery times, rider assignment, and operational rules may vary by location and platform configuration.",
      "Riders are independent delivery participants within the platform's delivery network and are responsible for completing accepted delivery assignments in accordance with platform requirements.",
    ],
  },
  {
    title: "9. Wallet Services",
    content: [
      "Where wallet functionality is available, customers may be able to fund their wallet, use wallet funds for eligible marketplace transactions, receive refunds, and request withdrawals subject to applicable requirements.",
      "Wallet balances and financial transactions are maintained through the platform's financial ledger architecture. Displayed balances may distinguish between available and pending funds.",
      "Wallet functionality may be subject to verification, transaction limits, operational controls, and applicable financial-service requirements.",
    ],
  },
  {
    title: "10. Refunds and Disputes",
    content: [
      "Refund eligibility depends on the circumstances of the transaction, applicable marketplace policies, and the outcome of any review or dispute process.",
      "Where a wallet refund is approved, the refund may be credited to the customer's IyanjuWorld wallet rather than being treated as a separate platform service fee.",
      "Customers may be required to provide relevant information when opening a dispute. IyanjuWorld may review order records, payment records, messages, delivery information, and other relevant evidence before making an operational decision.",
    ],
  },
  {
    title: "11. Messaging and Communication",
    content: [
      "IyanjuWorld may provide messaging between customers, businesses, riders, and authorized platform personnel for marketplace and delivery purposes.",
      "Users must not use platform messaging to send unlawful, abusive, fraudulent, threatening, or otherwise prohibited content.",
      "Messages and related operational records may be retained where necessary for security, dispute resolution, support, compliance, and platform administration.",
    ],
  },
  {
    title: "12. Prohibited Activities",
    content: [
      "Users must not use IyanjuWorld to facilitate fraud, theft, impersonation, unauthorized payment activity, illegal transactions, abuse of platform systems, manipulation of marketplace records, or other unlawful activity.",
      "Users must not attempt to bypass authentication, access controls, payment verification, financial controls, or other security mechanisms.",
      "IyanjuWorld may suspend or restrict accounts, listings, transactions, or other platform access where there are reasonable grounds to believe that platform rules or applicable laws have been violated.",
    ],
  },
  {
    title: "13. Platform Availability",
    content: [
      "IyanjuWorld is provided as a developing digital commerce platform. Features, integrations, availability, supported payment methods, delivery coverage, and operational procedures may change as the platform evolves.",
      "Temporary interruptions may occur because of maintenance, infrastructure issues, payment-provider availability, network problems, security events, or circumstances outside the platform's reasonable control.",
    ],
  },
  {
    title: "14. Intellectual Property",
    content: [
      "The IyanjuWorld name, platform interface, software, branding, original content, and associated intellectual property are protected by applicable laws.",
      "Businesses and users retain rights in content they lawfully own and submit to the platform, subject to the permissions required to operate, display, process, and promote their marketplace activity.",
    ],
  },
  {
    title: "15. Privacy",
    content: [
      "Use of IyanjuWorld also involves the collection and processing of information required to provide marketplace, payment, delivery, communication, security, and support services.",
      "For information about how personal information is handled, users should review the IyanjuWorld Privacy Policy.",
    ],
  },
  {
    title: "16. Changes to These Terms",
    content: [
      "IyanjuWorld may update these Terms as the platform, services, legal requirements, and operating model evolve.",
      "Material changes may be communicated through appropriate platform channels. Continued use of the platform after applicable changes take effect may constitute acceptance of the updated Terms to the extent permitted by law.",
    ],
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-slate-200 bg-slate-50">
        <PageContainer className="py-14 sm:py-18">
          <div className="mx-auto max-w-4xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FileText className="h-7 w-7" />
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-blue-600">
              Legal
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Terms of Service
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
              These terms describe the general rules governing use of the
              IyanjuWorld marketplace, including customer accounts, businesses,
              orders, payments, delivery, wallet services, and platform
              responsibilities.
            </p>

            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm leading-6 text-amber-900">
                <strong>Important:</strong> These Terms are a product-policy
                draft for the platform and should receive appropriate legal
                review before IyanjuWorld's public production launch.
              </p>
            </div>
          </div>
        </PageContainer>
      </section>

      <section>
        <PageContainer className="py-12 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                {
                  icon: Store,
                  label: "Marketplace",
                },
                {
                  icon: Wallet,
                  label: "Payments",
                },
                {
                  icon: Truck,
                  label: "Delivery",
                },
                {
                  icon: ShieldCheck,
                  label: "Trust & Safety",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <Icon className="h-5 w-5 text-blue-600" />
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      {item.label}
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

            <div className="mt-14 border-t border-slate-200 pt-8">
              <p className="text-sm leading-6 text-slate-500">
                IyanjuWorld is currently under active development. Platform
                features, policies, payment methods, delivery coverage, and
                operational requirements may be updated before public
                production release.
              </p>

              <div className="mt-5 flex flex-wrap gap-4 text-sm font-medium">
                <Link
                  to="/privacy"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Privacy Policy
                </Link>

                <Link
                  to="/contact"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Contact Support
                </Link>

                <Link
                  to="/about"
                  className="text-blue-600 hover:text-blue-800"
                >
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
