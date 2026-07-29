// One-off cleanup: cancel Stripe subscription for a user whose account was
// deleted from the app DB but whose Stripe customer/subscription survived
// (delete-account flow didn't cancel Stripe before this fix — see
// app/actions/delete-account.ts). Usage:
//   node scripts/cancel-orphan-stripe-sub.mjs user@example.com          (list only)
//   node scripts/cancel-orphan-stripe-sub.mjs user@example.com --cancel (actually cancel)

import { readFileSync } from "fs";
import Stripe from "stripe";

const email = process.argv[2];
const doCancel = process.argv.includes("--cancel");
if (!email) {
  console.error("Usage: node scripts/cancel-orphan-stripe-sub.mjs <email> [--cancel]");
  process.exit(1);
}

const envFile = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const match = envFile.match(/^STRIPE_SECRET_KEY=(.+)$/m);
if (!match) {
  console.error("STRIPE_SECRET_KEY not found in .env.local");
  process.exit(1);
}
const stripe = new Stripe(match[1].trim().replace(/^"|"$/g, ""));

const customers = await stripe.customers.list({ email, limit: 10 });
if (customers.data.length === 0) {
  console.log(`No Stripe customer found for ${email}`);
  process.exit(0);
}

for (const customer of customers.data) {
  console.log(`Customer ${customer.id} (${customer.email})`);
  const subs = await stripe.subscriptions.list({ customer: customer.id, status: "all" });
  if (subs.data.length === 0) {
    console.log("  no subscriptions");
    continue;
  }
  for (const sub of subs.data) {
    console.log(`  sub ${sub.id} status=${sub.status} current_period_end=${sub.items.data[0]?.current_period_end ? new Date(sub.items.data[0].current_period_end * 1000).toISOString() : "n/a"}`);
    if (sub.status === "canceled" || sub.status === "incomplete_expired") {
      console.log("    already terminal, skipping");
      continue;
    }
    if (doCancel) {
      const canceled = await stripe.subscriptions.cancel(sub.id);
      console.log(`    canceled -> status=${canceled.status}`);
    } else {
      console.log("    would cancel (pass --cancel to actually cancel)");
    }
  }
}
