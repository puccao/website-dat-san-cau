import { Request, Response } from "express";
import { Booking } from "../models/Booking.js";
import {
  isDbConnected,
  memoryBookings,
  memoryLocations,
  generateId,
} from "../config/memoryStore.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

// Helper: Convert "HH:mm" to minutes from midnight
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// Calculate duration and price based on regular (06:00-16:00) and peak (16:00-22:00) hours
function calculatePriceAndHours(
  startTime: string,
  endTime: string,
  courtRegularPrice: number = 80000,
  courtPeakPrice: number = 120000
) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const durationMin = endMin - startMin;
  const durationHours = durationMin / 60;

  // Peak starts at 16:00 = 960 minutes
  const peakStartMin = 16 * 60;

  let regularMinutes = 0;
  let peakMinutes = 0;

  // Step through each 1-minute slice or check interval
  for (let m = startMin; m < endMin; m++) {
    if (m >= peakStartMin) {
      peakMinutes++;
    } else {
      regularMinutes++;
    }
  }

  const regularHours = Math.round((regularMinutes / 60) * 10) / 10;
  const peakHours = Math.round((peakMinutes / 60) * 10) / 10;

  const totalPrice = Math.round(
    (regularMinutes / 60) * courtRegularPrice + (peakMinutes / 60) * courtPeakPrice
  );

  return {
    durationHours,
    regularHours,
    peakHours,
    totalPrice,
  };
}

// Generate unique booking code
function generateBookingCode(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `BC-${year}-${randomNum}`;
}

// =====================================================
// GET ALL BOOKINGS (Supports filters)
// =====================================================
export async function getBookings(req: Request, res: Response) {
  try {
    const { date, locationId, courtId, status, userId } = req.query;

    if (!isDbConnected()) {
      let filtered = [...memoryBookings];

      if (date) {
        filtered = filtered.filter((b) => b.date === String(date));
      }
      if (locationId) {
        filtered = filtered.filter((b) => b.locationId === String(locationId));
      }
      if (courtId) {
        filtered = filtered.filter((b) => b.courtId === String(courtId));
      }
      if (status) {
        filtered = filtered.filter((b) => b.status === String(status));
      }
      if (userId) {
        filtered = filtered.filter((b) => b.userId === String(userId));
      }

      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return res.json({ success: true, count: filtered.length, bookings: filtered });
    }

    const query: any = {};
    if (date) query.date = date;
    if (locationId) query.locationId = locationId;
    if (courtId) query.courtId = courtId;
    if (status) query.status = status;
    if (userId) query.userId = userId;

    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    console.error("Get bookings error:", error);
    return res.status(500).json({ success: false, message: "Lỗi lấy danh sách đặt sân" });
  }
}

// =====================================================
// GET MY BOOKINGS (Logged-in User)
// =====================================================
export async function getMyBookings(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId || (req.query.userId as string);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Vui lòng đăng nhập" });
    }

    if (!isDbConnected()) {
      const myBookings = memoryBookings
        .filter((b) => b.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return res.json({ success: true, bookings: myBookings });
    }

    const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });
    return res.json({ success: true, bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi tải lịch sử đặt sân" });
  }
}

