import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PageContainer } from "../../components/layout/PageContainer";
import { Button } from "../../components/ui/Button";

const principles = [
  {
    icon: ShieldCheck,
    title: "Trust",
    description:
      "We are building a marketplace around verified businesses, trusted transactions, secure payments, and transparent order handling.",
  },
  {
    icon: Users,
    title: "Opportunity",
    description:
      "IyanjuWorld helps local businesses reach more customers and gives riders an organized way to participate in the delivery economy.",
  },
  {
    icon: Truck,
    title: "Convenience",
    description:
      "Customers can discover products, communicate with sellers, pay for orders, and track deliveries from one platform.",
  },
];

const platformFeatures = [
  "Discover products from multiple businesses",
  "Shop directly from local businesses",
  "Secure marketplace payments",
  "Integrated delivery with verified riders",
  "Customer-to-business communication",
  "Order tracking and purchase history",
  "Business storefronts and product management",
  "Wallet-based refunds and financial records",
];

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-slate-200 bg-slate-50">
        <PageContainer className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              About IyanjuWorld
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Building a better way to buy and sell locally
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              IyanjuWorld is a modern multi-vendor marketplace designed to
              connect customers, businesses, and delivery riders through one
              trusted commerce platform.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/explore">
                <Button size="lg">
                  Explore marketplace
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>

              <Link to="/businesses">
                <Button variant="outline" size="lg">
                  Discover businesses
                </Button>
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>

      <section>
        <PageContainer className="py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Our mission
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Making digital commerce more accessible
              </h2>

              <div className="mt-6 space-y-5 text-base leading-7 text-slate-600">
                <p>
                  Buying from local businesses should be simple. Businesses
                  should have the tools they need to showcase their products,
                  receive orders, communicate with customers, and grow.
                </p>

                <p>
                  IyanjuWorld brings these experiences together in one
                  marketplace while providing an integrated delivery and
                  payment infrastructure.
                </p>

                <p>
                  Our long-term goal is to build trusted commerce
                  infrastructure that can serve communities across Nigeria and
                  eventually the wider African market.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-8 shadow-sm sm:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <Store className="h-7 w-7 text-white" />
              </div>

              <h3 className="mt-7 text-2xl font-bold text-white">
                One marketplace. Multiple opportunities.
              </h3>

              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                IyanjuWorld connects the people and systems required to move a
                product from a local business to a customer.
              </p>

              <div className="mt-7 space-y-4">
                {[
                  "Customers discover and purchase products.",
                  "Businesses manage their storefronts and orders.",
                  "Verified riders handle eligible deliveries.",
                  "The platform coordinates payments and commerce operations.",
                ].map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <p className="text-sm leading-6 text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <PageContainer className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              What we believe
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Built around three principles
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600">
              Every part of the platform is designed around creating a better
              experience for customers, businesses, and delivery partners.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {principles.map((principle) => {
              const Icon = principle.icon;

              return (
                <article
                  key={principle.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="mt-5 text-xl font-semibold text-slate-950">
                    {principle.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {principle.description}
                  </p>
                </article>
              );
            })}
          </div>
        </PageContainer>
      </section>

      <section>
        <PageContainer className="py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                The platform
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Designed for modern commerce
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-600">
                IyanjuWorld combines marketplace discovery, business tools,
                payments, delivery, communication, and customer services into a
                single ecosystem.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {platformFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <span className="text-sm font-medium leading-6 text-slate-700">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="border-t border-slate-200 bg-blue-600">
        <PageContainer className="py-14 sm:py-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Discover what IyanjuWorld can offer
              </h2>

              <p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">
                Explore products, discover local businesses, or learn more
                about joining the marketplace.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/explore">
                <Button
                  size="lg"
                  className="w-full bg-white text-blue-700 hover:bg-blue-50 sm:w-auto"
                >
                  Explore products
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>

              <Link to="/businesses">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-white/60 text-white hover:bg-white/10 sm:w-auto"
                >
                  View businesses
                </Button>
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
