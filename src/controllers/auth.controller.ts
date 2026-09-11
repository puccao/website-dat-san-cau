import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { User } from "../models/User.js";
import {
  isDbConnected,
  memoryUsers,
  generateId,
} from "../config/memoryStore.js";

function createToken(userId: string, role: string) {
  const secret =
    process.env.JWT_SECRET || "badminton-booking-dev-secret-key";

  return jwt.sign(
    {
      userId,
      role,
    },
    secret,
    {
      expiresIn: "7d",
    }
  );
}

export async function register(
  req: Request,
  res: Response
) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    if (!isDbConnected()) {
      const existing = memoryUsers.find(
        (u) => u.email === normalizedEmail
      );
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Email đã được đăng ký",
        });
      }

      const hashedPassword =
        await bcrypt.hash(password, 10);
      const newUser = {
        _id: generateId(),
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "user" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryUsers.push(newUser);

      const token = createToken(newUser._id, newUser.role);
      return res.status(201).json({
        success: true,
        message: "Đăng ký thành công",
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email đã được đăng ký",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
    });

    const token = createToken(
      user._id.toString(),
      user.role
    );

    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
}

export async function login(
  req: Request,
  res: Response
) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập email và mật khẩu",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    if (!isDbConnected()) {
      const user = memoryUsers.find(
        (u) => u.email === normalizedEmail
      );
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không đúng",
        });
      }

      const isPasswordCorrect =
        await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không đúng",
        });
      }

      const token = createToken(user._id, user.role);
      return res.json({
        success: true,
        message: "Đăng nhập thành công",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    const token = createToken(
      user._id.toString(),
      user.role
    );

    return res.json({
      success: true,
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
}