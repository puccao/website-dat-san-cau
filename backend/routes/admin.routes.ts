import { Router } from "express";
import {
  getAdminStats,
  getAllUsers,
  toggleCourtStatus,
} from "../controllers/admin.controller.js";
import { verifyToken, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// All admin routes require token and role: 'admin'
router.get("/stats", verifyToken, requireAdmin, getAdminStats);
router.get("/users", verifyToken, requireAdmin, getAllUsers);
router.post("/court-status", verifyToken, requireAdmin, toggleCourtStatus);

export default router;
