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
