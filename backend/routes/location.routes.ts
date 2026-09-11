import { Router } from "express";
import {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../controllers/location.controller.js";
import { verifyToken, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// Public: View locations
router.get("/", getLocations);
router.get("/:id", getLocation);

// Admin: Manage locations
router.post("/", verifyToken, requireAdmin, createLocation);
router.put("/:id", verifyToken, requireAdmin, updateLocation);
router.delete("/:id", verifyToken, requireAdmin, deleteLocation);

export default router;
