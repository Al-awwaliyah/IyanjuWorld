import {
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import { PageContainer } from "../../components/layout/PageContainer";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-slate-200 bg-slate-50">
        <PageContainer className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Contact IyanjuWorld
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              We’re here to help
            </h1>

            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
              Have a question about an order, business account, delivery,
              partnership, or the IyanjuWorld marketplace? Send us a message
              and our team will be able to assist.
            </p>
          </div>
        </PageContainer>
      </section>

      <section>
        <PageContainer className="py-14 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                  Get in touch
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  Contact our team
                </h2>

                <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
                  Choose the contact method that works best for you. For
                  account-specific issues, please include enough information
                  for our support team to identify the relevant request.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Mail className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-950">Email</h3>
                      <a
                        href="mailto:support@iyanjuworld.com"
                        className="mt-1 block text-sm text-slate-600 hover:text-blue-600"
                      >
                        support@iyanjuworld.com
                      </a>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Phone className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-950">Phone</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Customer support contact will be published here.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <MapPin className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-950">
                        Location
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Nigeria
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <Clock3 className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-950">
                        Support hours
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Support availability will be published here.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-white">
                  Need help with an order?
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  If you already have an account, your order and support
                  information can be managed through your dashboard.
                </p>

                <Link to="/login" className="mt-5 inline-block">
                  <Button
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Sign in to your account
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                  Send a message
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  How can we help?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Fill out the form below and provide a clear description of
                  what you need help with.
                </p>
              </div>

              {submitted ? (
                <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100">
                    <Send className="h-5 w-5 text-emerald-700" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-emerald-950">
                    Message received
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-emerald-800">
                    Your message has been prepared successfully. The live
                    support submission service will be connected before
                    production launch.
                  </p>

                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-5 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Full name"
                      name="name"
                      placeholder="Your full name"
                      required
                    />

                    <Input
                      label="Email address"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <Input
                    label="Subject"
                    name="subject"
                    placeholder="How can we help?"
                    required
                  />

                  <Textarea
                    label="Message"
                    name="message"
                    placeholder="Tell us what you need help with..."
                    rows={7}
                    required
                  />

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs leading-5 text-slate-500">
                      Please do not include passwords, payment-card details,
                      PINs, or other sensitive security information in your
                      message.
                    </p>
                  </div>

                  <Button type="submit" size="lg" fullWidth>
                    Send message
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