// =====================================================
// GET SINGLE BOOKING
// =====================================================
export async function getBooking(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      const b = memoryBookings.find((item) => item._id === id || item.bookingCode === id);
      if (!b) {
        return res.status(404).json({ success: false, message: "Không tìm thấy thông tin vé đặt" });
      }
      return res.json({ success: true, booking: b });
    }

    const booking = await Booking.findOne({
      $or: [{ _id: id }, { bookingCode: id }],
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông tin vé đặt" });
    }

    return res.json({ success: true, booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi truy vấn đơn đặt" });
  }
}

// =====================================================
// CREATE BOOKING (Strict Validation & Conflict Check)
// =====================================================
export async function createBooking(req: AuthRequest, res: Response) {
  try {
    const {
      courtId,
      courtName,
      locationId,
      location,
      date,
      startTime,
      endTime,
      customerName,
      customerPhone,
      paymentMethod = "transfer",
      note = "",
    } = req.body;

    const userId = req.user?.userId || req.body.userId || "guest_user";

    // 1. Check required fields
    if (!courtId || !locationId || !date || !startTime || !endTime || !customerName || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin: họ tên, số điện thoại, ngày, sân và khung giờ chơi",
      });
    }

    // 2. Validate time format & interval
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);

    if (isNaN(startMin) || isNaN(endMin)) {
      return res.status(400).json({
        success: false,
        message: "Định dạng giờ không hợp lệ (đúng chuẩn HH:mm)",
      });
    }

    if (startMin >= endMin) {
      return res.status(400).json({
        success: false,
        message: "Giờ bắt đầu phải trước giờ kết thúc",
      });
    }

    // Operating hours 06:00 to 22:00
    if (startMin < 6 * 60 || endMin > 22 * 60) {
      return res.status(400).json({
        success: false,
        message: "Sân chỉ hoạt động từ 06:00 đến 22:00 hàng ngày",
      });
    }

    // Minimum 30 mins
    if (endMin - startMin < 30) {
      return res.status(400).json({
        success: false,
        message: "Thời lượng chơi tối thiểu là 30 phút",
      });
    }

    // 3. Determine pricing rate for this location & court
    let regularPrice = 80000;
    let peakPrice = 120000;

    const targetLoc = memoryLocations.find((l) => l._id === locationId);
    if (targetLoc) {
      const court = targetLoc.courts?.find((c) => c.id === courtId);
      if (court) {
        regularPrice = court.regularPrice;
        peakPrice = court.peakPrice;
      }
    }

    const pricing = calculatePriceAndHours(startTime, endTime, regularPrice, peakPrice);

    // 4. Overlap Conflict Checking (Strict logic!)
    // An active booking conflicts if: existing.startTime < requested.endTime && existing.endTime > requested.startTime
    if (!isDbConnected()) {
      const conflict = memoryBookings.find(
        (b) =>
          b.courtId === courtId &&
          b.locationId === locationId &&
          b.date === date &&
          ["pending", "confirmed"].includes(b.status) &&
          b.startTime < endTime &&
          b.endTime > startTime
      );

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: `Khung giờ ${startTime} - ${endTime} tại sân đã bị trùng với đơn đặt trước (${conflict.startTime} - ${conflict.endTime}). Vui lòng chọn khung giờ khác!`,
        });
      }

      const bookingCode = generateBookingCode();
      const newBooking = {
        _id: generateId(),
        bookingCode,
        userId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        courtId,
        courtName: courtName || "Sân Cầu Lông",
        locationId,
        location: location || "Cơ sở Cầu Lông",
        date,
        startTime,
        endTime,
        durationHours: pricing.durationHours,
        regularHours: pricing.regularHours,
        peakHours: pricing.peakHours,
        totalPrice: pricing.totalPrice,
        paymentMethod: paymentMethod === "onsite" ? "onsite" : "transfer",
        status: "pending" as const,
        note: note?.trim() || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      memoryBookings.unshift(newBooking);

      return res.status(201).json({
        success: true,
        message: "Đặt sân thành công! Đơn đặt đang chờ duyệt/xác nhận.",
        booking: newBooking,
      });
    }

    // MongoDB query
    const conflict = await Booking.findOne({
      courtId,
      locationId,
      date,
      status: { $in: ["pending", "confirmed"] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `Khung giờ ${startTime} - ${endTime} tại sân đã bị trùng với đơn đặt trước (${conflict.startTime} - ${conflict.endTime}). Vui lòng chọn khung giờ khác!`,
      });
    }

    const bookingCode = generateBookingCode();
    const booking = await Booking.create({
      bookingCode,
      userId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      courtId,
      courtName: courtName || "Sân Cầu Lông",
      locationId,
      location: location || "Cơ sở Cầu Lông",
      date,
      startTime,
      endTime,
      durationHours: pricing.durationHours,
      regularHours: pricing.regularHours,
      peakHours: pricing.peakHours,
      totalPrice: pricing.totalPrice,
      paymentMethod: paymentMethod === "onsite" ? "onsite" : "transfer",
      status: "pending",
      note: note?.trim() || "",
    });

    return res.status(201).json({
      success: true,
      message: "Đặt sân thành công! Đơn đặt đang chờ duyệt/xác nhận.",
      booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống khi tạo đơn đặt sân" });
  }
}

