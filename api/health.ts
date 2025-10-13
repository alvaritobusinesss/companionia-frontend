export default async function handler(_req: any, res: any) {
  try {
    res.status(200).json({
      ok: true,
      time: new Date().toISOString(),
      node: process.versions?.node || null,
      runtime: 'nodejs',
      appUrlEnv: process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL || null,
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'health error' });
  }
}

