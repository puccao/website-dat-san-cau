import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import {
  isDbConnected,
  memoryUsers,
  generateId,
} from "../config/memoryStore.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

const JWT_SECRET = process.env.JWT_SECRET || "badminton-booking-dev-secret-key";

function createToken(userId: string, role: string, email: string) {
  return jwt.sign(
    {
      userId,
      role,
      email,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập họ tên, email và mật khẩu",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isDbConnected()) {
      const existing = memoryUsers.find((u) => u.email === normalizedEmail);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Email này đã được đăng ký",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        _id: generateId(),
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone?.trim() || "",
        role: "user" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryUsers.push(newUser);

      const token = createToken(newUser._id, newUser.role, newUser.email);
      return res.status(201).json({
        success: true,
        message: "Đăng ký tài khoản thành công",
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
        },
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email này đã được đăng ký",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone?.trim() || "",
      role: "user",
    });

    const token = createToken(user._id.toString(), user.role, user.email);
    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi đăng ký",
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ email và mật khẩu",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isDbConnected()) {
      const user = memoryUsers.find((u) => u.email === normalizedEmail);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không chính xác",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không chính xác",
        });
      }

      const token = createToken(user._id, user.role, user.email);
      return res.json({
        success: true,
        message: `Đăng nhập thành công với vai trò ${user.role === "admin" ? "Quản trị viên (Admin)" : "Người dùng (User)"}`,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác",
      });
    }

    const token = createToken(user._id.toString(), user.role, user.email);
    return res.json({
      success: true,
      message: `Đăng nhập thành công với vai trò ${user.role === "admin" ? "Quản trị viên (Admin)" : "Người dùng (User)"}`,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi đăng nhập",
    });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    if (!isDbConnected()) {
      const user = memoryUsers.find((u) => u._id === req.user?.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
      }
      return res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });
    }

    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
    }

    return res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi xác thực" });
  }
}

// Helper to provide quick test account credentials for 1-click test in UI
export function getTestAccounts(_req: Request, res: Response) {
  res.json({
    success: true,
    accounts: [
      {
        role: "admin",
        title: "Tài khoản Quản Trị Viên (Admin)",
        email: "admin@badminton.vn",
        password: "admin123",
        description: "Toàn quyền duyệt đơn, quản lý sân, xem doanh thu và thống kê",
      },
      {
        role: "user",
        title: "Tài khoản Người Dùng (User)",
        email: "user@badminton.vn",
        password: "123456",
        description: "Đặt sân theo giờ, kiểm tra xung đột, quản lý vé đã đặt",
      },
    ],
  });
}
