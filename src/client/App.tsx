import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Shield,
  Trash2,
  Check,
  Plus,
  ArrowRight,
  CreditCard,
  Building2,
  CalendarDays,
  Sparkles,
  Phone,
  QrCode,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
} from "lucide-react";

interface LocationItem {
  id: string;
  name: string;
  address: string;
}

interface BookingItem {
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
  createdAt: string;
}

const COURTS = [
  { id: "court_1", name: "Sân 1 (Thảm Yonex)" },
  { id: "court_2", name: "Sân 2 (Thảm Victor)" },
  { id: "court_3", name: "Sân 3 (Thảm Lining)" },
  { id: "court_4", name: "Sân 4 (VIP Pro)" },
];

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Convert "HH:mm" to minutes from midnight
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// Convert minutes from midnight to "HH:mm"
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// 1-hour slots for timeline grid (06:00 - 22:00)
const HOURLY_SLOTS = [];
for (let h = 6; h < 22; h++) {
  const start = `${h.toString().padStart(2, "0")}:00`;
  const end = `${(h + 1).toString().padStart(2, "0")}:00`;
  const peak = h >= 16; // 16:00 - 22:00 is peak
  HOURLY_SLOTS.push({ start, end, peak, hour: h });
}

// Calculate duration and exact pricing
function calculateBookingDetails(startTime: string, endTime: string) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  if (endMin <= startMin) {
    return {
      durationHours: 0,
      durationMinutes: 0,
      normalHours: 0,
      peakHours: 0,
      normalPrice: 0,
      peakPrice: 0,
      totalPrice: 0,
      valid: false,
    };
  }

  const durationMinutes = endMin - startMin;
  const durationHours = durationMinutes / 60;

  let normalBlocks = 0; // 30-min block: 40,000 VND (80,000đ/h)
  let peakBlocks = 0;   // 30-min block: 60,000 VND (120,000đ/h)

  for (let m = startMin; m < endMin; m += 30) {
    // 16:00 (960 min) to 22:00 (1320 min) is peak
    if (m >= 16 * 60 && m < 22 * 60) {
      peakBlocks++;
    } else {
      normalBlocks++;
    }
  }

  const normalPrice = normalBlocks * 40000;
  const peakPrice = peakBlocks * 60000;
  const totalPrice = normalPrice + peakPrice;

  return {
    durationHours,
    durationMinutes,
    normalHours: normalBlocks / 2,
    peakHours: peakBlocks / 2,
    normalPrice,
    peakPrice,
    totalPrice,
    valid: true,
  };
}

