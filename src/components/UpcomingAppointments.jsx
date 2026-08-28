import React from "react";
import { useQuery } from "@tanstack/react-query";
import { calendlyEvents } from "@/functions/calendlyEvents";
import { CalendarClock, ExternalLink, MapPin, Users, Loader2, Video, Mail } from "lucide-react";

const fmtTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

const fmtDuration = (start, end) => {
  if (!start || !end) return "";
  const mins = Math.round((new Date(end) - new Date(start)) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`.trim();
};

export default function UpcomingAppointments() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["calendly-events"],
    queryFn: async () => {
      const res = await calendlyEvents({});
      return res.data || res;
    },
    retry: 1,
  });

  const events = data?.events || [];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-wrap gap-2">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-sky-400" /> Upcoming Appointments
          </h2>
          <p className="text-xs text-zinc-500">Customer consultations booked via Calendly</p>
        </div>
        {data?.bookingUrl && (
          <a
            href={data.bookingUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-sky-400 hover:underline"
          >
            Booking link <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="divide-y divide-zinc-800">
        {isLoading && (
          <div className="px-5 py-10 text-center text-sm text-zinc-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading appointments…
          </div>
        )}

        {!isLoading && error && (
          <div className="px-5 py-10 text-center text-sm text-zinc-500">
            Couldn't load Calendly appointments. Please try again later.
          </div>
        )}

        {!isLoading && !error && events.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-zinc-500">
            No upcoming consultations. Share your booking link to let customers schedule.
          </div>
        )}

        {!isLoading &&
          events.map((ev) => (
            <div key={ev.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-zinc-100 font-medium truncate">{ev.name || "Consultation"}</div>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <CalendarClock className="w-3 h-3" /> {fmtTime(ev.startTime)}
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span>{fmtDuration(ev.startTime, ev.endTime)}</span>
                  {ev.inviteeName && (
                    <>
                      <span className="text-zinc-600">·</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {ev.inviteeName}
                      </span>
                    </>
                  )}
                  {ev.inviteeEmail && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {ev.inviteeEmail}
                    </span>
                  )}
                </div>
                {ev.location && (
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-zinc-400">
                    {ev.locationType === "zoom" || ev.meetingLink ? (
                      <Video className="w-3 h-3 text-sky-400" />
                    ) : (
                      <MapPin className="w-3 h-3 text-amber-400" />
                    )}
                    {ev.meetingLink ? (
                      <a href={ev.meetingLink} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline truncate">
                        {ev.meetingLink}
                      </a>
                    ) : (
                      <span className="truncate">{ev.location}</span>
                    )}
                  </div>
                )}
              </div>
              {ev.totalInvitees > 1 && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-zinc-800 text-zinc-400 self-start">
                  {ev.totalInvitees} attendees
                </span>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}