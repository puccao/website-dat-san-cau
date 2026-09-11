import { Request, Response } from "express";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import { Location } from "../models/Location.js";
import {
  isDbConnected,
  memoryBookings,
  memoryUsers,
  memoryLocations,
} from "../config/memoryStore.js";

export async function getAdminStats(_req: Request, res: Response) {
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    if (!isDbConnected()) {
      const allBookings = memoryBookings;

      const totalRevenue = allBookings
        .filter((b) => ["confirmed", "completed"].includes(b.status))
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

      const todayBookings = allBookings.filter((b) => b.date === todayStr);
      const todayRevenue = todayBookings
        .filter((b) => ["confirmed", "completed"].includes(b.status))
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

      const pendingCount = allBookings.filter((b) => b.status === "pending").length;
      const confirmedCount = allBookings.filter((b) => b.status === "confirmed").length;
      const completedCount = allBookings.filter((b) => b.status === "completed").length;
      const cancelledCount = allBookings.filter((b) => b.status === "cancelled").length;

      // Calculate court utilization today (assuming 16 operating hours: 06:00 to 22:00 per court, total 12 courts across 3 locations)
      const totalCourtHoursAvailable = 12 * 16;
      const todayBookedHours = todayBookings
        .filter((b) => ["confirmed", "completed", "pending"].includes(b.status))
        .reduce((sum, b) => sum + (b.durationHours || 1), 0);
      const utilizationRate = Math.min(
        100,
        Math.round((todayBookedHours / totalCourtHoursAvailable) * 100)
      );

      return res.json({
        success: true,
        stats: {
          totalRevenue,
          todayRevenue,
          totalBookings: allBookings.length,
          todayBookingsCount: todayBookings.length,
          pendingCount,
          confirmedCount,
          completedCount,
          cancelledCount,
          utilizationRate,
          totalUsers: memoryUsers.length,
          totalLocations: memoryLocations.length,
        },
      });
    }

    const allBookings = await Booking.find();
    const totalUsers = await User.countDocuments();
    const totalLocations = await Location.countDocuments();

    const totalRevenue = allBookings
      .filter((b) => ["confirmed", "completed"].includes(b.status))
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const todayBookings = allBookings.filter((b) => b.date === todayStr);
    const todayRevenue = todayBookings
      .filter((b) => ["confirmed", "completed"].includes(b.status))
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const pendingCount = allBookings.filter((b) => b.status === "pending").length;
    const confirmedCount = allBookings.filter((b) => b.status === "confirmed").length;
    const completedCount = allBookings.filter((b) => b.status === "completed").length;
    const cancelledCount = allBookings.filter((b) => b.status === "cancelled").length;

    const totalCourtHoursAvailable = 12 * 16;
    const todayBookedHours = todayBookings
      .filter((b) => ["confirmed", "completed", "pending"].includes(b.status))
      .reduce((sum, b) => sum + (b.durationHours || 1), 0);
    const utilizationRate = Math.min(
      100,
      Math.round((todayBookedHours / totalCourtHoursAvailable) * 100)
    );

    return res.json({
      success: true,
      stats: {
        totalRevenue,
        todayRevenue,
        totalBookings: allBookings.length,
        todayBookingsCount: todayBookings.length,
        pendingCount,
        confirmedCount,
        completedCount,
        cancelledCount,
        utilizationRate,
        totalUsers,
        totalLocations,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({ success: false, message: "Lỗi tải thống kê" });
  }
}

export async function getAllUsers(_req: Request, res: Response) {
  try {
    if (!isDbConnected()) {
      const users = memoryUsers.map((u) => {
        const userBookings = memoryBookings.filter((b) => b.userId === u._id);
        return {
          id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone || "Chưa cập nhật",
          role: u.role,
          bookingCount: userBookings.length,
          totalSpent: userBookings
            .filter((b) => ["confirmed", "completed"].includes(b.status))
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0),
          createdAt: u.createdAt,
        };
      });
      return res.json({ success: true, users });
    }

    const users = await User.find().select("-password");
    return res.json({
      success: true,
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone || "Chưa cập nhật",
        role: u.role,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi tải danh sách người dùng" });
  }
}

export async function toggleCourtStatus(req: Request, res: Response) {
  try {
    const { locationId, courtId, status, regularPrice, peakPrice } = req.body;

    if (!locationId || !courtId) {
      return res.status(400).json({ success: false, message: "Thiếu locationId hoặc courtId" });
    }

    if (!isDbConnected()) {
      const loc = memoryLocations.find((l) => l._id === locationId);
      if (!loc) {
        return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
      }

      const court = loc.courts.find((c) => c.id === courtId);
      if (!court) {
        return res.status(404).json({ success: false, message: "Không tìm thấy sân" });
      }

      if (status) court.status = status;
      if (regularPrice !== undefined) court.regularPrice = regularPrice;
      if (peakPrice !== undefined) court.peakPrice = peakPrice;
      loc.updatedAt = new Date();

      return res.json({ success: true, message: "Cập nhật sân thành công", court });
    }

    const loc = await Location.findById(locationId);
    if (!loc) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cơ sở" });
    }

    const court = loc.courts.find((c: any) => c.id === courtId);
    if (!court) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sân" });
    }

    if (status) court.status = status;
    if (regularPrice !== undefined) court.regularPrice = regularPrice;
    if (peakPrice !== undefined) court.peakPrice = peakPrice;
    await loc.save();

    return res.json({ success: true, message: "Cập nhật sân thành công", court });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi cập nhật sân" });
  }
}
