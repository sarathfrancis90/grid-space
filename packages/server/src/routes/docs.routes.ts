import { Router } from "express";
import type { Request, Response } from "express";
import { apiSuccess } from "../utils/apiResponse";

const router = Router();

interface RouteDoc {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  sprint: string;
}

const apiDocs: RouteDoc[] = [
  // Health
  {
    method: "GET",
    path: "/api/health",
    description: "Health check endpoint",
    auth: false,
    sprint: "S9",
  },
  {
    method: "GET",
    path: "/api/health/status",
    description: "Feature progress status",
    auth: false,
    sprint: "S9",
  },
  {
    method: "GET",
    path: "/api/docs",
    description: "API documentation",
    auth: false,
    sprint: "S9",
  },

  // Spreadsheets
  {
    method: "GET",
    path: "/api/spreadsheets",
    description: "List user's spreadsheets",
    auth: true,
    sprint: "S11",
  },
  {
    method: "GET",
    path: "/api/spreadsheets/:id",
    description: "Get a single spreadsheet with sheets",
    auth: true,
    sprint: "S11",
  },
  {
    method: "POST",
    path: "/api/spreadsheets",
    description: "Create a new spreadsheet",
    auth: true,
    sprint: "S11",
  },
  {
    method: "PUT",
    path: "/api/spreadsheets/:id",
    description: "Update spreadsheet metadata",
    auth: true,
    sprint: "S11",
  },
  {
    method: "DELETE",
    path: "/api/spreadsheets/:id",
    description: "Delete a spreadsheet",
    auth: true,
    sprint: "S11",
  },

  // Sheets
  {
    method: "GET",
    path: "/api/spreadsheets/:id/sheets",
    description: "List sheets in a spreadsheet",
    auth: true,
    sprint: "S11",
  },
  {
    method: "GET",
    path: "/api/spreadsheets/:id/sheets/:sheetId",
    description: "Get a single sheet with cell data",
    auth: true,
    sprint: "S11",
  },
  {
    method: "POST",
    path: "/api/spreadsheets/:id/sheets",
    description: "Add a new sheet to a spreadsheet",
    auth: true,
    sprint: "S11",
  },
  {
    method: "PUT",
    path: "/api/spreadsheets/:id/sheets/:sheetId",
    description: "Update sheet metadata or cell data",
    auth: true,
    sprint: "S11",
  },
  {
    method: "DELETE",
    path: "/api/spreadsheets/:id/sheets/:sheetId",
    description: "Delete a sheet",
    auth: true,
    sprint: "S11",
  },

  // Cells
  {
    method: "GET",
    path: "/api/spreadsheets/:id/sheets/:sheetId/cells",
    description: "Get cell data for a sheet",
    auth: true,
    sprint: "S11",
  },
  {
    method: "PUT",
    path: "/api/spreadsheets/:id/sheets/:sheetId/cells",
    description: "Update cells in a sheet",
    auth: true,
    sprint: "S11",
  },

  // Auth (Sprint 10)
  {
    method: "POST",
    path: "/api/auth/register",
    description: "Register a new user",
    auth: false,
    sprint: "S10",
  },
  {
    method: "POST",
    path: "/api/auth/login",
    description: "Login with email and password",
    auth: false,
    sprint: "S10",
  },
  {
    method: "POST",
    path: "/api/auth/refresh",
    description: "Refresh access token",
    auth: false,
    sprint: "S10",
  },
  {
    method: "GET",
    path: "/api/users/me",
    description: "Get current user profile",
    auth: true,
    sprint: "S10",
  },

  // Sharing (Sprint 12)
  {
    method: "POST",
    path: "/api/spreadsheets/:id/share",
    description: "Share a spreadsheet with a user",
    auth: true,
    sprint: "S12",
  },
  {
    method: "DELETE",
    path: "/api/spreadsheets/:id/share/:userId",
    description: "Remove a user's access",
    auth: true,
    sprint: "S12",
  },

  // Versions (Sprint 13)
  {
    method: "GET",
    path: "/api/spreadsheets/:id/versions",
    description: "List version history",
    auth: true,
    sprint: "S13",
  },

  // Public API (Sprint 16)
  {
    method: "GET",
    path: "/api/v1/spreadsheets/:id",
    description: "Public API: Read spreadsheet (API key auth)",
    auth: true,
    sprint: "S16",
  },
  {
    method: "GET",
    path: "/api/v1/spreadsheets/:id/sheets",
    description: "Public API: List sheets (API key auth)",
    auth: true,
    sprint: "S16",
  },
  {
    method: "GET",
    path: "/api/v1/spreadsheets/:id/sheets/:sheetId/cells",
    description: "Public API: Read cells (API key auth)",
    auth: true,
    sprint: "S16",
  },
  {
    method: "PUT",
    path: "/api/v1/spreadsheets/:id/sheets/:sheetId/cells",
    description: "Public API: Write cells (API key auth)",
    auth: true,
    sprint: "S16",
  },
  {
    method: "GET",
    path: "/api/v1/spreadsheets/:id/export/:format",
    description: "Public API: Export (csv/xlsx/pdf) (API key auth)",
    auth: true,
    sprint: "S16",
  },

  // API Keys (Sprint 16)
  {
    method: "GET",
    path: "/api/users/me/api-keys",
    description: "List API keys",
    auth: true,
    sprint: "S16",
  },
  {
    method: "POST",
    path: "/api/users/me/api-keys",
    description: "Create API key",
    auth: true,
    sprint: "S16",
  },
  {
    method: "DELETE",
    path: "/api/users/me/api-keys/:keyId",
    description: "Revoke API key",
    auth: true,
    sprint: "S16",
  },

  // Webhooks (Sprint 16)
  {
    method: "GET",
    path: "/api/webhooks",
    description: "List webhooks",
    auth: true,
    sprint: "S16",
  },
  {
    method: "POST",
    path: "/api/webhooks",
    description: "Create webhook",
    auth: true,
    sprint: "S16",
  },
  {
    method: "PUT",
    path: "/api/webhooks/:webhookId",
    description: "Update webhook",
    auth: true,
    sprint: "S16",
  },
  {
    method: "DELETE",
    path: "/api/webhooks/:webhookId",
    description: "Delete webhook",
    auth: true,
    sprint: "S16",
  },
];

