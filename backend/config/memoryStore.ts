import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export interface MemoryLocation {
  _id: string;
  name: string;
  address: string;
  district?: string;
  city?: string;
  phone: string;
  openTime: string;
  closeTime: string;
  mapUrl?: string;
  latitude?: number;
  longitude?: number;
  directions?: string;
  courts: {
    id: string;
    name: string;
    type: string;
    status: "active" | "maintenance";
    regularPrice: number;
    peakPrice: number;
    position?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryBooking {
  _id: string;
  bookingCode: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  courtId: string;
  courtName: string;
  locationId: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  regularHours: number;
  peakHours: number;
  totalPrice: number;
  paymentMethod: "transfer" | "onsite";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function generateId(): string {
  return new mongoose.Types.ObjectId().toString();
}

// Pre-seeded locations with 4 courts each
export const memoryLocations: MemoryLocation[] = [
  {
    _id: "665000000000000000000001",
    name: "Sân Cầu Lông Cầu Giấy",
    address: "Số 35 Trần Quý Kiên, Dịch Vọng, Cầu Giấy, Hà Nội",
    district: "Cầu Giấy",
    city: "Hà Nội",
    phone: "0912 345 678",
    openTime: "06:00",
    closeTime: "22:00",
    mapUrl: "https://maps.google.com/?q=21.033785,105.792518",
    latitude: 21.033785,
    longitude: 105.792518,
    directions: "Cách ngã tư Cầu Giấy - Trần Đăng Ninh 200m, bãi gửi xe máy & ô tô rộng rãi miễn phí tại cổng 2.",
    courts: [
      { id: "court_1", name: "Sân 1 (Thảm Enlio)", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, position: "Khu A - Tầng 1 (Sân trung tâm)" },
      { id: "court_2", name: "Sân 2 (Thảm Enlio)", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, position: "Khu A - Tầng 1 (Cạnh cửa ra vào)" },
      { id: "court_3", name: "Sân 3 (Thảm Yonex VIP)", type: "VIP", status: "active", regularPrice: 90000, peakPrice: 130000, position: "Khu VIP - Tầng 2 (Có điều hòa & quạt hút)" },
      { id: "court_4", name: "Sân 4 (Thảm Enlio)", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, position: "Khu B - Tầng 1 (Sân góc yên tĩnh)" },
    ],
    createdAt: new Date("2025-01-01T08:00:00.000Z"),
    updatedAt: new Date("2025-01-01T08:00:00.000Z"),
  },
  {
    _id: "665000000000000000000002",
    name: "Sân Cầu Lông Thủ Đức",
    address: "Số 18 Võ Văn Ngân, Linh Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh",
    district: "TP. Thủ Đức",
    city: "TP. Hồ Chí Minh",
    phone: "0938 765 432",
    openTime: "06:00",
    closeTime: "22:00",
    mapUrl: "https://maps.google.com/?q=10.851215,106.771965",
    latitude: 10.851215,
    longitude: 106.771965,
    directions: "Đối diện Đại học Sư Phạm Kỹ Thuật, đi thẳng ngõ 18 vào 50m, nhà thi đấu mái vòm xanh.",
    courts: [
      { id: "court_1", name: "Sân 1", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, position: "Dãy A - Sân số 1 (Gần khán đài)" },
      { id: "court_2", name: "Sân 2", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, position: "Dãy A - Sân số 2" },
      { id: "court_3", name: "Sân 3", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, position: "Dãy B - Sân số 3 (Cạnh quầy nước giải khát)" },
      { id: "court_4", name: "Sân 4", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, position: "Dãy B - Sân số 4" },
    ],
    createdAt: new Date("2025-01-02T08:00:00.000Z"),
    updatedAt: new Date("2025-01-02T08:00:00.000Z"),
  },
  {
    _id: "665000000000000000000003",
    name: "Sân Cầu Lông Tân Bình",
    address: "Số 120 Hoàng Hoa Thám, Phường 12, Tân Bình, TP. Hồ Chí Minh",
    district: "Tân Bình",
    city: "TP. Hồ Chí Minh",
    phone: "0909 888 999",
    openTime: "06:00",
    closeTime: "22:00",
    mapUrl: "https://maps.google.com/?q=10.801648,106.649982",
    latitude: 10.801648,
    longitude: 106.649982,
    directions: "Gần ngã tư Hoàng Hoa Thám - Trường Chinh, khu phức hợp thể thao Quân khu, bãi xe ô tô rộng.",
    courts: [
      { id: "court_1", name: "Sân 1", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, position: "Khu trung tâm 1 (Thảm Yonex xanh lá)" },
      { id: "court_2", name: "Sân 2", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, position: "Khu trung tâm 2" },
      { id: "court_3", name: "Sân 3", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, position: "Khu khán đài VIP (Có ghế đệm & bảng điểm LED)" },
      { id: "court_4", name: "Sân 4", type: "Standard", status: "active", regularPrice: 80000, peakPrice: 120000, position: "Khu tập luyện cánh phải" },
    ],
    createdAt: new Date("2025-01-03T08:00:00.000Z"),
    updatedAt: new Date("2025-01-03T08:00:00.000Z"),
  },
];

// Pre-seeded users: 1 Admin and 1 Regular User
// Passwords hashed with bcrypt:
// admin123 -> $2a$10$iI8j9r4E6u5J9R7z7g...
// 123456 -> $2a$10$wE9...
const adminHashedPassword = bcrypt.hashSync("admin123", 10);
const userHashedPassword = bcrypt.hashSync("123456", 10);

export const memoryUsers: MemoryUser[] = [
  {
    _id: "admin_user_001",
    name: "Quản Trị Viên (Admin)",
    email: "admin@badminton.vn",
    password: adminHashedPassword,
    phone: "0901234567",
    role: "admin",
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  },
  {
    _id: "regular_user_001",
    name: "Nguyễn Văn An",
    email: "user@badminton.vn",
    password: userHashedPassword,
    phone: "0987654321",
    role: "user",
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  },
];

// Pre-seeded sample bookings
export const memoryBookings: MemoryBooking[] = [
  {
    _id: "booking_seed_001",
    bookingCode: "BC-2026-0891",
    userId: "regular_user_001",
    customerName: "Nguyễn Văn An",
    customerPhone: "0987654321",
    courtId: "court_1",
    courtName: "Sân 1 (Thảm Enlio)",
    locationId: "665000000000000000000001",
    location: "Sân Cầu Lông Cầu Giấy",
    date: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "10:00",
    durationHours: 2,
    regularHours: 2,
    peakHours: 0,
    totalPrice: 160000,
    paymentMethod: "onsite",
    status: "confirmed",
    note: "Đặt giao lưu buổi sáng",
    createdAt: new Date(Date.now() - 3600000 * 24),
    updatedAt: new Date(),
  },
  {
    _id: "booking_seed_002",
    bookingCode: "BC-2026-0892",
    userId: "guest_user_002",
    customerName: "Trần Minh Đức",
    customerPhone: "0912999888",
    courtId: "court_2",
    courtName: "Sân 2 (Thảm Enlio)",
    locationId: "665000000000000000000001",
    location: "Sân Cầu Lông Cầu Giấy",
    date: new Date().toISOString().split("T")[0],
    startTime: "18:00",
    endTime: "20:00",
    durationHours: 2,
    regularHours: 0,
    peakHours: 2,
    totalPrice: 240000,
    paymentMethod: "transfer",
    status: "pending",
    note: "Đánh đôi sau giờ làm việc",
    createdAt: new Date(Date.now() - 3600000 * 5),
    updatedAt: new Date(),
  },
  {
    _id: "booking_seed_003",
    bookingCode: "BC-2026-0893",
    userId: "regular_user_001",
    customerName: "Nguyễn Văn An",
    customerPhone: "0987654321",
    courtId: "court_3",
    courtName: "Sân 3 (Thảm Yonex VIP)",
    locationId: "665000000000000000000001",
    location: "Sân Cầu Lông Cầu Giấy",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    startTime: "17:00",
    endTime: "19:00",
    durationHours: 2,
    regularHours: 0,
    peakHours: 2,
    totalPrice: 260000,
    paymentMethod: "transfer",
    status: "confirmed",
    note: "Đặt trước ngày mai",
    createdAt: new Date(Date.now() - 3600000 * 2),
    updatedAt: new Date(),
  },
];
