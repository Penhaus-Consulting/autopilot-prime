import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Public endpoint for the Store "Wall of Love".
// No user session — store visitors are anonymous, so we use the service role
// and return ONLY public-safe fields (never customer_email).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;

    // Fetch a generous pool of top-rated feedback, then trim client-side by rating.
    const all = await db.entities.Feedback.filter({}, "-rating", 50);
    const featured = (all || [])
      .filter((f) => Number(f.rating) >= 4 && f.comment)
      .sort((a, b) => Number(b.rating) - Number(a.rating))
      .slice(0, 8)
      .map((f) => ({
        id: f.id,
        rating: Number(f.rating),
        comment: String(f.comment).slice(0, 280),
        customer_name: f.customer_name ? String(f.customer_name).split(" ")[0] : "Verified buyer",
        service_name: f.service_name || "",
      }));

    return Response.json({ reviews: featured, count: featured.length });
  } catch (error) {
    console.error("getFeaturedFeedback error", error);
    return Response.json({ reviews: [], count: 0 }, { status: 200 });
  }
}