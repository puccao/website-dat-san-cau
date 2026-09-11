import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import { Location } from "../models/Location.js";
import {
  isDbConnected,
  memoryBookings,
  memoryUsers,
  memoryLocations,
  generateId,
} from "../config/memoryStore.js";

// Helper: Format date string YYYY-MM-DD
function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export async function getAdminStats(_req: Request, res: Response) {
  try {
    const today = new Date();
    const todayStr = formatDate(today);
    const currentMonth = todayStr.slice(0, 7); // YYYY-MM

    // Generate last 7 days keys
    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      last7Days.push(formatDate(d));
    }

    let allBookings: any[] = [];
    let allUsersCount = 0;
    let allLocationsCount = 0;
    let allCourtsCount = 0;

    if (!isDbConnected()) {
      allBookings = memoryBookings;
      allUsersCount = memoryUsers.length;
      allLocationsCount = memoryLocations.length;
      allCourtsCount = memoryLocations.reduce((sum, l) => sum + (l.courts?.length || 0), 0);
    } else {
      allBookings = await Booking.find().lean();
      allUsersCount = await User.countDocuments();
      const locations = await Location.find().lean();
      allLocationsCount = locations.length;
      allCourtsCount = locations.reduce((sum, l) => sum + (l.courts?.length || 0), 0);
    }

    // Revenue calculations
    const validBookings = allBookings.filter((b) =>
      ["confirmed", "completed"].includes(b.status)
    );

    const totalRevenue = validBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const todayBookings = allBookings.filter((b) => b.date === todayStr);
    const todayRevenue = todayBookings
      .filter((b) => ["confirmed", "completed"].includes(b.status))
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const monthBookings = allBookings.filter((b) => b.date?.startsWith(currentMonth));
    const monthRevenue = monthBookings
      .filter((b) => ["confirmed", "completed"].includes(b.status))
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const avgBookingValue =
      validBookings.length > 0 ? Math.round(totalRevenue / validBookings.length) : 0;

    // Counts by status
    const pendingCount = allBookings.filter((b) => b.status === "pending").length;
    const confirmedCount = allBookings.filter((b) => b.status === "confirmed").length;
    const completedCount = allBookings.filter((b) => b.status === "completed").length;
    const cancelledCount = allBookings.filter((b) => b.status === "cancelled").length;

    // Court utilization today
    const totalCourtHoursAvailable = Math.max(1, allCourtsCount * 16); // 16 hours/day (06:00-22:00)
    const todayBookedHours = todayBookings
      .filter((b) => ["confirmed", "completed", "pending"].includes(b.status))
      .reduce((sum, b) => sum + (b.durationHours || 1), 0);
    const utilizationRate = Math.min(
      100,
      Math.round((todayBookedHours / totalCourtHoursAvailable) * 100)
    );

    // 7-day revenue trend
    const dailyRevenue = last7Days.map((dateStr) => {
      const dayBookings = allBookings.filter(
        (b) => b.date === dateStr && ["confirmed", "completed"].includes(b.status)
      );
      const rev = dayBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      return {
        date: dateStr,
        revenue: rev,
        bookingsCount: dayBookings.length,
      };
    });

    // Time-slot distribution
    const timeSlots = [
      { slot: "06:00-09:00", label: "Sáng sớm (06h - 09h)", count: 0 },
      { slot: "09:00-12:00", label: "Buổi trưa (09h - 12h)", count: 0 },
      { slot: "12:00-16:00", label: "Đầu chiều (12h - 16h)", count: 0 },
      { slot: "16:00-19:00", label: "Giờ vàng 1 (16h - 19h)", count: 0 },
      { slot: "19:00-22:00", label: "Giờ vàng 2 (19h - 22h)", count: 0 },
    ];

    allBookings.forEach((b) => {
      const startH = parseInt(b.startTime?.split(":")[0] || "0", 10);
      if (startH >= 6 && startH < 9) timeSlots[0].count++;
      else if (startH >= 9 && startH < 12) timeSlots[1].count++;
      else if (startH >= 12 && startH < 16) timeSlots[2].count++;
      else if (startH >= 16 && startH < 19) timeSlots[3].count++;
      else if (startH >= 19 && startH <= 22) timeSlots[4].count++;
    });

    return res.json({
      success: true,
      stats: {
        totalRevenue,
        todayRevenue,
        monthRevenue,
        avgBookingValue,
        totalBookings: allBookings.length,
        todayBookingsCount: todayBookings.length,
        pendingCount,
        confirmedCount,
        completedCount,
        cancelledCount,
        utilizationRate,
        totalUsers: allUsersCount,
        totalLocations: allLocationsCount,
        totalCourts: allCourtsCount,
        dailyRevenue,
        timeSlots,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({ success: false, message: "Lỗi tải thống kê hệ thống" });
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

    const users = await User.find().select("-password").sort({ createdAt: -1 });
    const allBookings = await Booking.find().lean();

    const formattedUsers = users.map((u) => {
      const userBookings = allBookings.filter(
        (b) => b.userId === u._id.toString() || b.customerPhone === u.phone
      );
      return {
        id: u._id.toString(),
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

    return res.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ success: false, message: "Lỗi tải danh sách người dùng" });
  }
}

// User CRUD: Create
export async function createUser(req: Request, res: Response) {
  try {
    const { name, email, password, phone, role = "user" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!isDbConnected()) {
      const existing = memoryUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return res.status(409).json({ success: false, message: "Email này đã được sử dụng" });
      }

      const newUser = {
        _id: generateId(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone?.trim() || "",
        role: role === "admin" ? ("admin" as const) : ("user" as const),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      memoryUsers.unshift(newUser);

      return res.status(201).json({
        success: true,
        message: "Tạo người dùng mới thành công",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          bookingCount: 0,
          totalSpent: 0,
          createdAt: newUser.createdAt,
        },
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email này đã được sử dụng" });
    }

    const created = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone?.trim() || "",
      role: role === "admin" ? "admin" : "user",
    });

    return res.status(201).json({
      success: true,
      message: "Tạo người dùng mới thành công",
      user: {
        id: created._id.toString(),
        name: created.name,
        email: created.email,
        phone: created.phone,
        role: created.role,
        bookingCount: 0,
        totalSpent: 0,
        createdAt: created.createdAt,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({ success: false, message: "Lỗi thêm người dùng" });
  }
}

// User CRUD: Update
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, phone, role, password } = req.body;

    if (!isDbConnected()) {
      const idx = memoryUsers.findIndex((u) => u._id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
      }

      if (name) memoryUsers[idx].name = name.trim();
      if (phone !== undefined) memoryUsers[idx].phone = phone.trim();
      if (role && ["user", "admin"].includes(role)) memoryUsers[idx].role = role;
      if (password && password.trim().length >= 6) {
        memoryUsers[idx].password = bcrypt.hashSync(password, 10);
      }
      memoryUsers[idx].updatedAt = new Date();

      return res.json({
        success: true,
        message: "Cập nhật thông tin hội viên thành công",
        user: {
          id: memoryUsers[idx]._id,
          name: memoryUsers[idx].name,
          email: memoryUsers[idx].email,
          phone: memoryUsers[idx].phone,
          role: memoryUsers[idx].role,
        },
      });
    }

    const updateFields: any = {};
    if (name) updateFields.name = name.trim();
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (role && ["user", "admin"].includes(role)) updateFields.role = role;
    if (password && password.trim().length >= 6) {
      updateFields.password = await bcrypt.hash(password, 10);
    }

    const updated = await User.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    return res.json({
      success: true,
      message: "Cập nhật thông tin hội viên thành công",
      user: {
        id: updated._id.toString(),
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ success: false, message: "Lỗi cập nhật người dùng" });
  }
}

// User CRUD: Delete
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      const idx = memoryUsers.findIndex((u) => u._id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
      }

      // Prevent deleting the root admin
      if (memoryUsers[idx].email === "admin@badminton.vn") {
        return res.status(403).json({
          success: false,
          message: "Không thể xóa tài khoản Quản trị viên mặc định của hệ thống",
        });
      }

      memoryUsers.splice(idx, 1);
      return res.json({ success: true, message: "Đã xóa người dùng thành công" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    if (user.email === "admin@badminton.vn") {
      return res.status(403).json({
        success: false,
        message: "Không thể xóa tài khoản Quản trị viên mặc định của hệ thống",
      });
    }

    await User.findByIdAndDelete(id);
    return res.json({ success: true, message: "Đã xóa người dùng thành công" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ success: false, message: "Lỗi xóa người dùng" });
  }
}

// Court status & price toggle
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
