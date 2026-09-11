import { Router } from "express";

import {
  getBookings,
  getBooking,
  createBooking,
  updateBookingStatus,
  deleteBooking,
} from "../controllers/booking.controller.js";

const router = Router();

router.get(
  "/",
  getBookings
);

router.get(
  "/:id",
  getBooking
);

router.post(
  "/",
  createBooking
);

router.patch(
  "/:id/status",
  updateBookingStatus
);

router.delete(
  "/:id",
  deleteBooking
);

export default router;