import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Invoked from the Orders view when an order is marked fulfilled.
// Sends the customer a rating-prompt email containing a link to the public /rate page.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const orderId = body.order_id;
    if (!orderId) return Response.json({ error: "order_id is required" }, { status: 400 });

    const order = await base44.entities.Order.get(orderId);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    const appUrl = req.headers.get("X-Base44-App-Url") || Deno.env.get("WIX_CHECKOUT_APP_URL") || "";
    const rateLink = appUrl ? `${appUrl.replace(/\/$/, "")}/rate?order=${order.id}` : "";

    const email = (order.customer_email || "").trim();
    const service = order.service_name || "your service";
    const name = order.customer_name && order.customer_name !== email ? order.customer_name : "there";

    if (!email) {
      // No buyer email to send to — return the link so it can be shared manually.
      return Response.json({ ok: false, reason: "no_email", rateLink });
    }

    const subject = `How did we do? Rate your ${service}`;
    const body_html = [
      `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;background:#0a0a0a;color:#fafafa;padding:32px;border-radius:16px;border:1px solid #27272a">`,
      `<div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">`,
      `<span style="width:28px;height:28px;border-radius:8px;background:#34d399;color:#0a0a0a;display:inline-grid;place-items:center;font-weight:700">P</span>`,
      `<span style="font-weight:600;font-size:15px">PENHAUS Digital</span></div>`,
      `<h1 style="font-size:22px;font-weight:600;margin:0 0 12px">Your order is complete 🎉</h1>`,
      `<p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 20px">Hi ${name},</p>`,
      `<p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 24px">`,
      `Thanks for choosing <strong>${service}</strong>. We'd love your feedback — it takes 10 seconds and helps us keep improving.</p>`,
      rateLink
        ? `<a href="${rateLink}" style="display:inline-block;background:#34d399;color:#0a0a0a;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;text-decoration:none">Rate your service</a>`
        : `<p style="color:#71717a;font-size:13px">Contact us to share your feedback.</p>`,
      `<p style="color:#71717a;font-size:13px;line-height:1.6;margin:24px 0 0">Thanks again for your trust.</p>`,
      `</div>`,
    ].join("");

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject,
        body: body_html,
        from_name: "PENHAUS Digital",
      });
      return Response.json({ ok: true, sentTo: email, rateLink });
    } catch (emailErr) {
      // Delivery to non-registered buyers requires a connected custom domain.
      // Surface the link so the admin can still share it with the customer.
      console.error("requestServiceFeedback: email send failed", emailErr);
      return Response.json({ ok: false, reason: "email_failed", rateLink });
    }
  } catch (error) {
    console.error("requestServiceFeedback error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}