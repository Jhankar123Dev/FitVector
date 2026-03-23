"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/use-user";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "Free",
    description: "Get started with basic job search",
    features: [
      "3 job searches/day",
      "2 resume tailors/month",
      "2 cold emails/month",
      "10 active applications",
      "1 resume template",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: "₹499/mo",
    description: "For active job seekers",
    features: [
      "10 job searches/day",
      "10 resume tailors/month",
      "15 cold emails/month",
      "50 active applications",
      "2 resume templates",
      "Job alerts",
      "Follow-up reminders",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹999/mo",
    popular: true,
    description: "Unlimited power for serious seekers",
    features: [
      "Unlimited job searches",
      "50 resume tailors/month",
      "50 cold emails/month",
      "Unlimited applications",
      "3 resume templates",
      "Gap analysis",
      "Chrome extension",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: "₹1,999/mo",
    description: "Everything, no limits",
    features: [
      "Everything in Pro",
      "Unlimited AI features",
      "100 email finds/month",
      "Custom resume templates",
      "Priority support",
    ],
  },
];

export default function PlanPage() {
  const { user } = useUser();
  const currentPlan = user?.planTier || "free";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upgrade Plan</h1>
        <p className="text-sm text-muted-foreground">
          Choose the plan that fits your job search needs
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular ? "border-primary shadow-md" : ""
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{plan.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
                <p className="mt-2 text-2xl font-bold">{plan.price}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-4 w-full"
                  variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
                  disabled={isCurrent}
                >
                  {isCurrent ? "Current Plan" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
