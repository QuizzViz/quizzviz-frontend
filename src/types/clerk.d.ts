import '@clerk/nextjs/server';

declare module '@clerk/nextjs/server' {
  interface SessionClaims {
    metadata: {
      onboardingComplete?: boolean;
      // Add other custom metadata properties here as needed
    };
  }
}
