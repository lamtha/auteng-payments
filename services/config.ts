export const Config = {
  /** Base URL for the AutEng backend API (no trailing slash). */
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000',

  /** Stripe publishable key for Apple Pay / Google Pay. */
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
};
