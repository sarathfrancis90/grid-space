import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { env } from "./env";
import { findOrCreateOAuthUser } from "../services/auth.service";

export function initializePassport(): void {
  // Google Strategy
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${env.CLIENT_URL}/api/auth/oauth/google/callback`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email found in Google profile"));
            }
            const result = await findOrCreateOAuthUser(
              email,
              profile.displayName || null,
              profile.photos?.[0]?.value || null,
              "google",
            );
            // Pass result through to authenticate callback (typed as Express.User)
            done(null, result as unknown as Express.User);
          } catch (err) {
            done(err as Error);
          }
        },
      ),
    );
  }

  // GitHub Strategy
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
          callbackURL: `${env.CLIENT_URL}/api/auth/oauth/github/callback`,
          scope: ["user:email"],
        },
        async (
          _accessToken: string,
          _refreshToken: string,
          profile: {
            emails?: Array<{ value: string }>;
            displayName?: string;
            photos?: Array<{ value: string }>;
          },
          done: (err: Error | null, user?: unknown) => void,
        ) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email found in GitHub profile"));
            }
            const result = await findOrCreateOAuthUser(
              email,
              profile.displayName || null,
              profile.photos?.[0]?.value || null,
              "github",
            );
            done(null, result);
          } catch (err) {
            done(err as Error);
          }
        },
      ),
    );
  }
}