// =====================================================
// UPDATE FULL BOOKING (Admin edit or reschedule)
// =====================================================
export async function updateBooking(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const {
      customerName,
      customerPhone,
      courtId,
      courtName,
      locationId,
      location,
      date,
      startTime,
      endTime,
      paymentMethod,
      status,
      note,
    } = req.body;

    if (!isDbConnected()) {
      const idx = memoryBookings.findIndex((b) => b._id === id || b.bookingCode === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt sân" });
      }

      const booking = memoryBookings[idx];

      const targetCourtId = courtId || booking.courtId;
      const targetLocId = locationId || booking.locationId;
      const targetDate = date || booking.date;
      const targetStart = startTime || booking.startTime;
      const targetEnd = endTime || booking.endTime;

      // Check conflict if date/court/time changed
      if (
        (targetCourtId !== booking.courtId ||
          targetDate !== booking.date ||
          targetStart !== booking.startTime ||
          targetEnd !== booking.endTime) &&
        ["pending", "confirmed"].includes(status || booking.status)
      ) {
        const conflict = memoryBookings.find(
          (b) =>
            b._id !== booking._id &&
            b.courtId === targetCourtId &&
            b.date === targetDate &&
            ["pending", "confirmed"].includes(b.status) &&
            b.startTime < targetEnd &&
            b.endTime > targetStart
        );
        if (conflict) {
          return res.status(409).json({
            success: false,
            message: `Khung giờ ${targetStart} - ${targetEnd} đã bị trùng với đơn ${conflict.bookingCode}`,
          });
        }
      }

      // Re-calculate price if time or court changed
      let regPrice = 80000;
      let peakPrice = 120000;
      const loc = memoryLocations.find((l) => l._id === targetLocId);
      if (loc) {
        const c = loc.courts.find((item) => item.id === targetCourtId);
        if (c) {
          regPrice = c.regularPrice;
          peakPrice = c.peakPrice;
        }
      }

      const pricing = calculatePriceAndHours(targetStart, targetEnd, regPrice, peakPrice);

      if (customerName) booking.customerName = customerName.trim();
      if (customerPhone) booking.customerPhone = customerPhone.trim();
      if (courtId) booking.courtId = courtId;
      if (courtName) booking.courtName = courtName;
      if (locationId) booking.locationId = locationId;
      if (location) booking.location = location;
      booking.date = targetDate;
      booking.startTime = targetStart;
      booking.endTime = targetEnd;
      booking.durationHours = pricing.durationHours;
      booking.regularHours = pricing.regularHours;
      booking.peakHours = pricing.peakHours;
      booking.totalPrice = pricing.totalPrice;
      if (paymentMethod) booking.paymentMethod = paymentMethod;
      if (status) booking.status = status;
      if (note !== undefined) booking.note = note;
      booking.updatedAt = new Date();

      return res.json({
        success: true,
        message: "Cập nhật đơn đặt sân thành công",
        booking,
      });
    }

    const booking = await Booking.findOne({
      $or: [{ _id: id }, { bookingCode: id }],
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt sân" });
    }

    const targetCourtId = courtId || booking.courtId;
    const targetLocId = locationId || booking.locationId;
    const targetDate = date || booking.date;
    const targetStart = startTime || booking.startTime;
    const targetEnd = endTime || booking.endTime;

    if (
      (targetCourtId !== booking.courtId ||
        targetDate !== booking.date ||
        targetStart !== booking.startTime ||
        targetEnd !== booking.endTime) &&
      ["pending", "confirmed"].includes(status || booking.status)
    ) {
      const conflict = await Booking.findOne({
        _id: { $ne: booking._id },
        courtId: targetCourtId,
        date: targetDate,
        status: { $in: ["pending", "confirmed"] },
        startTime: { $lt: targetEnd },
        endTime: { $gt: targetStart },
      });
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: `Khung giờ ${targetStart} - ${targetEnd} đã bị trùng với đơn ${conflict.bookingCode}`,
        });
      }
    }

    let regPrice = 80000;
    let peakPrice = 120000;
    const loc = await Location.findById(targetLocId);
    if (loc) {
      const c = loc.courts.find((item: any) => item.id === targetCourtId);
      if (c) {
        regPrice = c.regularPrice;
        peakPrice = c.peakPrice;
      }
    }

    const pricing = calculatePriceAndHours(targetStart, targetEnd, regPrice, peakPrice);

    if (customerName) booking.customerName = customerName.trim();
    if (customerPhone) booking.customerPhone = customerPhone.trim();
    if (courtId) booking.courtId = courtId;
    if (courtName) booking.courtName = courtName;
    if (locationId) booking.locationId = locationId;
    if (location) booking.location = location;
    booking.date = targetDate;
    booking.startTime = targetStart;
    booking.endTime = targetEnd;
    booking.durationHours = pricing.durationHours;
    booking.regularHours = pricing.regularHours;
    booking.peakHours = pricing.peakHours;
    booking.totalPrice = pricing.totalPrice;
    if (paymentMethod) booking.paymentMethod = paymentMethod;
    if (status) booking.status = status;
    if (note !== undefined) booking.note = note;

    await booking.save();

    return res.json({
      success: true,
      message: "Cập nhật đơn đặt sân thành công",
      booking,
    });
  } catch (error) {
    console.error("Update booking error:", error);
    return res.status(500).json({ success: false, message: "Lỗi cập nhật đơn đặt sân" });
  }
}

