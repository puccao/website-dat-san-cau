import { Router } from "express";
import {
  getBookings,
  getMyBookings,
  getBooking,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
} from "../controllers/booking.controller.js";
import {
  verifyToken,
  requireAdmin,
  optionalToken,
} from "../middleware/auth.middleware.js";

const router = Router();

// Get list of bookings (public/user can query by date & court to see occupied slots)
router.get("/", getBookings);

// Get my personal bookings (authenticated user)
router.get("/my", verifyToken, getMyBookings);

// Get single booking by ID or Code
router.get("/:id", getBooking);

// Create a new booking
router.post("/", optionalToken, createBooking);

// Update full booking details (Admin or authorized owner)
router.put("/:id", optionalToken, updateBooking);

// Update status (Admin confirms/cancels, or User cancels their own)
router.patch("/:id/status", optionalToken, updateBookingStatus);

// Delete booking (Admin only)
router.delete("/:id", verifyToken, requireAdmin, deleteBooking);

export default router;

