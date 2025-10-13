// Prints names of Stripe-related env vars at build time (values are not logged)
(function () {
  try {
    const keys = Object.keys(process.env || {});
    const interesting = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PREMIUM_PRICE',
      'VITE_STRIPE_PUBLISHABLE_KEY',
    ];
    const present = interesting.filter(k => !!process.env[k]);
    const anyStripe = keys.filter(k => /STRIPE/i.test(k));

    // Keep output concise and redact values
    console.log('\n[diagnose-env] Build-time env keys (names only):');
    console.log('  interestingPresent:', present);
    console.log('  allStripeLikeKeys:', anyStripe);
    console.log('[diagnose-env] NODE_ENV:', process.env.NODE_ENV || null);
  } catch (e) {
    console.log('[diagnose-env] error:', e && e.message);
  }
})();
