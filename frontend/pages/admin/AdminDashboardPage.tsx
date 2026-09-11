import React, { useState, useEffect } from "react";
import { api } from "../../services/api.js";
import { AdminStats, Booking } from "../../types/index.js";
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
} from "lucide-react";

interface AdminDashboardPageProps {
  navigate: (path: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ navigate }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([api.admin.getStats(), api.bookings.getAll()])
      .then(([statsRes, bookingsRes]) => {
        if (statsRes.success) setStats(statsRes.stats);
        if (bookingsRes.success) setRecentBookings(bookingsRes.bookings.slice(0, 6));
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
      const res = await api.bookings.updateStatus(bookingId, "confirmed", "Admin duyệt nhanh từ dashboard");
      if (res.success) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <span>Tổng Quan Quản Trị Hệ Thống</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Admin Portal
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Theo dõi doanh thu, tỷ lệ sử dụng sân và xử lý các yêu cầu đặt chỗ thời gian thực
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Cập nhật số liệu</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Tổng doanh thu */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tổng doanh thu thực nhận</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {stats ? `${stats.totalRevenue.toLocaleString()}đ` : "---"}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>Hôm nay:</span>
            <span className="font-bold text-white">
              {stats ? `${stats.todayRevenue.toLocaleString()}đ` : "0đ"}
            </span>
          </div>
        </div>

        {/* Card 2: Đơn chờ duyệt */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-lg shadow-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300">Đơn chờ duyệt (Pending)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">
            {stats ? stats.pendingCount : "---"}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>Cần xác nhận giữ chỗ cho khách</span>
          </div>
        </div>

        {/* Card 3: Tỷ lệ lấp đầy sân hôm nay */}
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

        {/* Card 4: Tổng số đơn & Hội viên */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tổng số đơn & Hội viên</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {stats ? stats.totalBookings : "---"}
            <span className="text-xs font-normal text-slate-400 ml-1.5">đơn đặt</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Hội viên: {stats?.totalUsers || 2}</span>
            <span>Cơ sở: {stats?.totalLocations || 3}</span>
          </div>
        </div>
      </div>

      {/* Recent Bookings Queue */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-amber-400" />
              <span>Các Đơn Đặt Sân Mới Nhất Cần Xử Lý</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Danh sách 6 đơn đặt mới nhất gửi lên hệ thống
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/bookings")}
            className="text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1"
          >
            <span>Xem tất cả đơn</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-500 mb-2" />
            Đang tải dữ liệu...
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">Chưa có đơn nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Mã đơn</th>
                  <th className="py-3 px-3">Khách hàng</th>
                  <th className="py-3 px-3">Cơ sở & Sân</th>
                  <th className="py-3 px-3">Thời gian chơi</th>
                  <th className="py-3 px-3">Tổng tiền</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3 text-right">Thao tác nhanh</th>
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
                        <div className="text-[10px] text-slate-500">{b.customerPhone}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div>{b.courtName}</div>
                        <div className="text-[10px] text-slate-500">{b.location}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div>{b.date}</div>
                        <div className="text-[10px] text-emerald-400 font-mono">
                          {b.startTime} - {b.endTime}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-white">
                        {b.totalPrice.toLocaleString()}đ
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            b.status === "pending"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : b.status === "confirmed"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : b.status === "completed"
                              ? "bg-slate-800 text-slate-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {b.status === "pending" ? (
                          <button
                            onClick={() => handleQuickApprove(id)}
                            disabled={updatingId === id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition"
                          >
                            {updatingId === id ? "..." : "Duyệt đơn"}
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate("/admin/bookings")}
                            className="text-slate-400 hover:text-white text-[11px] underline"
                          >
                            Chi tiết
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
    </div>
  );
};