export default function App() {
  const { user, login, register, logout } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"booking" | "locations" | "my-bookings" | "admin">("booking");

  // Locations & Bookings data
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Booking form states: court, date, start time, end time
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedCourtId, setSelectedCourtId] = useState<string>(COURTS[0].id);

  // Default to 2 hours in evening (17:00 - 19:00)
  const [startTime, setStartTime] = useState<string>("17:00");
  const [endTime, setEndTime] = useState<string>("19:00");
  const [selectionAnchor, setSelectionAnchor] = useState<string | null>(null);

  // Schedule view mode: single court vs all courts comparison
  const [scheduleViewMode, setScheduleViewMode] = useState<"single-court" | "all-courts">("single-court");

  // Booking confirmation modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"onsite" | "transfer">("onsite");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auth modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // New location modal (admin)
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationAddress, setNewLocationAddress] = useState("");
  const [addingLocation, setAddingLocation] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [locRes, bookRes] = await Promise.all([
        fetch("/api/locations"),
        fetch("/api/bookings"),
      ]);

      const locData = await locRes.json();
      const bookData = await bookRes.json();

      if (locData.success && Array.isArray(locData.locations)) {
        setLocations(locData.locations);
        if (!selectedLocationId && locData.locations.length > 0) {
          setSelectedLocationId(locData.locations[0].id);
        }
      }

      if (bookData.success && Array.isArray(bookData.bookings)) {
        setBookings(bookData.bookings);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update customer name when user logs in
  useEffect(() => {
    if (user) {
      setCustomerName(user.name);
    }
  }, [user]);

  // Selected location object
  const currentLocation = locations.find((l) => l.id === selectedLocationId) || locations[0];
  const currentCourt = COURTS.find((c) => c.id === selectedCourtId) || COURTS[0];

  // Calculate pricing & duration for the selected range
  const priceDetails = calculateBookingDetails(startTime, endTime);

  // Check if a specific slot on any court is booked
  const isCourtSlotBooked = (courtId: string, start: string, end: string) => {
    return bookings.some(
      (b) =>
        b.locationId === selectedLocationId &&
        b.courtId === courtId &&
        b.date === selectedDate &&
        ["pending", "confirmed"].includes(b.status) &&
        b.startTime < end &&
        b.endTime > start
    );
  };

  // Check if slot is booked for selected court
  const isSlotBooked = (start: string, end: string) => {
    return isCourtSlotBooked(selectedCourtId, start, end);
  };

  // Check if a range has conflicts
  const checkRangeHasConflict = (startStr: string, endStr: string, courtId: string = selectedCourtId) => {
    return bookings.some(
      (b) =>
        b.locationId === selectedLocationId &&
        b.courtId === courtId &&
        b.date === selectedDate &&
        ["pending", "confirmed"].includes(b.status) &&
        b.startTime < endStr &&
        b.endTime > startStr
    );
  };

  // Check all conflicting bookings for currently selected range [startTime, endTime)
  const conflictingBookings = bookings.filter(
    (b) =>
      b.locationId === selectedLocationId &&
      b.courtId === selectedCourtId &&
      b.date === selectedDate &&
      ["pending", "confirmed"].includes(b.status) &&
      b.startTime < endTime &&
      b.endTime > startTime
  );
  const hasConflict = conflictingBookings.length > 0;

  // Handle clicking directly on an hourly slot in the timetable
  const handleSlotClick = (slot: { start: string; end: string }) => {
    if (isSlotBooked(slot.start, slot.end)) return;

    // First click: start fresh with this single slot
    if (!selectionAnchor) {
      setStartTime(slot.start);
      setEndTime(slot.end);
      setSelectionAnchor(slot.start);
      return;
    }

    // Second click: select continuous range between anchor and this slot
    const anchorMin = timeToMinutes(selectionAnchor);
    const slotStartMin = timeToMinutes(slot.start);

    let newStart: string;
    let newEnd: string;

    if (slotStartMin >= anchorMin) {
      newStart = selectionAnchor;
      newEnd = slot.end;
    } else {
      newStart = slot.start;
      newEnd = minutesToTime(anchorMin + 60);
    }

    // Validate that no existing bookings block this range
    if (checkRangeHasConflict(newStart, newEnd)) {
      // If blocked, start fresh from clicked slot
      setStartTime(slot.start);
      setEndTime(slot.end);
      setSelectionAnchor(slot.start);
    } else {
      setStartTime(newStart);
      setEndTime(newEnd);
      setSelectionAnchor(null);
    }
  };

  // Quick adjust duration (+1 hour)
  const handleQuickAddHour = () => {
    const currentEndMin = timeToMinutes(endTime);
    const nextEndMin = Math.min(22 * 60, currentEndMin + 60);
    const nextEnd = minutesToTime(nextEndMin);
    if (nextEndMin > currentEndMin && !checkRangeHasConflict(startTime, nextEnd)) {
      setEndTime(nextEnd);
      setSelectionAnchor(null);
    }
  };

  // Quick adjust duration (-1 hour)
  const handleQuickSubtractHour = () => {
    const currentStartMin = timeToMinutes(startTime);
    const currentEndMin = timeToMinutes(endTime);
    const prevEndMin = currentEndMin - 60;
    if (prevEndMin > currentStartMin) {
      setEndTime(minutesToTime(prevEndMin));
      setSelectionAnchor(null);
    }
  };

  // Reset selection to 1 hour
  const handleResetSelection = () => {
    setSelectionAnchor(null);
    const startMin = timeToMinutes(startTime);
    setEndTime(minutesToTime(Math.min(22 * 60, startMin + 60)));
  };

  // Submit booking
  const handleConfirmBooking = async () => {
    if (!priceDetails.valid || hasConflict || !currentLocation) return;

    setBookingSubmitting(true);
    setBookingMessage(null);

    const payload = {
      userId: user ? user.id : "guest_" + Date.now(),
      courtId: currentCourt.id,
      courtName: currentCourt.name,
      locationId: currentLocation.id,
      location: currentLocation.name,
      date: selectedDate,
      startTime: startTime,
      endTime: endTime,
      totalPrice: priceDetails.totalPrice,
      paymentMethod,
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBookingMessage({
          type: "success",
          text: `Đặt sân thành công! Mã booking: #${data.booking._id.slice(-6).toUpperCase()} (${startTime} - ${endTime})`,
        });
        // Refresh bookings
        await fetchData();
      } else {
        setBookingMessage({
          type: "error",
          text: data.message || "Không thể đặt sân. Vui lòng thử lại!",
        });
      }
    } catch (err) {
      setBookingMessage({
        type: "error",
        text: "Lỗi kết nối máy chủ. Vui lòng kiểm tra lại!",
      });
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Handle Cancel Booking
  const handleCancelBooking = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy đặt sân này?")) return;
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) => prev.filter((b) => b._id !== id));
      } else {
        alert(data.message || "Không thể hủy");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    }
  };

  // Handle Status Update (Admin)
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) =>
          prev.map((b) => (b._id === id ? { ...b, status: newStatus as any } : b))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Add Location
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationName.trim() || !newLocationAddress.trim()) return;
    setAddingLocation(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLocationName.trim(),
          address: newLocationAddress.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewLocationName("");
        setNewLocationAddress("");
        await fetchData();
      } else {
        alert(data.message || "Thêm thất bại");
      }
    } catch (err) {
      alert("Lỗi khi thêm địa điểm");
    } finally {
      setAddingLocation(false);
    }
  };

  // Handle Auth submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSubmitting(true);

    try {
      if (authMode === "login") {
        const ok = await login(authEmail, authPassword);
        if (ok) {
          setShowAuthModal(false);
          setAuthEmail("");
          setAuthPassword("");
        } else {
          setAuthError("Email hoặc mật khẩu không chính xác");
        }
      } else {
        const ok = await register(authName, authEmail, authPassword);
        if (ok) {
          setShowAuthModal(false);
          setAuthName("");
          setAuthEmail("");
          setAuthPassword("");
        } else {
          setAuthError("Đăng ký không thành công. Email có thể đã tồn tại");
        }
      }
    } catch (err) {
      setAuthError("Đã xảy ra lỗi kết nối");
    } finally {
      setAuthSubmitting(false);
    }
  };

  return (
    <div id="app-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Bar / Navigation */}
      <header id="main-header" className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("booking")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
              🏸
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                SânCầu<span className="text-emerald-400">.vn</span>
              </span>
              <p className="text-xs text-slate-400">Đặt Sân Cầu Lông Trực Tuyến</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            <button
              id="tab-btn-booking"
              onClick={() => setActiveTab("booking")}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "booking"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              Đặt Sân
            </button>
            <button
              id="tab-btn-locations"
              onClick={() => setActiveTab("locations")}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "locations"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              Cụm Sân ({locations.length})
            </button>
            <button
              id="tab-btn-my-bookings"
              onClick={() => setActiveTab("my-bookings")}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                activeTab === "my-bookings"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              Lịch Của Tôi
              {bookings.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-slate-800 text-emerald-400 border border-slate-700">
                  {bookings.length}
                </span>
              )}
            </button>
            <button
              id="tab-btn-admin"
              onClick={() => setActiveTab("admin")}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "admin"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Quản Trị
            </button>
          </nav>

          {/* User Auth controls */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-refresh-data"
              onClick={fetchData}
              title="Làm mới dữ liệu"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin text-emerald-400" : ""}`} />
            </button>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-semibold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                  <div className="text-[10px] text-emerald-400 capitalize">{user.role}</div>
                </div>
                <button
                  id="btn-logout"
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-1"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-open-login"
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs rounded-lg transition-colors shadow-sm shadow-emerald-500/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden flex border-t border-slate-800 px-2 py-1.5 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab("booking")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === "booking" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400"
            }`}
          >
            Đặt Sân
          </button>
          <button
            onClick={() => setActiveTab("locations")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === "locations" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400"
            }`}
          >
            Cụm Sân ({locations.length})
          </button>
          <button
            onClick={() => setActiveTab("my-bookings")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === "my-bookings" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400"
            }`}
          >
            Lịch Đặt ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === "admin" ? "bg-amber-500/20 text-amber-400" : "text-slate-400"
            }`}
          >
            Quản Trị
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ================= TAB 1: BOOKING ================= */}
        {activeTab === "booking" && (
          <div className="space-y-6">
            {/* Hero Banner */}
            <div id="booking-hero" className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 md:p-8 border border-slate-800 shadow-xl">
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  Hệ Thống Đặt Sân Cầu Lông Tiêu Chuẩn Quốc Tế
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Chọn Sân & Giữ Chỗ <span className="text-emerald-400">Trực Tuyến</span>
                </h1>
                <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                  Xem ngay các khung giờ trống, thảm chuyên dụng chống trượt, đèn chiếu sáng không lóa mắt.
                  Đảm bảo không trùng giờ và giữ slot tức thì.
                </p>

                {/* Quick Filters */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 backdrop-blur-sm">
                  {/* Select Location */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Chọn Địa Điểm Cụm Sân
                    </label>
                    <select
                      id="select-location"
                      value={selectedLocationId}
                      onChange={(e) => {
                        setSelectedLocationId(e.target.value);
                        setSelectedSlot(null);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} - {loc.address}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Ngày Đặt Sân
                    </label>
                    <input
                      id="input-date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlot(null);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Court Picker & Time Slot Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Court Selection + Time Range Selector + Slots */}
              <div className="lg:col-span-2 space-y-5">
                {/* Court Tabs & View Switcher */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-400" /> Chọn Số Sân Cầu Lông
                    </h2>
                    
                    {/* View Switcher: Single Court vs All Courts Comparison */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setScheduleViewMode("single-court")}
                        className={`px-2.5 py-1 rounded font-medium transition-colors ${
                          scheduleViewMode === "single-court"
                            ? "bg-emerald-500 text-slate-950 font-bold"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Chi tiết sân
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleViewMode("all-courts")}
                        className={`px-2.5 py-1 rounded font-medium transition-colors ${
                          scheduleViewMode === "all-courts"
                            ? "bg-emerald-500 text-slate-950 font-bold"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        So sánh cả 4 sân
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {COURTS.map((court) => {
                      const isSelected = selectedCourtId === court.id;
                      return (
                        <button
                          key={court.id}
                          id={`court-tab-${court.id}`}
                          onClick={() => {
                            setSelectedCourtId(court.id);
                            setSelectionAnchor(null);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10"
                              : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40"
                          }`}
                        >
                          <div className="text-xs font-semibold">{court.name.split(" ")[0]} {court.name.split(" ")[1]}</div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">{court.name.replace(/^[^(]+/, "")}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* VIEW 1: SINGLE COURT TIMELINE GRID */}
                {scheduleViewMode === "single-court" && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
                    {/* Header: Court Title & Legend */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
                      <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                          <CalendarDays className="w-5 h-5 text-emerald-400" /> Bảng Giờ Đặt: {currentCourt.name}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Ngày <strong className="text-slate-200">{selectedDate}</strong> tại{" "}
                          <strong className="text-slate-200">{currentLocation?.name}</strong>
                        </p>
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700"></span>
                          <span>Trống</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                          <span>Đang chọn</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/60"></span>
                          <span>Đã kín</span>
                        </div>
                      </div>
                    </div>

                    {/* Active Selection Banner & Quick Controls directly on top of grid */}
                    <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3.5 mb-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs text-slate-300">Khung giờ đang chọn:</span>
                            <span className="text-sm sm:text-base font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              {startTime} – {endTime}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg">
                            {priceDetails.durationHours} tiếng ({priceDetails.durationMinutes} phút)
                          </div>

                          <div className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                            Tạm tính: {formatVND(priceDetails.totalPrice)}
                          </div>
                        </div>

                        {/* Quick Duration Adjuster (+1h, -1h, Đặt lại) */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleQuickSubtractHour}
                            disabled={priceDetails.durationHours <= 1}
                            className="text-xs font-semibold px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 rounded-lg transition-colors border border-slate-700"
                            title="Giảm bớt 1 tiếng"
                          >
                            -1 tiếng
                          </button>

                          <button
                            type="button"
                            onClick={handleQuickAddHour}
                            className="text-xs font-semibold px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg transition-colors shadow-sm"
                            title="Thêm 1 tiếng"
                          >
                            +1 tiếng
                          </button>

                          <button
                            type="button"
                            onClick={handleResetSelection}
                            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 transition-colors"
                            title="Đặt lại 1 tiếng"
                          >
                            Đặt lại
                          </button>
                        </div>
                      </div>

                      {/* Conflict Alert if any */}
                      {hasConflict && (
                        <div className="mt-3 p-2.5 bg-red-500/15 border border-red-500/40 rounded-lg text-xs text-red-300 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <span>
                            Khung giờ này vướng lịch đã đặt trước:{" "}
                            <strong className="text-white">
                              {conflictingBookings.map((b) => `${b.startTime} - ${b.endTime}`).join(", ")}
                            </strong>
                            . Vui lòng nhấp ô giờ khác.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Direct Interactive Tip */}
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
                      <div className="flex items-center gap-1 text-slate-300">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {selectionAnchor
                            ? `Đang chọn từ ${selectionAnchor}. Hãy nhấp ô giờ tiếp theo để đặt khoảng giờ!`
                            : "Nhấp trực tiếp vào ô giờ để chọn. Nhấp ô tiếp theo để đặt liền 2–3 tiếng."}
                        </span>
                      </div>
                      <div className="hidden sm:block text-[11px] text-slate-400">
                        Giờ thường: <span className="text-emerald-400">80k/h</span> | Cao điểm: <span className="text-amber-400">120k/h</span>
                      </div>
                    </div>

                    {/* Hourly Grid 06:00 to 22:00 */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {HOURLY_SLOTS.map((slot) => {
                        const booked = isSlotBooked(slot.start, slot.end);
                        const inRange = slot.start < endTime && slot.end > startTime;
                        const isStart = slot.start === startTime;
                        const isEnd = slot.end === endTime;

                        return (
                          <button
                            key={slot.start}
                            id={`slot-${slot.start.replace(":", "")}`}
                            disabled={booked}
                            onClick={() => handleSlotClick(slot)}
                            className={`relative p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                              booked
                                ? "bg-slate-950/40 border-red-950/40 text-slate-500 cursor-not-allowed opacity-60"
                                : inRange
                                ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-slate-950 border-emerald-400 font-bold shadow-lg shadow-emerald-500/20 scale-[1.02]"
                                : "bg-slate-950/80 border-slate-800 text-slate-200 hover:border-emerald-500/50 hover:bg-slate-800/60"
                            }`}
                          >
                            <span className={`text-xs font-semibold ${inRange ? "text-slate-950" : "text-slate-300"}`}>
                              {slot.start} - {slot.end}
                            </span>

                            <span
                              className={`text-[11px] font-medium mt-1 ${
                                inRange ? "text-slate-900" : slot.peak ? "text-amber-400" : "text-emerald-400"
                              }`}
                            >
                              {formatVND(slot.peak ? 120000 : 80000)}/h
                            </span>

                            {booked ? (
                              <span className="mt-1 text-[10px] text-red-400 font-semibold flex items-center gap-0.5">
                                <XCircle className="w-3 h-3" /> Đã kín
                              </span>
                            ) : inRange ? (
                              <span className="mt-1 text-[10px] bg-slate-950/80 text-emerald-300 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                {isStart ? "🟢 Bắt đầu" : isEnd ? "🏁 Kết thúc" : "✓ Đang chọn"}
                              </span>
                            ) : (
                              <span className="mt-1 text-[10px] text-slate-400 group-hover:text-emerald-400">
                                Nhấp để chọn
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* VIEW 2: ALL COURTS COMPARISON TIMELINE MATRIX */}
                {scheduleViewMode === "all-courts" && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 overflow-x-auto shadow-lg">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-400" /> Bảng So Sánh Cả 4 Sân ({selectedDate})
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Xem sân nào còn trống liên tiếp 2-3 tiếng để chọn ngay
                        </p>
                      </div>
                      <span className="text-xs text-emerald-400 font-semibold">
                        Khung giờ đang xem: {startTime} - {endTime}
                      </span>
                    </div>

                    <div className="min-w-[700px]">
                      <div className="grid grid-cols-9 gap-1.5 text-xs text-slate-400 mb-2 font-medium">
                        <div className="col-span-2">Tên Sân</div>
                        <div>06:00-08:00</div>
                        <div>08:00-10:00</div>
                        <div>10:00-12:00</div>
                        <div>14:00-16:00</div>
                        <div>16:00-18:00</div>
                        <div>18:00-20:00</div>
                        <div>20:00-22:00</div>
                      </div>

                      {COURTS.map((court) => {
                        const isCurrentCourt = court.id === selectedCourtId;
                        const timeBlocks = [
                          { start: "06:00", end: "08:00" },
                          { start: "08:00", end: "10:00" },
                          { start: "10:00", end: "12:00" },
                          { start: "14:00", end: "16:00" },
                          { start: "16:00", end: "18:00" },
                          { start: "18:00", end: "20:00" },
                          { start: "20:00", end: "22:00" },
                        ];

                        return (
                          <div
                            key={court.id}
                            className={`grid grid-cols-9 gap-1.5 p-2 rounded-xl border mb-2 items-center transition-colors ${
                              isCurrentCourt
                                ? "bg-slate-800/80 border-emerald-500/50"
                                : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            <div className="col-span-2">
                              <div className="font-bold text-xs text-slate-200">{court.name}</div>
                              <div className="text-[10px] text-slate-400">
                                {isCurrentCourt ? (
                                  <span className="text-emerald-400 font-semibold">● Đang chọn</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCourtId(court.id)}
                                    className="text-slate-400 hover:text-white underline"
                                  >
                                    Đổi sang sân này
                                  </button>
                                )}
                              </div>
                            </div>

                            {timeBlocks.map((block) => {
                              const booked = isCourtSlotBooked(court.id, block.start, block.end);
                              const selectedOnThisCourt =
                                isCurrentCourt &&
                                block.start < endTime &&
                                block.end > startTime;

                              return (
                                <button
                                  key={block.start}
                                  type="button"
                                  disabled={booked}
                                  onClick={() => {
                                    setSelectedCourtId(court.id);
                                    setStartTime(block.start);
                                    setEndTime(block.end);
                                  }}
                                  className={`p-1.5 rounded-lg text-center text-[10px] font-medium transition-all ${
                                    booked
                                      ? "bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed"
                                      : selectedOnThisCourt
                                      ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                                      : "bg-slate-900 border border-slate-800 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-800"
                                  }`}
                                  title={`${court.name} (${block.start} - ${block.end})`}
                                >
                                  {booked ? "Kín" : selectedOnThisCourt ? "Đang chọn" : "Trống"}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Col: Booking Summary & Checkout Card */}
              <div className="space-y-5">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sticky top-20 shadow-xl">
                  <h3 className="text-base font-bold text-white mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-emerald-400" /> Chi Tiết Đặt Sân
                  </h3>

                  <div className="space-y-3.5 text-sm">
                    <div className="flex items-start justify-between">
                      <span className="text-slate-400">Địa điểm:</span>
                      <span className="text-slate-200 font-medium text-right max-w-[180px]">
                        {currentLocation?.name || "Chưa chọn"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Sân chọn:</span>
                      <span className="text-emerald-400 font-semibold">{currentCourt.name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Ngày đặt:</span>
                      <span className="text-slate-200 font-medium">{selectedDate}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Khung giờ:</span>
                      <span className="text-slate-100 font-bold text-base">
                        {startTime} - {endTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Thời lượng:</span>
                      <span className="text-emerald-400 font-bold">
                        {priceDetails.durationHours} tiếng ({priceDetails.durationMinutes} phút)
                      </span>
                    </div>

                    {/* Breakdown by Normal vs Peak */}
                    <div className="text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 space-y-1">
                      {priceDetails.normalHours > 0 && (
                        <div className="flex justify-between text-slate-300">
                          <span>Giờ thường ({priceDetails.normalHours}h x 80k):</span>
                          <span>{formatVND(priceDetails.normalPrice)}</span>
                        </div>
                      )}
                      {priceDetails.peakHours > 0 && (
                        <div className="flex justify-between text-amber-300">
                          <span>Giờ cao điểm ({priceDetails.peakHours}h x 120k):</span>
                          <span>{formatVND(priceDetails.peakPrice)}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300 font-medium">Tổng tiền:</span>
                      <span className="text-2xl font-extrabold text-emerald-400">
                        {formatVND(priceDetails.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Conflict Notice on checkout button */}
                  {hasConflict && (
                    <div className="mt-3 p-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-[11px] text-red-300 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                      <span>Trùng lịch đã có người đặt! Hãy đổi giờ.</span>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    id="btn-open-booking-modal"
                    disabled={!priceDetails.valid || hasConflict}
                    onClick={() => {
                      setBookingMessage(null);
                      setShowBookingModal(true);
                    }}
                    className={`w-full mt-5 py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                      !priceDetails.valid || hasConflict
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                        : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20 active:scale-[0.99]"
                    }`}
                  >
                    <span>
                      {hasConflict
                        ? "Khung giờ bị trùng - Đổi giờ"
                        : `Xác Nhận & Đặt Sân (${priceDetails.durationHours} tiếng)`}
                    </span>
                    {!hasConflict && priceDetails.valid && <ArrowRight className="w-4 h-4" />}
                  </button>

                  <p className="mt-3 text-[11px] text-slate-400 text-center">
                    Giữ sân tức thì 100% khi hoàn tất đặt
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: LOCATIONS ================= */}
        {activeTab === "locations" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Danh Sách Cụm Sân Cầu Lông</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Khám phá các cụm sân chất lượng cao với đầy đủ tiện ích thể thao
                </p>
              </div>

              {user?.role === "admin" && (
                <button
                  id="btn-admin-add-location"
                  onClick={() => setActiveTab("admin")}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Thêm cụm sân mới
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {locations.map((loc, idx) => (
                <div
                  key={loc.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="h-40 rounded-xl bg-gradient-to-tr from-emerald-900/40 via-slate-800 to-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden mb-4">
                      <span className="text-5xl select-none">🏸</span>
                      <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-semibold text-emerald-400 border border-slate-700">
                        Sân tiêu chuẩn
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1.5">{loc.name}</h3>
                    <p className="text-xs text-slate-400 flex items-start gap-1.5 mb-4 leading-relaxed">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{loc.address}</span>
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-4 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                      <div>✓ 4 sân Yonex VIP</div>
                      <div>✓ Bãi đậu ô tô</div>
                      <div>✓ Wifi & Căn tin</div>
                      <div>✓ Phòng tắm nóng lạnh</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedLocationId(loc.id);
                      setActiveTab("booking");
                    }}
                    className="w-full py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 hover:border-transparent rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Đặt sân tại cụm này</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: MY BOOKINGS ================= */}
        {activeTab === "my-bookings" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Lịch Sử & Đặt Sân Của Tôi</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Xem và quản lý các lịch đặt sân của bạn hoặc tra cứu theo mã booking
                </p>
              </div>
              <button
                onClick={fetchData}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-medium text-slate-300 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Làm mới
              </button>
            </div>

            {bookings.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  🏸
                </div>
                <h3 className="text-base font-semibold text-white">Chưa có lượt đặt sân nào</h3>
                <p className="text-xs text-slate-400 mt-1 mb-6">
                  Bạn chưa đặt lịch sân nào hoặc dữ liệu vừa được làm mới.
                </p>
                <button
                  onClick={() => setActiveTab("booking")}
                  className="px-4 py-2 bg-emerald-500 text-slate-950 font-semibold text-xs rounded-xl shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-colors"
                >
                  Đặt sân ngay bây giờ
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookings.map((booking) => {
                  const isPending = booking.status === "pending";
                  const isConfirmed = booking.status === "confirmed";
                  const isCancelled = booking.status === "cancelled";

                  return (
                    <div
                      key={booking._id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Header card */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            #{booking._id.slice(-6).toUpperCase()}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                              isConfirmed
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : isPending
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {isConfirmed ? (
                              <>
                                <CheckCircle className="w-3 h-3" /> Đã xác nhận
                              </>
                            ) : isPending ? (
                              <>
                                <Clock className="w-3 h-3" /> Chờ xác nhận
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" /> Đã hủy
                              </>
                            )}
                          </span>
                        </div>

                        {/* Booking details */}
                        <h4 className="text-base font-bold text-white">{booking.courtName}</h4>
                        <p className="text-xs text-emerald-400 font-medium mb-3">{booking.location}</p>

                        <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-4">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Ngày:</span>
                            <span className="font-semibold text-slate-100">{booking.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Thời gian:</span>
                            <span className="font-semibold text-emerald-400">
                              {booking.startTime} - {booking.endTime}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Thanh toán:</span>
                            <span className="capitalize text-slate-200">
                              {booking.paymentMethod === "transfer" ? "Chuyển khoản QR" : "Tại sân"}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
                            <span className="text-slate-300">Tổng phí:</span>
                            <span className="text-emerald-400">{formatVND(booking.totalPrice)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                        <span className="text-[11px] text-slate-400">
                          {new Date(booking.createdAt).toLocaleDateString("vi-VN")}
                        </span>

                        {!isCancelled && (
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hủy đặt sân
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: ADMIN ================= */}
        {activeTab === "admin" && (
          <div className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-bold text-amber-300">Khu Vực Quản Trị Hệ Thống Sân</h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Xem toàn bộ lịch đặt sân, xác nhận trạng thái (Confirmed/Cancelled/Completed) và thêm mới các cụm sân cầu lông.
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400 font-medium">Tổng Đặt Sân</div>
                <div className="text-2xl font-bold text-white mt-1">{bookings.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400 font-medium">Cụm Sân Hoạt Động</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{locations.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400 font-medium">Doanh Thu Dự Kiến</div>
                <div className="text-2xl font-bold text-amber-400 mt-1">
                  {formatVND(bookings.reduce((sum, b) => (b.status !== "cancelled" ? sum + b.totalPrice : sum), 0))}
                </div>
              </div>
            </div>

            {/* Form: Add New Location */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" /> Thêm Cụm Sân Mới
              </h3>
              <form onSubmit={handleAddLocation} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Tên cụm sân (VD: Sân Cầu Lông Ba Đình)"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Địa chỉ cụ thể (VD: Số 12 Đội Cấn, Ba Đình, Hà Nội)"
                  value={newLocationAddress}
                  onChange={(e) => setNewLocationAddress(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                  required
                />
                <button
                  type="submit"
                  disabled={addingLocation}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg py-2 px-4 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{addingLocation ? "Đang lưu..." : "Thêm cụm sân"}</span>
                </button>
              </form>
            </div>

            {/* Table: All Bookings Management */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" /> Danh Sách Tất Cả Bookings ({bookings.length})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 uppercase bg-slate-950/60">
                    <tr>
                      <th className="p-3">Mã</th>
                      <th className="p-3">Cụm Sân & Tên Sân</th>
                      <th className="p-3">Ngày & Giờ</th>
                      <th className="p-3">Tiền</th>
                      <th className="p-3">Thanh Toán</th>
                      <th className="p-3">Trạng Thái</th>
                      <th className="p-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {bookings.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-800/30">
                        <td className="p-3 font-mono text-slate-400">#{b._id.slice(-6)}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-200">{b.courtName}</div>
                          <div className="text-[11px] text-slate-400">{b.location}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-200">{b.date}</div>
                          <div className="text-emerald-400 font-medium">
                            {b.startTime} - {b.endTime}
                          </div>
                        </td>
                        <td className="p-3 font-bold text-slate-200">{formatVND(b.totalPrice)}</td>
                        <td className="p-3 capitalize">{b.paymentMethod === "transfer" ? "Chuyển khoản" : "Tại sân"}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === "confirmed"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : b.status === "pending"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          {b.status !== "confirmed" && (
                            <button
                              onClick={() => handleUpdateStatus(b._id, "confirmed")}
                              className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 rounded font-semibold transition-colors"
                              title="Duyệt / Xác nhận"
                            >
                              Xác nhận
                            </button>
                          )}
                          {b.status !== "cancelled" && (
                            <button
                              onClick={() => handleUpdateStatus(b._id, "cancelled")}
                              className="px-2 py-1 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded font-semibold transition-colors"
                              title="Hủy"
                            >
                              Hủy
                            </button>
                          )}
                          <button
                            onClick={() => handleCancelBooking(b._id)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                            title="Xóa bản ghi"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL: BOOKING CONFIRMATION ================= */}
      {showBookingModal && priceDetails.valid && currentLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Xác Nhận Đặt Sân</h3>
                <p className="text-xs text-slate-400">Điền thông tin và hình thức thanh toán</p>
              </div>
            </div>

            {/* Ticket breakdown */}
            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Cụm sân:</span>
                <span className="font-semibold text-slate-200">{currentLocation.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sân chọn:</span>
                <span className="font-semibold text-emerald-400">{currentCourt.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ngày đặt:</span>
                <span className="font-semibold text-slate-200">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Khung giờ:</span>
                <span className="font-semibold text-emerald-400">
                  {startTime} - {endTime} ({priceDetails.durationHours} tiếng / {priceDetails.durationMinutes} phút)
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Phân bổ biểu phí:</span>
                <span>
                  {priceDetails.normalHours > 0 && `${priceDetails.normalHours}h thường (${formatVND(priceDetails.normalPrice)})`}
                  {priceDetails.normalHours > 0 && priceDetails.peakHours > 0 && " + "}
                  {priceDetails.peakHours > 0 && `${priceDetails.peakHours}h cao điểm (${formatVND(priceDetails.peakPrice)})`}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold">
                <span className="text-slate-300">Tổng thanh toán:</span>
                <span className="text-emerald-400 font-extrabold">{formatVND(priceDetails.totalPrice)}</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Họ & Tên Người Đặt <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Số Điện Thoại Liên Hệ <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Ví dụ: 0912 345 678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phương Thức Thanh Toán
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("onsite")}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col items-start ${
                      paymentMethod === "onsite"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">💵 Thanh toán tại sân</span>
                    <span className="text-[10px] text-slate-400 mt-1">Trả tiền mặt hoặc chuyển khoản khi đến sân</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("transfer")}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col items-start ${
                      paymentMethod === "transfer"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">📱 VietQR / MoMo</span>
                    <span className="text-[10px] text-slate-400 mt-1">Quét mã QR chuyển khoản nhanh 24/7</span>
                  </button>
                </div>
              </div>

              {/* Simulated QR Code if transfer selected */}
              {paymentMethod === "transfer" && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-center flex items-center justify-around gap-3">
                  <div className="w-20 h-20 bg-white rounded-lg p-1 flex items-center justify-center shrink-0">
                    <QrCode className="w-16 h-16 text-slate-900" />
                  </div>
                  <div className="text-left text-xs space-y-1">
                    <div className="text-[11px] text-slate-400">Ngân Hàng Quân Đội (MB Bank)</div>
                    <div className="font-mono font-bold text-slate-100">0988 888 888</div>
                    <div className="text-[11px] text-slate-400">Chủ TK: CONG TY DAT SAN CAU</div>
                    <div className="text-[10px] text-emerald-400">Nội dung: [Tên] + [Sân] + [Giờ]</div>
                  </div>
                </div>
              )}
            </div>

            {/* Notification message */}
            {bookingMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2 ${
                  bookingMessage.type === "success"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                {bookingMessage.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{bookingMessage.text}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                id="btn-submit-booking-confirm"
                disabled={bookingSubmitting}
                onClick={handleConfirmBooking}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-colors disabled:opacity-50"
              >
                {bookingSubmitting ? "Đang xử lý..." : "Hoàn Tất Đặt Sân"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: AUTH (LOGIN / REGISTER) ================= */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              ✕
            </button>

            {/* Toggle Mode */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-5">
              <button
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  authMode === "login" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Đăng Nhập
              </button>
              <button
                onClick={() => {
                  setAuthMode("register");
                  setAuthError("");
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  authMode === "register" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Đăng Ký
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {authMode === "register" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Họ & Tên</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              {authError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors mt-2 disabled:opacity-50"
              >
                {authSubmitting ? "Đang xử lý..." : authMode === "login" ? "Đăng Nhập" : "Tạo Tài Khoản"}
              </button>
            </form>

            {/* Quick Demo Login */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <span className="block text-[11px] text-slate-400 text-center mb-2">Thử nhanh với tài khoản mẫu:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthEmail("test@example.com");
                    setAuthPassword("password123");
                  }}
                  className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 text-center"
                >
                  <div className="font-semibold text-emerald-400">Tester</div>
                  <div className="text-[10px] text-slate-400">Người chơi</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthEmail("admin@example.com");
                    setAuthPassword("admin123");
                  }}
                  className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 text-center"
                >
                  <div className="font-semibold text-amber-400">Admin</div>
                  <div className="text-[10px] text-slate-400">Quản lý sân</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🏸</span>
            <span className="font-bold text-slate-300">SânCầu.vn</span>
            <span>— Hệ thống đặt sân cầu lông hiện đại & chuẩn xác.</span>
          </div>
          <div className="text-[11px]">
            API Backend Node.js & Express 5 • Frontend React & Tailwind CSS
          </div>
        </div>
      </footer>
    </div>
  );
}