// =====================================================
// UPDATE BOOKING STATUS (Admin or User cancel)
// =====================================================
export async function updateBookingStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const allowedStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái cập nhật không hợp lệ",
      });
    }

    const currentUser = req.user;

    if (!isDbConnected()) {
      const idx = memoryBookings.findIndex((b) => b._id === id || b.bookingCode === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt sân" });
      }

      // Check permission: Non-admin users can ONLY cancel their own booking
      if (currentUser && currentUser.role !== "admin") {
        if (memoryBookings[idx].userId !== currentUser.userId) {
          return res.status(403).json({ success: false, message: "Bạn không có quyền sửa đơn đặt này" });
        }
        if (status !== "cancelled") {
          return res.status(403).json({ success: false, message: "Người dùng chỉ có quyền hủy đơn đặt của mình" });
        }
      }

      memoryBookings[idx].status = status;
      if (note) memoryBookings[idx].note = note;
      memoryBookings[idx].updatedAt = new Date();

      return res.json({
        success: true,
        message: `Đã cập nhật trạng thái đơn thành ${status}`,
        booking: memoryBookings[idx],
      });
    }

    const booking = await Booking.findOne({
      $or: [{ _id: id }, { bookingCode: id }],
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt sân" });
    }

    // User permissions check
    if (currentUser && currentUser.role !== "admin") {
      if (booking.userId !== currentUser.userId) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền sửa đơn đặt này" });
      }
      if (status !== "cancelled") {
        return res.status(403).json({ success: false, message: "Người dùng chỉ có quyền hủy đơn đặt của mình" });
      }
    }

    booking.status = status;
    if (note) booking.note = note;
    await booking.save();

    return res.json({
      success: true,
      message: `Đã cập nhật trạng thái đơn thành ${status}`,
      booking,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi cập nhật trạng thái đơn đặt" });
  }
}

// =====================================================
// DELETE BOOKING (Admin only)
// =====================================================
export async function deleteBooking(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      const idx = memoryBookings.findIndex((b) => b._id === id || b.bookingCode === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt" });
      }
      memoryBookings.splice(idx, 1);
      return res.json({ success: true, message: "Xóa đơn đặt sân thành công" });
    }

    const deleted = await Booking.findOneAndDelete({
      $or: [{ _id: id }, { bookingCode: id }],
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt" });
    }

    return res.json({ success: true, message: "Xóa đơn đặt sân thành công" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Không thể xóa đơn đặt" });
  }
}
