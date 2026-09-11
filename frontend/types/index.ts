export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin";
}

export interface Court {
  id: string;
  name: string;
  type: string;
  status: "active" | "maintenance";
  regularPrice: number;
  peakPrice: number;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
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

export interface AdminStats {
  totalRevenue: number;
  todayRevenue: number;
  totalBookings: number;
  todayBookingsCount: number;
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  utilizationRate: number;
  totalUsers: number;
  totalLocations: number;
}

export interface TestAccount {
  role: "admin" | "user";
  title: string;
  email: string;
  password: string;
  description: string;
}
