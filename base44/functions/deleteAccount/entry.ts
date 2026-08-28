import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const db = base44.asServiceRole;
    const uid = user.id;

    // Delete the user's data across all user-owned entities.
    try { await db.entities.Order.deleteMany({ created_by_id: uid }); } catch (e) { console.error('deleteAccount: Order', e); }
    try { await db.entities.AutopilotTask.deleteMany({ created_by_id: uid }); } catch (e) { console.error('deleteAccount: AutopilotTask', e); }
    try { await db.entities.ContentRequest.deleteMany({ created_by_id: uid }); } catch (e) { console.error('deleteAccount: ContentRequest', e); }
    try { await db.entities.Creative.deleteMany({ created_by_id: uid }); } catch (e) { console.error('deleteAccount: Creative', e); }
    try { await db.entities.Base44Purchase.deleteMany({ created_by_id: uid }); } catch (e) { console.error('deleteAccount: Base44Purchase', e); }

    return Response.json({ success: true });
  } catch (error) {
    console.error('deleteAccount error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}