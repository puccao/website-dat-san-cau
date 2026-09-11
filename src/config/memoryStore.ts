import mongoose from "mongoose";

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export interface MemoryLocation {
  _id: string;
  name: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryBooking {
  _id: string;
  userId: string;
  courtId: string;
  courtName: string;
  locationId: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  paymentMethod: "transfer" | "onsite";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

// Initial seed data for in-memory fallback
export const memoryLocations: MemoryLocation[] = [
  {
    _id: "665000000000000000000001",
    name: "Sân Cầu Lông Cầu Giấy",
    address: "Số 35 Trần Quý Kiên, Cầu Giấy, Hà Nội",
    createdAt: new Date("2025-01-01T08:00:00.000Z"),
    updatedAt: new Date("2025-01-01T08:00:00.000Z"),
  },
  {
    _id: "665000000000000000000002",
    name: "Sân Cầu Lông Thủ Đức",
    address: "Số 18 Võ Văn Ngân, TP. Thủ Đức, TP. Hồ Chí Minh",
    createdAt: new Date("2025-01-02T08:00:00.000Z"),
    updatedAt: new Date("2025-01-02T08:00:00.000Z"),
  },
  {
    _id: "665000000000000000000003",
    name: "Sân Cầu Lông Tân Bình",
    address: "Số 120 Hoàng Hoa Thám, Tân Bình, TP. Hồ Chí Minh",
    createdAt: new Date("2025-01-03T08:00:00.000Z"),
    updatedAt: new Date("2025-01-03T08:00:00.000Z"),
  },
];

export const memoryUsers: MemoryUser[] = [];

export const memoryBookings: MemoryBooking[] = [
  {
    _id: "666000000000000000000001",
    userId: "default_user_1",
    courtId: "court_1",
    courtName: "Sân 1",
    locationId: "665000000000000000000001",
    location: "Sân Cầu Lông Cầu Giấy",
    date: "2026-09-12",
    startTime: "08:00",
    endTime: "10:00",
    totalPrice: 160000,
    paymentMethod: "onsite",
    status: "confirmed",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function generateId(): string {
  return new mongoose.Types.ObjectId().toString();
}
