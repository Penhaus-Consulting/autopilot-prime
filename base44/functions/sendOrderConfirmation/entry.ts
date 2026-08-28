import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Invoked by the "Order Confirmation Email" workflow whenever a new Order is created.
// Re-fetches the order, then emails the buyer an immediate confirmation.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole; // workflow invocations have no end-user session

    const body = await req.json().catch(() => ({}));
    const orderId = body.order_id;
    if (!orderId) {
      return Response.json({ error: "order_id is required" }, { status: 400 });
    }

    const order = await db.entities.Order.get(orderId);
    if (!order) {
      console.error("sendOrderConfirmation: order not found", { orderId });
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const email = (order.customer_email || "").trim();
    if (!email) {
      // No buyer email to send to (e.g. anonymous buyer Wix couldn't resolve). Skip silently.
      console.log("sendOrderConfirmation: no customer email on order, skipping", { orderId });
      return Response.json({ ok: true, skipped: true, reason: "no_email" });
    }

    const amount = Number(order.amount) || 0;
    const fmtAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

    const service = order.service_name || "your service";
    const name = order.customer_name && order.customer_name !== email ? order.customer_name : "there";

    const subject = `Order confirmed — ${service}`;
    const body_html = [
      `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;background:#0a0a0a;color:#fafafa;padding:32px;border-radius:16px;border:1px solid #27272a">`,
      `<div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">`,
      `<span style="width:28px;height:28px;border-radius:8px;background:#34d399;color:#0a0a0a;display:inline-grid;place-items:center;font-weight:700">P</span>`,
      `<span style="font-weight:600;font-size:15px">PENHAUS Digital</span></div>`,
      `<h1 style="font-size:22px;font-weight:600;margin:0 0 12px">Order confirmed ✅</h1>`,
      `<p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 20px">Hi ${name},</p>`,
      `<p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 20px">`,
      `Thanks for your purchase. We've received your order and our AI agents are already on it.`,
      ` You'll get your deliverables shortly.</p>`,
      `<div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;margin:0 0 20px">`,
      `<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:#71717a;font-size:14px">Service</span><span style="font-size:14px;font-weight:500">${service}</span></div>`,
      `<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid #27272a"><span style="color:#71717a;font-size:14px">Amount paid</span><span style="font-size:14px;font-weight:600;color:#34d399">${fmtAmount}</span></div>`,
      `<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid #27272a"><span style="color:#71717a;font-size:14px">Status</span><span style="font-size:14px;text-transform:capitalize">${order.status || "paid"}</span></div>`,
      `</div>`,
      `<p style="color:#71717a;font-size:13px;line-height:1.6;margin:0">`,
      `If you have any questions, just reply to this email. Welcome aboard.</p>`,
      `</div>`,
    ].join("");

    await db.integrations.Core.SendEmail({
      to: email,
      subject,
      body: body_html,
      from_name: "PENHAUS Digital",
    });

    console.log("sendOrderConfirmation: email sent", { orderId, email });
    return Response.json({ ok: true, sentTo: email });
  } catch (error) {
    console.error("sendOrderConfirmation error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}