export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin";
  bookingCount?: number;
  totalSpent?: number;
  createdAt?: string;
}

export interface CourtZone {
  id: string;
  name: string;
  description?: string;
}

export interface Court {
  id: string;
  name: string;
  type: string;
  status: "active" | "maintenance";
  regularPrice: number;
  peakPrice: number;
  zone?: string; // Tên khu vực (ví dụ: Khu A, Khu B, Khu VIP)
  position?: string; // Vị trí sân trong khuôn viên (ví dụ: Sân 1, Sân số 2, v.v.)
}

export interface Location {
  id: string;
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
  zones?: CourtZone[];
  courts: Court[];
}

export interface Booking {
  _id?: string;
  id?: string;
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
  createdAt: string;
}

export interface DailyRevenueItem {
  date: string;
  revenue: number;
  bookingsCount: number;
}

export interface TimeSlotItem {
  slot: string;
  label: string;
  count: number;
}

export interface AdminStats {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue?: number;
  avgBookingValue?: number;
  totalBookings: number;
  todayBookingsCount: number;
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  utilizationRate: number;
  totalUsers: number;
  totalLocations: number;
  totalCourts?: number;
  dailyRevenue?: DailyRevenueItem[];
  timeSlots?: TimeSlotItem[];
}

export interface TestAccount {
  role: "admin" | "user";
  title: string;
  email: string;
  password: string;
  description: string;
}

