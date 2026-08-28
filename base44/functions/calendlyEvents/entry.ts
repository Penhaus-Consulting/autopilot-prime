import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("calendly");
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // 1. Resolve the connected Calendly user
    const meRes = await fetch("https://api.calendly.com/users/me", { headers });
    if (!meRes.ok) {
      const detail = await meRes.text();
      console.error("calendly users/me failed", meRes.status, detail);
      return Response.json({ error: "Calendly user fetch failed", details: detail }, { status: 502 });
    }
    const me = (await meRes.json()).resource;

    // 2. Fetch upcoming scheduled events (active meetings scheduled through Calendly)
    const minStart = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const eventsUrl = new URL("https://api.calendly.com/scheduled_events");
    eventsUrl.searchParams.set("user", me.uri);
    eventsUrl.searchParams.set("status", "active");
    eventsUrl.searchParams.set("min_start_time", minStart);
    eventsUrl.searchParams.set("sort", "start_time");
    eventsUrl.searchParams.set("count", "20");

    const eventsRes = await fetch(eventsUrl, { headers });
    if (!eventsRes.ok) {
      const detail = await eventsRes.text();
      console.error("calendly scheduled_events failed", eventsRes.status, detail);
      return Response.json({ error: "Calendly events fetch failed", details: detail }, { status: 502 });
    }
    const collection = (await eventsRes.json()).collection || [];

    // 3. Enrich each event with its first invitee (bounded, parallel)
    const events = await Promise.all(collection.map(async (ev) => {
      const uuid = ev.uri.split("/").pop();
      let inviteeName = "";
      let inviteeEmail = "";
      let cancelUrl = "";
      let rescheduleUrl = "";
      try {
        const invRes = await fetch(`https://api.calendly.com/scheduled_events/${uuid}/invitees`, { headers });
        if (invRes.ok) {
          const inv = (await invRes.json()).collection || [];
          const first = inv[0];
          if (first) {
            inviteeName = first.name || "";
            inviteeEmail = first.email || "";
            cancelUrl = first.cancel_url || "";
            rescheduleUrl = first.reschedule_url || "";
          }
        }
      } catch (e) {
        console.error("calendly invitees fetch failed for", uuid, e?.message);
      }
      return {
        id: uuid,
        name: ev.name,
        startTime: ev.start_time,
        endTime: ev.end_time,
        status: ev.status,
        locationType: ev.location?.type || "",
        location: ev.location?.location || "",
        meetingLink: ev.location?.join_url || "",
        inviteeName,
        inviteeEmail,
        totalInvitees: ev.invitees_counter?.total || 0,
        cancelUrl,
        rescheduleUrl,
      };
    }));

    return Response.json({
      bookingUrl: me.scheduling_url,
      ownerName: me.name,
      timezone: me.timezone,
      events,
    });
  } catch (error) {
    console.error("calendlyEvents error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}