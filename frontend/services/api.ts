import { Location, Booking, User, AdminStats, TestAccount } from "../types/index.js";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `Lỗi yêu cầu: ${res.status}`);
  }

  return data;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ success: boolean; token: string; user: User; message: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),

    register: (name: string, email: string, password: string, phone?: string) =>
      request<{ success: boolean; token: string; user: User; message: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, phone }),
      }),

    getMe: () => request<{ success: boolean; user: User }>("/api/auth/me"),

    getTestAccounts: () =>
      request<{ success: boolean; accounts: TestAccount[] }>("/api/auth/test-accounts"),
  },

  locations: {
    getAll: () => request<{ success: boolean; locations: Location[] }>("/api/locations"),

    getById: (id: string) => request<{ success: boolean; location: Location }>(`/api/locations/${id}`),

    create: (data: Partial<Location>) =>
      request<{ success: boolean; location: Location; message: string }>("/api/locations", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Location>) =>
      request<{ success: boolean; location: Location; message: string }>(`/api/locations/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/locations/${id}`, {
        method: "DELETE",
      }),
  },

  bookings: {
    getAll: (params?: { date?: string; locationId?: string; courtId?: string; status?: string; userId?: string }) => {
      const query = new URLSearchParams();
      if (params?.date) query.set("date", params.date);
      if (params?.locationId) query.set("locationId", params.locationId);
      if (params?.courtId) query.set("courtId", params.courtId);
      if (params?.status) query.set("status", params.status);
      if (params?.userId) query.set("userId", params.userId);
      const qs = query.toString();
      return request<{ success: boolean; count: number; bookings: Booking[] }>(
        `/api/bookings${qs ? `?${qs}` : ""}`
      );
    },

    getMy: (userId?: string) => {
      const qs = userId ? `?userId=${encodeURIComponent(userId)}` : "";
      return request<{ success: boolean; bookings: Booking[] }>(`/api/bookings/my${qs}`);
    },

    getById: (id: string) =>
      request<{ success: boolean; booking: Booking }>(`/api/bookings/${id}`),

    create: (data: {
      courtId: string;
      courtName?: string;
      locationId: string;
      location?: string;
      date: string;
      startTime: string;
      endTime: string;
      customerName: string;
      customerPhone: string;
      paymentMethod: "transfer" | "onsite";
      note?: string;
      userId?: string;
    }) =>
      request<{ success: boolean; booking: Booking; message: string }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    updateStatus: (id: string, status: "pending" | "confirmed" | "completed" | "cancelled", note?: string) =>
      request<{ success: boolean; booking: Booking; message: string }>(`/api/bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, note }),
      }),

    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/bookings/${id}`, {
        method: "DELETE",
      }),
  },

  admin: {
    getStats: () => request<{ success: boolean; stats: AdminStats }>("/api/admin/stats"),

    getUsers: () =>
      request<{ success: boolean; users: (User & { bookingCount: number; totalSpent: number; createdAt: string })[] }>(
        "/api/admin/users"
      ),

    toggleCourtStatus: (data: { locationId: string; courtId: string; status?: "active" | "maintenance"; regularPrice?: number; peakPrice?: number }) =>
      request<{ success: boolean; message: string; court: any }>("/api/admin/court-status", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
};
