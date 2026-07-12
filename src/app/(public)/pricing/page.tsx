import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pricing | DocuMind AI" };

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for individuals and small projects",
    features: [
      "5 documentation generations/day",
      "ZIP, files, and GitHub URL support",
      "All 31 documentation sections",
      "Version history (last 10)",
      "Export as README & Markdown",
      "Basic search",
    ],
    cta: "Get Started Free",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "per month",
    description: "For power users and growing teams",
    features: [
      "50 generations/day",
      "Priority Gemini processing",
      "Unlimited version history",
      "Export as PDF & DOCX",
      "Advanced search",
      "API access",
      "Custom branding on exports",
      "Priority support",
    ],
    cta: "Coming Soon",
    href: "#",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large teams and organizations",
    features: [
      "Unlimited generations",
      "Dedicated infrastructure",
      "SSO / SAML",
      "Audit logs",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated support",
    ],
    cta: "Contact Us",
    href: "mailto:hello@documind.ai",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <Badge className="gradient-primary text-white border-0">Pricing</Badge>
          <h1 className="text-4xl font-bold">Simple, transparent pricing</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Start for free. Upgrade when you need more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 space-y-6 ${
                plan.highlight
                  ? "border-primary/50 bg-primary/5 relative"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gradient-primary text-white border-0 text-xs">
                    <Zap className="w-3 h-3 mr-1" /> Most Popular
                  </Badge>
                </div>
              )}

              <div>
                <h2 className="text-lg font-bold">{plan.name}</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-black">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground text-sm">/{plan.period}</span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
              </div>

              <ul className="space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`w-full ${
                  plan.highlight
                    ? "gradient-primary text-white border-0 hover:opacity-90"
                    : ""
                }`}
                variant={plan.highlight ? "default" : "outline"}
                disabled={plan.cta === "Coming Soon"}
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