router.get("/", (_req: Request, res: Response) => {
  res.json(
    apiSuccess({
      title: "GridSpace API",
      version: "0.1.0",
      description: "Production-ready Google Sheets replacement API",
      endpoints: apiDocs,
      totalEndpoints: apiDocs.length,
    }),
  );
});

// GET /api/docs/openapi — OpenAPI 3.0 spec (Swagger UI compatible)
router.get("/openapi", (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "GridSpace Public API",
    version: "1.0.0",
    description:
      "Public REST API for programmatic access to GridSpace spreadsheets. Authenticate with an API key in the X-API-Key header.",
  },
  servers: [{ url: "/api/v1", description: "Public API v1" }],
  security: [{ ApiKeyAuth: [] }],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "API key prefixed with gs_",
      },
    },
    schemas: {
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "integer" },
              message: { type: "string" },
            },
          },
        },
      },
      CellUpdate: {
        type: "object",
        properties: {
          cell: { type: "string", example: "A1" },
          value: { example: 42 },
        },
        required: ["cell", "value"],
      },
    },
  },
  paths: {
    "/spreadsheets/{id}": {
      get: {
        summary: "Read spreadsheet",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { "200": { description: "Spreadsheet data" } },
      },
    },
    "/spreadsheets/{id}/sheets": {
      get: {
        summary: "List sheets",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { "200": { description: "List of sheets" } },
      },
    },
    "/spreadsheets/{id}/sheets/{sheetId}/cells": {
      get: {
        summary: "Read cells",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "sheetId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "range",
            in: "query",
            schema: { type: "string" },
            description: "Cell range (e.g. A1:C3)",
          },
        ],
        responses: { "200": { description: "Cell data" } },
      },
      put: {
        summary: "Write cells",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "sheetId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  cells: {
                    type: "array",
                    items: { $ref: "#/components/schemas/CellUpdate" },
                  },
                },
                required: ["cells"],
              },
            },
          },
        },
        responses: { "200": { description: "Update result" } },
      },
    },
    "/spreadsheets/{id}/export/{format}": {
      get: {
        summary: "Export spreadsheet",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "format",
            in: "path",
            required: true,
            schema: { type: "string", enum: ["csv", "xlsx", "pdf"] },
          },
        ],
        responses: { "200": { description: "Exported file" } },
      },
    },
  },
};

export default router;
