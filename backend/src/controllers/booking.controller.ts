import { Request, Response } from "express";
import { Booking } from "../models/Booking.js";

// =====================================================
// GET ALL BOOKINGS
// =====================================================

export async function getBookings(
  _req: Request,
  res: Response
) {
  try {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error(
      "Get bookings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Không thể lấy danh sách booking",
    });
  }
}

// =====================================================
// GET ONE BOOKING
// =====================================================

export async function getBooking(
  req: Request,
  res: Response
) {
  try {
    const booking =
      await Booking.findById(
        req.params.id
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Không tìm thấy booking",
      });
    }

    return res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error(
      "Get booking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Không thể lấy booking",
    });
  }
}

// =====================================================
// CREATE BOOKING
// =====================================================

export async function createBooking(
  req: Request,
  res: Response
) {
  try {
    const {
      userId,
      courtId,
      courtName,
      locationId,
      location,
      date,
      startTime,
      endTime,
      totalPrice,
      paymentMethod,
    } = req.body;

    if (
      !userId ||
      !courtId ||
      !courtName ||
      !locationId ||
      !location ||
      !date ||
      !startTime ||
      !endTime ||
      totalPrice === undefined ||
      !paymentMethod
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu thông tin đặt sân",
      });
    }

    if (
      !["transfer", "onsite"].includes(
        paymentMethod
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Phương thức thanh toán không hợp lệ",
      });
    }

    if (totalPrice < 0) {
      return res.status(400).json({
        success: false,
        message:
          "Tổng tiền không hợp lệ",
      });
    }

    // =================================================
    // CHECK TIME CONFLICT
    // =================================================

    const conflict =
      await Booking.findOne({
        courtId,
        date,

        status: {
          $in: [
            "pending",
            "confirmed",
          ],
        },

        startTime: {
          $lt: endTime,
        },

        endTime: {
          $gt: startTime,
        },
      });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message:
          "Khung giờ này đã được đặt hoặc đang được giữ.",
      });
    }

    // =================================================
    // CREATE
    // =================================================

    const booking =
      await Booking.create({
        userId,

        courtId,
        courtName,

        locationId,
        location,

        date,

        startTime,
        endTime,

        totalPrice,

        paymentMethod,

        status: "pending",
      });

    return res.status(201).json({
      success: true,
      message:
        "Đặt sân thành công",
      booking,
    });
  } catch (error) {
    console.error(
      "Create booking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Không thể tạo booking",
    });
  }
}

// =====================================================
// UPDATE STATUS
// =====================================================

export async function updateBookingStatus(
  req: Request,
  res: Response
) {
  try {
    const {
      status,
    } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "completed",
      "cancelled",
    ];

    if (
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Trạng thái booking không hợp lệ",
      });
    }

    const booking =
      await Booking.findByIdAndUpdate(
        req.params.id,
        {
          status,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Không tìm thấy booking",
      });
    }

    return res.json({
      success: true,
      message:
        "Cập nhật trạng thái thành công",
      booking,
    });
  } catch (error) {
    console.error(
      "Update booking status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Không thể cập nhật trạng thái booking",
    });
  }
}

// =====================================================
// DELETE BOOKING
// =====================================================

export async function deleteBooking(
  req: Request,
  res: Response
) {
  try {
    const booking =
      await Booking.findByIdAndDelete(
        req.params.id
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Không tìm thấy booking",
      });
    }

    return res.json({
      success: true,
      message:
        "Xóa booking thành công",
    });
  } catch (error) {
    console.error(
      "Delete booking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Không thể xóa booking",
    });
  }
}