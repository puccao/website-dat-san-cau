import React, { useState, useEffect } from "react";
import { api } from "../../services/api.js";
import { Booking, Location } from "../../types/index.js";
import {
  CalendarCheck,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Phone,
  Calendar,
  AlertCircle,
} from "lucide-react";

export const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchBookings = () => {
    setLoading(true);
    api.bookings
      .getAll()
      .then((res) => {
        if (res.success) {
          setBookings(res.bookings);
        }
      })
      .catch((err) => console.error("Error fetching bookings:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (
    id: string,
    newStatus: "pending" | "confirmed" | "completed" | "cancelled"
  ) => {
    try {
      setUpdatingId(id);
      const res = await api.bookings.updateStatus(id, newStatus);
      if (res.success) {
        setMessage({ text: `Đã cập nhật trạng thái đơn sang: ${newStatus}`, type: "success" });
        fetchBookings();
      } else {
        setMessage({ text: res.message || "Cập nhật thất bại", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Lỗi khi cập nhật trạng thái", type: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteBooking = async (id: string, code: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn đơn đặt ${code}?`)) return;

    try {
      setUpdatingId(id);
      const res = await api.bookings.delete(id);
      if (res.success) {
        setMessage({ text: `Đã xóa đơn ${code} thành công`, type: "success" });
        fetchBookings();
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Lỗi xóa đơn", type: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter logic
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (selectedDate && b.date !== selectedDate) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchCode = b.bookingCode?.toLowerCase().includes(term);
      const matchName = b.customerName?.toLowerCase().includes(term);
      const matchPhone = b.customerPhone?.toLowerCase().includes(term);
      const matchCourt = b.courtName?.toLowerCase().includes(term);
      if (!matchCode && !matchName && !matchPhone && !matchCourt) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-amber-400" />
            <span>Quản Lý Toàn Bộ Đơn Đặt Sân</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Duyệt đơn, kiểm tra lịch thi đấu và điều chỉnh trạng thái vé đặt sân
          </p>
        </div>

        <button
          onClick={fetchBookings}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Message feedback */}
      {message && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold opacity-80">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Clear Filters */}
          <div className="flex items-center gap-2">
            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
              >
                Xóa lọc ngày
              </button>
            )}
            <span className="text-xs text-slate-400 ml-auto">
              Tìm thấy: <strong className="text-white">{filteredBookings.length}</strong> đơn
            </span>
          </div>
        </div>

        {/* Status Pill Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          {[
            { id: "all", label: "Tất cả" },
            { id: "pending", label: "Chờ duyệt (Pending)" },
            { id: "confirmed", label: "Đã duyệt (Confirmed)" },
            { id: "completed", label: "Hoàn thành (Completed)" },
            { id: "cancelled", label: "Đã hủy (Cancelled)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                statusFilter === tab.id
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
            Đang tải dữ liệu đơn đặt sân...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Không tìm thấy đơn nào phù hợp với bộ lọc
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Sân & Địa điểm</th>
                  <th className="py-3 px-4">Khung giờ</th>
                  <th className="py-3 px-4">Số tiền & HT</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Hành động quản trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBookings.map((b) => {
                  const id = b._id || b.id || "";
                  const isUpdating = updatingId === id;

                  return (
                    <tr key={id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {b.bookingCode}
                        <div className="text-[10px] text-slate-500 font-sans">
                          {new Date(b.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{b.customerName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>{b.customerPhone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{b.courtName}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {b.location}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{b.date}</div>
                        <div className="text-[11px] text-emerald-400 font-mono">
                          {b.startTime} – {b.endTime} ({b.durationHours}h)
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">
                          {b.totalPrice.toLocaleString()}đ
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {b.paymentMethod === "transfer" ? "Chuyển khoản QR" : "Tại sân"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold inline-block ${
                            b.status === "pending"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : b.status === "confirmed"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : b.status === "completed"
                              ? "bg-slate-800 text-slate-300 border border-slate-700"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {b.status === "pending"
                            ? "Chờ duyệt"
                            : b.status === "confirmed"
                            ? "Đã duyệt"
                            : b.status === "completed"
                            ? "Hoàn thành"
                            : "Đã hủy"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Duyệt đơn nếu pending */}
                          {b.status === "pending" && (
                            <button
                              onClick={() => handleUpdateStatus(id, "confirmed")}
                              disabled={isUpdating}
                              title="Duyệt đơn này"
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition"
                            >
                              Duyệt
                            </button>
                          )}

                          {/* Hoàn thành nếu confirmed */}
                          {b.status === "confirmed" && (
                            <button
                              onClick={() => handleUpdateStatus(id, "completed")}
                              disabled={isUpdating}
                              title="Đánh dấu đã hoàn thành"
                              className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-medium transition"
                            >
                              Xong
                            </button>
                          )}

                          {/* Hủy nếu chưa hoàn thành hoặc chưa hủy */}
                          {b.status !== "cancelled" && b.status !== "completed" && (
                            <button
                              onClick={() => handleUpdateStatus(id, "cancelled")}
                              disabled={isUpdating}
                              title="Hủy đơn này"
                              className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-medium transition"
                            >
                              Hủy
                            </button>
                          )}

                          {/* Xóa vĩnh viễn */}
                          <button
                            onClick={() => handleDeleteBooking(id, b.bookingCode)}
                            disabled={isUpdating}
                            title="Xóa vĩnh viễn"
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
