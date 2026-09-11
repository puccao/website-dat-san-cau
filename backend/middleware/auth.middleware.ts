import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: "user" | "admin";
    email?: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "badminton-booking-dev-secret-key";

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Vui lòng đăng nhập để tiếp tục",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: "user" | "admin";
      email?: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Phiên đăng nhập đã hết hạn hoặc không hợp lệ",
    });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Vui lòng đăng nhập",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Quyền truy cập bị từ chối: Yêu cầu quyền Quản trị viên (Admin)",
    });
  }

  next();
}

export function optionalToken(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        role: "user" | "admin";
        email?: string;
      };
      req.user = decoded;
    } catch {
      // ignore expired optional token
    }
  }
  next();
}
