import { Router } from "express";
import {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  addCourt,
  updateCourt,
  deleteCourt,
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

// Admin: Manage courts inside location
router.post("/:id/courts", verifyToken, requireAdmin, addCourt);
router.patch("/:id/courts/:courtId", verifyToken, requireAdmin, updateCourt);
router.put("/:id/courts/:courtId", verifyToken, requireAdmin, updateCourt);
router.delete("/:id/courts/:courtId", verifyToken, requireAdmin, deleteCourt);

export default router;

