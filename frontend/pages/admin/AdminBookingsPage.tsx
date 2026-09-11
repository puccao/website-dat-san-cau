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
  Edit2,
  Eye,
  Plus,
  X,
  MapPin,
  DollarSign,
  QrCode,
  FileText,
  User,
  CheckCircle2,
} from "lucide-react";

export const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Detail Modal State
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

  // Edit Booking Modal State
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editFormData, setEditFormData] = useState({
    locationId: "",
    courtId: "",
    date: "",
    startTime: "17:00",
    endTime: "19:00",
    customerName: "",
    customerPhone: "",
    status: "confirmed" as "pending" | "confirmed" | "completed" | "cancelled",
    paymentMethod: "onsite" as "transfer" | "onsite",
    note: "",
  });
  const [editError, setEditError] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Create Direct Booking Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createFormData, setCreateFormData] = useState({
    locationId: "",
    courtId: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "17:00",
    endTime: "19:00",
    customerName: "",
    customerPhone: "",
    status: "confirmed" as "pending" | "confirmed" | "completed" | "cancelled",
    paymentMethod: "onsite" as "transfer" | "onsite",
    note: "Đặt trực tiếp tại quầy",
  });
  const [createError, setCreateError] = useState<string>("");
  const [creatingBooking, setCreatingBooking] = useState<boolean>(false);

  const fetchBookingsAndLocations = () => {
    setLoading(true);
    Promise.all([api.bookings.getAll(), api.locations.getAll()])
      .then(([bookingsRes, locsRes]) => {
        if (bookingsRes.success) {
          setBookings(bookingsRes.bookings);
        }
        if (locsRes.success) {
          setLocations(locsRes.locations);
          if (locsRes.locations.length > 0 && !createFormData.locationId) {
            setCreateFormData((prev) => ({
              ...prev,
              locationId: locsRes.locations[0].id,
              courtId: locsRes.locations[0].courts?.[0]?.id || "",
            }));
          }
        }
      })
      .catch((err) => console.error("Error fetching bookings:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookingsAndLocations();
  }, []);

  const handleUpdateStatus = async (
    id: string,
    newStatus: "pending" | "confirmed" | "completed" | "cancelled"
  ) => {
    try {
      setUpdatingId(id);
      const res = await api.bookings.updateStatus(id, newStatus);
      if (res.success) {
        setMessage({ text: `Đã chuyển đơn sang trạng thái: ${newStatus}`, type: "success" });
        fetchBookingsAndLocations();
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
        fetchBookingsAndLocations();
      } else {
        setMessage({ text: res.message || "Lỗi xóa đơn", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Lỗi xóa đơn", type: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const openEditModal = (b: Booking) => {
    setEditingBooking(b);
    setEditError("");
    setEditFormData({
      locationId: b.locationId || "",
      courtId: b.courtId,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      status: b.status,
      paymentMethod: b.paymentMethod,
      note: b.note || "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    setEditError("");

    const id = editingBooking._id || editingBooking.id || "";
    if (!id) return;

    try {
      setSavingEdit(true);
      const selectedLoc = locations.find((l) => l.id === editFormData.locationId);
      const selectedCourt = selectedLoc?.courts.find((c) => c.id === editFormData.courtId);

      const res = await api.bookings.update(id, {
        locationId: editFormData.locationId,
        location: selectedLoc?.name || editingBooking.location,
        courtId: editFormData.courtId,
        courtName: selectedCourt?.name || editingBooking.courtName,
        date: editFormData.date,
        startTime: editFormData.startTime,
        endTime: editFormData.endTime,
        customerName: editFormData.customerName.trim(),
        customerPhone: editFormData.customerPhone.trim(),
        status: editFormData.status,
        paymentMethod: editFormData.paymentMethod,
        note: editFormData.note,
      });

      if (res.success) {
        setMessage({ text: `Đã cập nhật đơn đặt sân ${editingBooking.bookingCode} thành công!`, type: "success" });
        setEditingBooking(null);
        fetchBookingsAndLocations();
      } else {
        setEditError(res.message || "Không thể cập nhật đơn đặt sân");
      }
    } catch (err: any) {
      setEditError(err.message || "Lỗi khi lưu chỉnh sửa");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!createFormData.customerName || !createFormData.customerPhone || !createFormData.courtId) {
      setCreateError("Vui lòng nhập tên, số điện thoại và chọn sân thi đấu");
      return;
    }

    try {
      setCreatingBooking(true);
      const selectedLoc = locations.find((l) => l.id === createFormData.locationId);
      const selectedCourt = selectedLoc?.courts.find((c) => c.id === createFormData.courtId);

      const res = await api.bookings.create({
        locationId: createFormData.locationId,
        location: selectedLoc?.name || "Cơ sở",
        courtId: createFormData.courtId,
        courtName: selectedCourt?.name || "Sân",
        date: createFormData.date,
        startTime: createFormData.startTime,
        endTime: createFormData.endTime,
        customerName: createFormData.customerName.trim(),
        customerPhone: createFormData.customerPhone.trim(),
        status: createFormData.status,
        paymentMethod: createFormData.paymentMethod,
        note: createFormData.note,
      });

      if (res.success) {
        setMessage({ text: `Đã tạo đơn đặt sân mới thành công! Mã: ${res.booking.bookingCode}`, type: "success" });
        setIsCreateOpen(false);
        setCreateFormData((prev) => ({
          ...prev,
          customerName: "",
          customerPhone: "",
          note: "Đặt trực tiếp tại quầy",
        }));
        fetchBookingsAndLocations();
      } else {
        setCreateError(res.message || "Không thể tạo đơn đặt sân");
      }
    } catch (err: any) {
      setCreateError(err.message || "Lỗi khi tạo đơn đặt sân");
    } finally {
      setCreatingBooking(false);
    }
  };

  // Filter logic
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (locationFilter !== "all" && b.locationId !== locationFilter) return false;
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

  // Calculate metrics for current filter
  const totalFilteredRevenue = filteredBookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;

  const currentEditLocation = locations.find((l) => l.id === editFormData.locationId);
  const currentCreateLocation = locations.find((l) => l.id === createFormData.locationId);

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
            CRUD toàn diện: Thêm đơn tại quầy, sửa lịch & đổi sân, kiểm tra xung đột giờ và duyệt vé
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đơn tại quầy</span>
          </button>

          <button
            onClick={fetchBookingsAndLocations}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* KPI Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 block">Tổng đơn hệ thống</span>
          <span className="text-xl font-black text-white">{bookings.length} đơn</span>
        </div>
        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-3.5">
          <span className="text-[11px] text-amber-400 block">Chờ duyệt (Pending)</span>
          <span className="text-xl font-black text-amber-400">{pendingCount} yêu cầu</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 block">Đã duyệt & Giữ chỗ</span>
          <span className="text-xl font-black text-emerald-400">{confirmedCount} đơn</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 block">Doanh thu theo bộ lọc</span>
          <span className="text-xl font-black text-emerald-400">
            {totalFilteredRevenue.toLocaleString()}đ
          </span>
        </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên khách, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">Tất cả cơ sở</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="px-2.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium shrink-0"
                title="Xóa lọc ngày"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Status Pill Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
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

          <span className="text-xs text-slate-400">
            Hiển thị: <strong className="text-white">{filteredBookings.length}</strong> đơn
          </span>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
            Đang tải dữ liệu đơn đặt sân...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Không tìm thấy đơn đặt sân nào phù hợp với bộ lọc
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Sân & Cơ sở</th>
                  <th className="py-3 px-4">Ngày & Khung giờ</th>
                  <th className="py-3 px-4">Tổng tiền & HT</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác quản trị</th>
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
                        <div className="font-semibold text-slate-200">{b.courtName}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
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
                          {b.paymentMethod === "transfer" ? "Chuyển khoản QR" : "Tại quầy"}
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
                          {/* Xem chi tiết */}
                          <button
                            onClick={() => setViewingBooking(b)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Xem chi tiết đơn"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Chỉnh sửa đơn */}
                          <button
                            onClick={() => openEditModal(b)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Chỉnh sửa ngày giờ & sân"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Duyệt đơn nếu pending */}
                          {b.status === "pending" && (
                            <button
                              onClick={() => handleUpdateStatus(id, "confirmed")}
                              disabled={isUpdating}
                              title="Duyệt đơn này"
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition"
                            >
                              Duyệt
                            </button>
                          )}

                          {/* Hoàn thành nếu confirmed */}
                          {b.status === "confirmed" && (
                            <button
                              onClick={() => handleUpdateStatus(id, "completed")}
                              disabled={isUpdating}
                              title="Đánh dấu đã chơi xong"
                              className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-medium transition"
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
                              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-medium transition"
                            >
                              Hủy
                            </button>
                          )}

                          {/* Xóa vĩnh viễn */}
                          <button
                            onClick={() => handleDeleteBooking(id, b.bookingCode)}
                            disabled={isUpdating}
                            title="Xóa vĩnh viễn"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
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

      {/* View Detail Modal */}
      {viewingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] text-slate-400 block font-mono">MÃ ĐƠN HÀNG</span>
                <h3 className="font-mono font-bold text-emerald-400 text-lg">
                  {viewingBooking.bookingCode}
                </h3>
              </div>
              <button
                onClick={() => setViewingBooking(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-slate-400 block">Khách hàng:</span>
                  <span className="font-semibold text-white">{viewingBooking.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Số điện thoại:</span>
                  <span className="font-semibold text-emerald-400">{viewingBooking.customerPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Cơ sở:</span>
                  <span className="font-semibold text-white">{viewingBooking.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Sân thi đấu:</span>
                  <span className="font-semibold text-amber-400">{viewingBooking.courtName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Ngày đặt:</span>
                  <span className="font-semibold text-white">{viewingBooking.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Khung giờ:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {viewingBooking.startTime} - {viewingBooking.endTime} ({viewingBooking.durationHours}h)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tổng thanh toán:</span>
                  <span className="font-bold text-white text-sm">
                    {viewingBooking.totalPrice.toLocaleString()}đ
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Hình thức thanh toán:</span>
                  <span className="font-semibold text-slate-200">
                    {viewingBooking.paymentMethod === "transfer" ? "Chuyển khoản QR" : "Tại quầy"}
                  </span>
                </div>
              </div>

              {viewingBooking.note && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                  <span className="text-slate-400 block mb-1 font-semibold">Ghi chú từ khách/quầy:</span>
                  <p>{viewingBooking.note}</p>
                </div>
              )}

              {viewingBooking.qrPaymentUrl && viewingBooking.paymentMethod === "transfer" && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
                  <img
                    src={viewingBooking.qrPaymentUrl}
                    alt="VietQR"
                    className="w-16 h-16 object-contain rounded bg-white p-1"
                  />
                  <div>
                    <span className="font-bold text-white block">Mã VietQR Chuyển Khoản</span>
                    <span className="text-slate-400 text-[11px]">
                      Kiểm tra sao kê với nội dung: <strong className="text-emerald-400">{viewingBooking.bookingCode}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setViewingBooking(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">
                  Chỉnh Sửa Đơn Đặt: {editingBooking.bookingCode}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Điều chỉnh ngày, giờ hoặc đổi sân đấu với cơ chế kiểm tra trùng lịch
                </p>
              </div>
              <button
                onClick={() => setEditingBooking(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Tên khách hàng *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.customerName}
                    onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={editFormData.customerPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Chọn Cơ sở</label>
                  <select
                    value={editFormData.locationId}
                    onChange={(e) => {
                      const newLocId = e.target.value;
                      const loc = locations.find((l) => l.id === newLocId);
                      setEditFormData({
                        ...editFormData,
                        locationId: newLocId,
                        courtId: loc?.courts?.[0]?.id || "",
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Chọn Sân</label>
                  <select
                    value={editFormData.courtId}
                    onChange={(e) => setEditFormData({ ...editFormData, courtId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {currentEditLocation?.courts.map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name} ({court.status === "maintenance" ? "Bảo trì" : "Hoạt động"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Ngày chơi *</label>
                  <input
                    type="date"
                    required
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={editFormData.startTime}
                    onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Giờ kết thúc</label>
                  <input
                    type="time"
                    required
                    value={editFormData.endTime}
                    onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Trạng thái đơn</label>
                  <select
                    value={editFormData.status}
                    onChange={(e: any) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="pending">Chờ duyệt (Pending)</option>
                    <option value="confirmed">Đã duyệt & Giữ chỗ (Confirmed)</option>
                    <option value="completed">Đã hoàn thành (Completed)</option>
                    <option value="cancelled">Đã hủy (Cancelled)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Hình thức thanh toán</label>
                  <select
                    value={editFormData.paymentMethod}
                    onChange={(e: any) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="onsite">Tại quầy (Tiền mặt/POS)</option>
                    <option value="transfer">Chuyển khoản VietQR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Ghi chú đơn</label>
                <input
                  type="text"
                  value={editFormData.note}
                  onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5"
                >
                  {savingEdit ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Direct Booking Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Tạo Đơn Đặt Sân Trực Tiếp Tại Quầy</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Tạo vé nhanh cho khách vãng lai hoặc khách gọi hotline
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Tên khách hàng *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Anh Hoàng"
                    value={createFormData.customerName}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, customerName: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0987654321"
                    value={createFormData.customerPhone}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, customerPhone: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Chọn Cơ sở</label>
                  <select
                    value={createFormData.locationId}
                    onChange={(e) => {
                      const newLocId = e.target.value;
                      const loc = locations.find((l) => l.id === newLocId);
                      setCreateFormData({
                        ...createFormData,
                        locationId: newLocId,
                        courtId: loc?.courts?.[0]?.id || "",
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Chọn Sân</label>
                  <select
                    value={createFormData.courtId}
                    onChange={(e) => setCreateFormData({ ...createFormData, courtId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {currentCreateLocation?.courts.map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name} ({court.status === "maintenance" ? "Bảo trì" : "Hoạt động"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Ngày chơi *</label>
                  <input
                    type="date"
                    required
                    value={createFormData.date}
                    onChange={(e) => setCreateFormData({ ...createFormData, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={createFormData.startTime}
                    onChange={(e) => setCreateFormData({ ...createFormData, startTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Giờ kết thúc</label>
                  <input
                    type="time"
                    required
                    value={createFormData.endTime}
                    onChange={(e) => setCreateFormData({ ...createFormData, endTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Hình thức thanh toán</label>
                  <select
                    value={createFormData.paymentMethod}
                    onChange={(e: any) =>
                      setCreateFormData({ ...createFormData, paymentMethod: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="onsite">Tại quầy (Tiền mặt/POS)</option>
                    <option value="transfer">Chuyển khoản VietQR</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Ghi chú</label>
                  <input
                    type="text"
                    value={createFormData.note}
                    onChange={(e) => setCreateFormData({ ...createFormData, note: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Hủy
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
