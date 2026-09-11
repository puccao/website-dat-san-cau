import React, { useState, useEffect } from "react";
import { api } from "../../services/api.js";
import { Booking } from "../../types/index.js";
import { useAuth } from "../../context/AuthContext.js";
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface MyBookingsPageProps {
  navigate: (path: string) => void;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedQrBooking, setSelectedQrBooking] = useState<Booking | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchBookings = () => {
    setLoading(true);
    // Fetch bookings for current user
    api.bookings
      .getMy(user?.id)
      .then((res) => {
        if (res.success) {
          setBookings(res.bookings);
        }
      })
      .catch((err) => {
        console.error("Error fetching my bookings:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  // Handle cancellation by user
  const handleCancelBooking = async (booking: Booking) => {
    const id = booking._id || booking.id;
    if (!id) return;

    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn đặt sân ${booking.bookingCode}?`)) {
      return;
    }

    try {
      setCancellingId(id);
      const res = await api.bookings.updateStatus(id, "cancelled", "Người dùng tự hủy qua hệ thống");
      if (res.success) {
        setFeedbackMsg({ text: `Đã hủy đơn ${booking.bookingCode} thành công`, type: "success" });
        fetchBookings();
      } else {
        setFeedbackMsg({ text: res.message || "Không thể hủy đơn", type: "error" });
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Lỗi khi hủy đơn", type: "error" });
    } finally {
      setCancellingId(null);
    }
  };

  // Filter bookings by tab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "all") return true;
    return b.status === activeTab;
  });

  const getStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Chờ duyệt / Chờ thanh toán</span>
          </span>
        );
      case "confirmed":
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Đã xác nhận giữ sân</span>
          </span>
        );
      case "completed":
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1">
            <span>Hoàn thành</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Đã hủy</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-emerald-400" />
              <span>Lịch Sử Đặt Sân Của Tôi</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Quản lý các vé đặt sân, xem mã đặt vé, mã QR thanh toán hoặc hủy vé khi cần
            </p>
          </div>

          <button
            onClick={() => navigate("/booking")}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition shadow-md shadow-emerald-500/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <span>+ Đặt Sân Mới</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-2 ${
            feedbackMsg.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs font-semibold opacity-80 hover:opacity-100"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-3">
        {[
          { id: "all", label: "Tất cả đơn", count: bookings.length },
          { id: "pending", label: "Chờ duyệt", count: bookings.filter((b) => b.status === "pending").length },
          { id: "confirmed", label: "Đã xác nhận", count: bookings.filter((b) => b.status === "confirmed").length },
          { id: "completed", label: "Hoàn thành", count: bookings.filter((b) => b.status === "completed").length },
          { id: "cancelled", label: "Đã hủy", count: bookings.filter((b) => b.status === "cancelled").length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === tab.id
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.id ? "bg-emerald-500/30 text-emerald-200" : "bg-slate-800 text-slate-400"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}

        <button
          onClick={fetchBookings}
          className="ml-auto p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition"
          title="Tải lại danh sách"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
          <p className="text-xs">Đang tải danh sách vé đặt sân...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="py-16 bg-slate-900/50 border border-slate-800 rounded-2xl text-center space-y-4 p-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-500 mx-auto flex items-center justify-center text-2xl">
            🏸
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Chưa có đơn đặt sân nào</h3>
            <p className="text-xs text-slate-400">
              {activeTab === "all"
                ? "Bạn chưa thực hiện đơn đặt sân nào trên hệ thống."
                : `Không có đơn nào ở trạng thái "${activeTab}".`}
            </p>
          </div>
          <button
            onClick={() => navigate("/booking")}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
          >
            Đặt sân ngay hôm nay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const id = b._id || b.id;
            const canCancel = b.status === "pending" || b.status === "confirmed";

            return (
              <div
                key={id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition space-y-4"
              >
                {/* Card Top: Code & Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-base text-emerald-400">
                      {b.bookingCode}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Tạo lúc: {new Date(b.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  {getStatusBadge(b.status)}
                </div>

                {/* Card Body: Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Cơ sở sân:</span>
                    <span className="font-semibold text-white flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{b.location}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Sân thi đấu:</span>
                    <span className="font-semibold text-white">{b.courtName}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Ngày & Khung giờ:</span>
                    <span className="font-semibold text-white flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        {b.date} ({b.startTime} - {b.endTime})
                      </span>
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Tổng tiền & Thanh toán:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-emerald-400">
                        {b.totalPrice.toLocaleString()}đ
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({b.paymentMethod === "transfer" ? "Chuyển khoản" : "Tại sân"})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Note if any */}
                {b.note && (
                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-300">
                    <span className="text-slate-400 font-medium">Ghi chú: </span>
                    <span>{b.note}</span>
                  </div>
                )}

                {/* Card Footer: Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-400">
                    Người đặt: <span className="text-white font-medium">{b.customerName}</span> ({b.customerPhone})
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View QR Code Button */}
                    {b.paymentMethod === "transfer" && b.status !== "cancelled" && (
                      <button
                        onClick={() => setSelectedQrBooking(b)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Mã QR Thanh Toán</span>
                      </button>
                    )}

                    {/* Cancel Booking Button */}
                    {canCancel && (
                      <button
                        onClick={() => handleCancelBooking(b)}
                        disabled={cancellingId === id}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition disabled:opacity-50"
                      >
                        {cancellingId === id ? "Đang hủy..." : "Hủy đặt sân"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VietQR Payment Modal */}
      {selectedQrBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Chuyển Khoản Qua QR</h3>
              <button
                onClick={() => setSelectedQrBooking(null)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Simulated VietQR */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto">
              <div className="w-48 h-48 bg-slate-100 flex flex-col items-center justify-center border border-slate-300 rounded-xl relative overflow-hidden">
                <QrCode className="w-36 h-36 text-slate-900" />
                <div className="absolute bottom-1 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                  VIETQR 24/7
                </div>
              </div>
            </div>

            <div className="text-xs text-left bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Ngân hàng:</span>
                <span className="font-semibold text-white">MB Bank (Quân Đội)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số tài khoản:</span>
                <span className="font-mono font-bold text-emerald-400">0987654321999</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chủ tài khoản:</span>
                <span className="font-semibold text-white">BADMINTON HUB VN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số tiền:</span>
                <span className="font-bold text-emerald-400">
                  {selectedQrBooking.totalPrice.toLocaleString()} VNĐ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nội dung CK:</span>
                <span className="font-mono font-bold text-amber-400">
                  {selectedQrBooking.bookingCode}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedQrBooking(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
            >
              Đã chuyển khoản / Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
