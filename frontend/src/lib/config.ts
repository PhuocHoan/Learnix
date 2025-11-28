/**
 * Application configuration from environment variables
 *
 * In Vite, environment variables must be prefixed with VITE_
 * and are accessed via import.meta.env
 */

export const config = {
  /**
   * Backend API URL
   * @default 'http://localhost:3000'
   */
  apiUrl:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? "/api" : "http://localhost:3000"),

  /**
   * Application name
   * @default 'Learnix'
   */
  appName: import.meta.env.VITE_APP_NAME || "Learnix",

  /**
   * Is production environment
   */
  isProduction: import.meta.env.PROD,

  /**
   * Is development environment
   */
  isDevelopment: import.meta.env.DEV,
} as const;

/**
 * OAuth URLs
 */
export const oauthUrls = {
  google: `${config.apiUrl}/auth/google`,
  github: `${config.apiUrl}/auth/github`,
} as const;
