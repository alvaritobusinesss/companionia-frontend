export default async function handler(_req: any, res: any) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const hasKey = !!apiKey;
    let openaiOk: null | boolean = null;
    let status: number | null = null;
    let detail: string | null = null;

    if (hasKey) {
      try {
        const r = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        status = r.status;
        openaiOk = r.ok;
        if (!r.ok) {
          detail = await r.text();
        }
      } catch (e: any) {
        openaiOk = false;
        detail = e?.message || 'fetch failed';
      }
    }

    res.status(200).json({
      ok: true,
      env: {
        has_OPENAI_API_KEY: hasKey,
        has_SUPABASE_URL: !!process.env.SUPABASE_URL,
        has_SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      openai: { ok: openaiOk, status, detail },
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'diagnose error' });
  }
}
