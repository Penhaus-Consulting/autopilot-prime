import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const platform = String(body.platform || 'TikTok').slice(0, 20);
    const topic = String(body.topic || '').slice(0, 300);
    const angle = String(body.angle || 'hook-driven, pattern-interrupt, value-first').slice(0, 300);
    const duration = Math.min(Math.max(Number(body.duration) || 30, 5), 180);

    if (!topic) return Response.json({ error: 'Topic is required' }, { status: 400 });

    const prompt = `You are a world-class short-form content strategist. Create a high-converting ${platform} short-form video script.
Topic: ${topic}
Angle: ${angle}
Duration: ${duration} seconds

Return ONLY a JSON object with this exact shape:
{
  "hook": "a scroll-stopping first line",
  "script": "the full spoken script with beats",
  "hashtags": "comma separated hashtags",
  "cta": "a single clear call to action"
}`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          hook: { type: 'string' },
          script: { type: 'string' },
          hashtags: { type: 'string' },
          cta: { type: 'string' },
        },
        required: ['hook', 'script', 'hashtags', 'cta'],
      },
    });

    const out = typeof res === 'string' ? JSON.parse(res) : res;
    return Response.json({ platform, topic, angle, duration, ...out });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}