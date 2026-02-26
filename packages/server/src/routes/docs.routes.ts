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

export default router;
