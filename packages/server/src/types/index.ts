import type { Request } from "express";

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
}

export interface StatusResponse {
  app: string;
  version: string;
  features: {
    total: number;
    completed: number;
    remaining: number;
    sprints: number;
  };
}

/** Request with authenticated user attached by auth middleware */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

/** Standard API response envelope */
export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
