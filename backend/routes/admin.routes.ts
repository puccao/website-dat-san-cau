import { Router } from "express";
import {
  getAdminStats,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleCourtStatus,
} from "../controllers/admin.controller.js";
import { verifyToken, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// All admin routes require token and role: 'admin'
router.get("/stats", verifyToken, requireAdmin, getAdminStats);

// User CRUD
router.get("/users", verifyToken, requireAdmin, getAllUsers);
router.post("/users", verifyToken, requireAdmin, createUser);
router.put("/users/:id", verifyToken, requireAdmin, updateUser);
router.delete("/users/:id", verifyToken, requireAdmin, deleteUser);

// Court maintenance and pricing
router.post("/court-status", verifyToken, requireAdmin, toggleCourtStatus);

export default router;

