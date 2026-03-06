import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../config/env";
import {
  oauthGithubCallback,
  oauthGoogleCallback,
} from "../controllers/auth.controller";

const { authenticateMock } = vi.hoisted(() => ({
  authenticateMock: vi.fn(),
}));

vi.mock("passport", () => ({
  default: {
    authenticate: authenticateMock,
  },
}));

interface OAuthResult {
  user: { id: string };
  tokens: { accessToken: string; refreshToken: string };
}

type OAuthDone = (err: Error | null, result: OAuthResult | false) => void;
type PassportMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;
type AuthenticateFn = (
  strategy: string,
  options: { session: false },
  done: OAuthDone,
) => PassportMiddleware;

function mockPassportOAuthSuccess(result: OAuthResult): void {
  authenticateMock.mockImplementation(
    ((_: string, __: { session: false }, done: OAuthDone) =>
      (_req: Request, _res: Response, _next: NextFunction): void => {
        done(null, result);
      }) as AuthenticateFn,
  );
}

function createMockResponse(): Response {
  return {
    cookie: vi.fn(),
    redirect: vi.fn(),
  } as unknown as Response;
}

describe("OAuth callback redirects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects Google callback to /oauth/callback with access token", () => {
    mockPassportOAuthSuccess({
      user: { id: "user-google" },
      tokens: { accessToken: "google-access-token", refreshToken: "refresh" },
    });

    const req = {} as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    oauthGoogleCallback(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(
      `${env.CLIENT_URL}/oauth/callback?token=google-access-token`,
    );
  });

  it("redirects GitHub callback to /oauth/callback with access token", () => {
    mockPassportOAuthSuccess({
      user: { id: "user-github" },
      tokens: { accessToken: "github-access-token", refreshToken: "refresh" },
    });

    const req = {} as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    oauthGithubCallback(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(
      `${env.CLIENT_URL}/oauth/callback?token=github-access-token`,
    );
  });
});
