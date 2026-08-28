import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Public feedback endpoint for the /rate page (no user session — uses service role).
// action "get"    -> returns the order's public info for the rating page.
// action "submit" -> records a 1-5 rating (one per order, idempotent).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === "get") {
      const orderId = body.order_id;
      if (!orderId) return Response.json({ error: "order_id is required" }, { status: 400 });
      const order = await db.entities.Order.get(orderId).catch(() => null);
      if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
      return Response.json({
        service_name: order.service_name || "your service",
        customer_name: order.customer_name || "",
        status: order.status || "",
      });
    }

    if (action === "submit") {
      const orderId = body.order_id;
      const rating = Number(body.rating);
      if (!orderId || !rating || rating < 1 || rating > 5) {
        return Response.json({ error: "A valid order_id and rating (1-5) are required" }, { status: 400 });
      }
      // One rating per order — guard against resubmits.
      const existing = await db.entities.Feedback.filter({ order_id: orderId });
      if (existing && existing.length) {
        return Response.json({ ok: true, already: true });
      }
      const order = await db.entities.Order.get(orderId).catch(() => null);
      await db.entities.Feedback.create({
        order_id: orderId,
        customer_name: order?.customer_name || (body.customer_name || ""),
        customer_email: order?.customer_email || "",
        service_name: order?.service_name || "",
        rating,
        comment: (body.comment || "").slice(0, 1000),
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("serviceFeedback error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}