/**
 * Central, typed configuration + secrets. Every environment variable the app needs is declared
 * here and mirrored in .env.example, so the keys this app requires are discoverable in one
 * place. Read config from here — never reach into process.env elsewhere, never hardcode a key.
 */
export const env = {
  port: Number(process.env.PORT ?? 3001),

  // Injected by the preview runtime (single-origin Docker run). Unset in API-only dev.
  mongoUri: process.env.MONGO_URI ?? '',
  clientDist: process.env.CLIENT_DIST ?? '',

  // RILO-managed OpenAI credentials (platform-injected; never ask the user).
  // When absent the local fallback solver is used automatically.
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiBaseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
};
