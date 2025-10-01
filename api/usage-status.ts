import { createClient } from '@supabase/supabase-js';

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const subjectId = req.query.subjectId as string;
    if (!subjectId) return res.status(400).json({ error: 'subjectId is required' });

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const day = todayStr();

    // premium check if subjectId equals to a real user id
    let isPremium = false;
    try {
      const { data: userRow } = await supabase
        .from('users')
        .select('id, is_premium, premium_expires_at')
        .eq('id', String(subjectId))
        .single();
      if (userRow?.is_premium && (!userRow.premium_expires_at || new Date(userRow.premium_expires_at) > new Date())) {
        isPremium = true;
      }
    } catch {}

    if (isPremium) {
      return res.json({ used: 0, remaining: 1e9, limit: null, day, premium: true });
    }

    let used = 0;
    try {
      const { data } = await supabase
        .from('user_daily_usage')
        .select('count')
        .eq('subject_id', subjectId)
        .eq('day', day)
        .single();
      used = (data && typeof (data as any).count === 'number') ? (data as any).count : 0;
    } catch {}

    const limitEnv = parseInt(process.env.DAILY_FREE_LIMIT || '5', 10);
    const limit = Number.isFinite(limitEnv) ? limitEnv : 5;
    const remaining = Math.max(0, limit - used);
    res.json({ used, remaining, limit, day, premium: false });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'status error' });
  }
}
