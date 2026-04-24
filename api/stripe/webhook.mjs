import { readRawBody } from "../_shared/cors.mjs";
import { createSupabaseAdminClient } from "../_shared/supabase.mjs";
import {
  getStripeClient,
  getStripeWebhookSecret,
  syncSubscriptionFromStripe,
} from "../_shared/subscriptions.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const stripe = getStripeClient();
    const admin = createSupabaseAdminClient();
    const signature = req.headers["stripe-signature"];
    const rawBody = await readRawBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret());

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        if (session.mode === "subscription" && typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription, {
            expand: ["items.data.price"],
          });

          await syncSubscriptionFromStripe(admin, stripe, subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await syncSubscriptionFromStripe(admin, stripe, subscription);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object;

        if (typeof invoice.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription, {
            expand: ["items.data.price"],
          });

          await syncSubscriptionFromStripe(admin, stripe, subscription, {
            resetVoiceUsage:
              invoice.billing_reason === "subscription_cycle" ||
              invoice.billing_reason === "subscription_create",
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;

        if (typeof invoice.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription, {
            expand: ["items.data.price"],
          });

          await syncSubscriptionFromStripe(admin, stripe, subscription);
        }
        break;
      }
      default:
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handling failed:", error);
    res.status(400).json({
      error: error instanceof Error ? error.message : "Webhook handling failed",
    });
  }
}
