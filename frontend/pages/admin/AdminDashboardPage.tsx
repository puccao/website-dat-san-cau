import React, { useState, useEffect } from "react";
import { api } from "../../services/api.js";
import { AdminStats, Booking, Location } from "../../types/index.js";
import {
  TrendingUp,
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  MapPin,
  RefreshCw,
  ArrowUpRight,
  AlertCircle,
  Zap,
  DollarSign,
  BarChart3,
  Calendar,
  Plus,
  Flame,
  PieChart,
} from "lucide-react";

interface AdminDashboardPageProps {
  navigate: (path: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ navigate }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Quick direct booking modal state
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState<boolean>(false);
  const [selectedLocId, setSelectedLocId] = useState<string>("");
  const [selectedCourtId, setSelectedCourtId] = useState<string>("");
  const [bookingDate, setBookingDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState<string>("17:00");
  const [endTime, setEndTime] = useState<string>("19:00");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "onsite">("onsite");
  const [bookingNote, setBookingNote] = useState<string>("Khách đặt trực tiếp tại quầy");
  const [creatingBooking, setCreatingBooking] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string>("");

  const loadData = () => {
    setLoading(true);
    Promise.all([api.admin.getStats(), api.bookings.getAll(), api.locations.getAll()])
      .then(([statsRes, bookingsRes, locsRes]) => {
        if (statsRes.success) setStats(statsRes.stats);
        if (bookingsRes.success) setRecentBookings(bookingsRes.bookings.slice(0, 8));
        if (locsRes.success) {
          setLocations(locsRes.locations);
          if (locsRes.locations.length > 0 && !selectedLocId) {
            setSelectedLocId(locsRes.locations[0].id);
            if (locsRes.locations[0].courts?.length > 0) {
              setSelectedCourtId(locsRes.locations[0].courts[0].id);
            }
          }
        }
      })
      .catch((err) => console.error("Admin dashboard error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickApprove = async (bookingId: string) => {
    try {
      setUpdatingId(bookingId);
      const res = await api.bookings.updateStatus(
        bookingId,
        "confirmed",
        "Admin duyệt nhanh từ dashboard"
      );
      if (res.success) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateDirectBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError("");

    if (!customerName || !customerPhone || !selectedLocId || !selectedCourtId) {
      setBookingError("Vui lòng điền đầy đủ tên, số điện thoại và chọn sân");
      return;
    }

    try {
      setCreatingBooking(true);
      const loc = locations.find((l) => l.id === selectedLocId);
      const court = loc?.courts.find((c) => c.id === selectedCourtId);

      const res = await api.bookings.create({
        locationId: selectedLocId,
        location: loc?.name || "Cơ sở",
        courtId: selectedCourtId,
        courtName: court?.name || "Sân đấu",
        date: bookingDate,
        startTime,
        endTime,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethod,
        note: bookingNote,
        status: "confirmed", // Direct counter booking is confirmed immediately
      });

      if (res.success) {
        setIsQuickBookingOpen(false);
        setCustomerName("");
        setCustomerPhone("");
        loadData();
      } else {
        setBookingError(res.message || "Không thể tạo đơn đặt sân");
      }
    } catch (err: any) {
      setBookingError(err.message || "Lỗi tạo đơn đặt sân");
    } finally {
      setCreatingBooking(false);
    }
  };

  const selectedLocation = locations.find((l) => l.id === selectedLocId);
  const maxRevenueDay = stats?.dailyRevenue
    ? Math.max(...stats.dailyRevenue.map((d) => d.revenue), 1)
    : 1;

  return (
    <div className="space-y-8 pb-10">
      {/* Top Header & Fast Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Bảng Chỉ Số & Vận Hành
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold uppercase tracking-wider">
              Real-time
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Theo dõi doanh số, lưu lượng sân, phân tích khung giờ cao điểm và điều phối lịch thi đấu
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsQuickBookingOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đơn tại quầy</span>
          </button>

          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Doanh thu thực nhận */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tổng doanh thu thực tế</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {stats ? `${stats.totalRevenue.toLocaleString()}đ` : "---"}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
            <span>Hôm nay:</span>
            <span className="font-bold text-white">
              {stats ? `${stats.todayRevenue.toLocaleString()}đ` : "0đ"}
            </span>
          </div>
        </div>

        {/* Card 2: Đơn chờ duyệt & Tỷ lệ hoàn thành */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-lg shadow-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300">Đơn chờ duyệt (Pending)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">
            {stats ? stats.pendingCount : "---"}
            <span className="text-xs font-normal text-slate-400 ml-2">yêu cầu</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
            <span>Đã duyệt & giữ chỗ:</span>
            <span className="font-bold text-emerald-400">{stats?.confirmedCount || 0}</span>
          </div>
        </div>

        {/* Card 3: Tỷ lệ lấp đầy hôm nay */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tỷ lệ kín sân hôm nay</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-300">
            {stats ? `${stats.utilizationRate}%` : "---"}
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats ? stats.utilizationRate : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Card 4: Giá trị đơn TB & Hội viên */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Giá trị đơn trung bình (AOV)</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {stats?.avgBookingValue ? `${stats.avgBookingValue.toLocaleString()}đ` : "---"}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
            <span>Tổng hội viên:</span>
            <span className="font-bold text-cyan-400">{stats?.totalUsers || 0} tài khoản</span>
          </div>
        </div>
      </div>

      {/* Analytics Row: 7-day Trend + Time-slot Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-day revenue trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Biểu Đồ Doanh Thu 7 Ngày Gần Nhất</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Thống kê số tiền thực nhận và lượt đặt sân theo từng ngày
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              {stats?.monthRevenue ? `Tháng này: ${stats.monthRevenue.toLocaleString()}đ` : "7 ngày qua"}
            </span>
          </div>

          {/* Bar Chart Visualizer */}
          <div className="pt-6 pb-2">
            <div className="flex items-end justify-between gap-3 h-44">
              {stats?.dailyRevenue && stats.dailyRevenue.length > 0 ? (
                stats.dailyRevenue.map((item) => {
                  const heightPercent =
                    maxRevenueDay > 0
                      ? Math.max(12, Math.round((item.revenue / maxRevenueDay) * 100))
                      : 12;
                  const dayDisplay = item.date.slice(5); // MM-DD
                  return (
                    <div
                      key={item.date}
                      className="flex-1 flex flex-col items-center gap-2 group h-full justify-end"
                    >
                      {/* Tooltip on hover */}
                      <div className="text-[10px] text-emerald-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.revenue > 0 ? `${(item.revenue / 1000).toLocaleString()}k` : "0"}
                      </div>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          item.revenue > 0
                            ? "bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-500 group-hover:to-teal-300 shadow-md shadow-emerald-950"
                            : "bg-slate-800 group-hover:bg-slate-700"
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                      <div className="text-[11px] font-mono text-slate-400 group-hover:text-white transition">
                        {dayDisplay}
                      </div>
                      <div className="text-[9px] text-slate-500 font-medium -mt-1">
                        {item.bookingsCount} đơn
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full text-center text-slate-500 text-xs py-16">
                  Chưa có số liệu biến động tuần
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Peak Hours & Slots */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Phân Bổ Khung Giờ Đắt Khách</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tần suất đặt chỗ theo khung giờ để tối ưu điều phối nhân sự
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            {stats?.timeSlots?.map((slot) => {
              const totalSlotBookings = stats.timeSlots?.reduce((s, i) => s + i.count, 0) || 1;
              const percent = Math.min(100, Math.round((slot.count / totalSlotBookings) * 100));
              const isPeak = slot.slot.startsWith("16") || slot.slot.startsWith("19");

              return (
                <div key={slot.slot} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      {isPeak && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
                      {slot.label}
                    </span>
                    <span className="font-bold text-white">
                      {slot.count} đơn ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPeak ? "bg-amber-400" : "bg-teal-500"
                      }`}
                      style={{ width: `${Math.max(4, percent)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
            <span>Khung giờ vàng (16h - 22h) áp dụng đơn giá cao điểm</span>
          </div>
        </div>
      </div>

      {/* Recent Bookings Queue */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-amber-400" />
              <span>Đơn Đặt Sân Cần Xử Lý & Điều Phối</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Danh sách các đơn đặt mới nhất gửi lên hệ thống
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/bookings")}
            className="text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1"
          >
            <span>Quản lý toàn bộ đơn đặt</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-500 mb-2" />
            Đang tải dữ liệu...
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">Chưa có đơn nào trong hệ thống</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Mã đơn</th>
                  <th className="py-3 px-3">Khách hàng</th>
                  <th className="py-3 px-3">Cơ sở & Sân</th>
                  <th className="py-3 px-3">Thời gian</th>
                  <th className="py-3 px-3">Tổng tiền</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3 text-right">Hành động nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentBookings.map((b) => {
                  const id = b._id || b.id || "";
                  return (
                    <tr key={id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        {b.bookingCode}
                      </td>
                      <td className="py-3 px-3 font-medium text-white">
                        <div>{b.customerName}</div>
                        <div className="text-[10px] text-slate-400">{b.customerPhone}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div className="font-semibold text-white">{b.courtName}</div>
                        <div className="text-[10px] text-slate-400">{b.location}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div>{b.date}</div>
                        <div className="text-[10px] text-emerald-400 font-mono font-bold">
                          {b.startTime} - {b.endTime}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-white">
                        {b.totalPrice.toLocaleString()}đ
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            b.status === "pending"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : b.status === "confirmed"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : b.status === "completed"
                              ? "bg-slate-800 text-slate-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {b.status === "pending"
                            ? "Chờ duyệt"
                            : b.status === "confirmed"
                            ? "Đã duyệt"
                            : b.status === "completed"
                            ? "Hoàn tất"
                            : "Đã hủy"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {b.status === "pending" ? (
                          <button
                            onClick={() => handleQuickApprove(id)}
                            disabled={updatingId === id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition"
                          >
                            {updatingId === id ? "..." : "Duyệt ngay"}
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate("/admin/bookings")}
                            className="text-slate-400 hover:text-white text-[11px] underline"
                          >
                            Xem chi tiết
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK DIRECT BOOKING MODAL */}
      {isQuickBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Tạo Đơn Đặt Sân Trực Tiếp Tại Quầy</span>
              </h3>
              <button
                onClick={() => setIsQuickBookingOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Đóng
              </button>
            </div>

            {bookingError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
                {bookingError}
              </div>
            )}

            <form onSubmit={handleCreateDirectBooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">Tên khách hàng *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="VD: Anh Tuấn"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 mb-1 block">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="VD: 0988776655"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">Cơ sở *</label>
                  <select
                    value={selectedLocId}
                    onChange={(e) => {
                      setSelectedLocId(e.target.value);
                      const loc = locations.find((l) => l.id === e.target.value);
                      if (loc?.courts?.length) setSelectedCourtId(loc.courts[0].id);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 mb-1 block">Sân đấu *</label>
                  <select
                    value={selectedCourtId}
                    onChange={(e) => setSelectedCourtId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {selectedLocation?.courts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">Ngày chơi *</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 mb-1 block">Giờ bắt đầu *</label>
                  <input
                    type="time"
                    required
                    step="1800"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 mb-1 block">Giờ kết thúc *</label>
                  <input
                    type="time"
                    required
                    step="1800"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">Hình thức thanh toán</label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="onsite">Thanh toán tại quầy (Tiền mặt/POS)</option>
                    <option value="transfer">Chuyển khoản ngân hàng</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 mb-1 block">Ghi chú</label>
                  <input
                    type="text"
                    value={bookingNote}
                    onChange={(e) => setBookingNote(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickBookingOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={creatingBooking}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5"
                >
                  {creatingBooking ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Xác nhận tạo đơn</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

