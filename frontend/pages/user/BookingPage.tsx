import React, { useState, useEffect } from "react";
import { api } from "../../services/api.js";
import { Location, Court, Booking } from "../../types/index.js";
import { useAuth } from "../../context/AuthContext.js";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  QrCode,
  CreditCard,
  Banknote,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Plus,
  Minus,
  RotateCcw,
} from "lucide-react";

interface BookingPageProps {
  navigate: (path: string) => void;
}

// 1-hour slots from 06:00 to 22:00
const HOURLY_SLOTS = [
  { start: "06:00", end: "07:00", isPeak: false },
  { start: "07:00", end: "08:00", isPeak: false },
  { start: "08:00", end: "09:00", isPeak: false },
  { start: "09:00", end: "10:00", isPeak: false },
  { start: "10:00", end: "11:00", isPeak: false },
  { start: "11:00", end: "12:00", isPeak: false },
  { start: "12:00", end: "13:00", isPeak: false },
  { start: "13:00", end: "14:00", isPeak: false },
  { start: "14:00", end: "15:00", isPeak: false },
  { start: "15:00", end: "16:00", isPeak: false },
  { start: "16:00", end: "17:00", isPeak: true },
  { start: "17:00", end: "18:00", isPeak: true },
  { start: "18:00", end: "19:00", isPeak: true },
  { start: "19:00", end: "20:00", isPeak: true },
  { start: "20:00", end: "21:00", isPeak: true },
  { start: "21:00", end: "22:00", isPeak: true },
];

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}

export const BookingPage: React.FC<BookingPageProps> = ({ navigate }) => {
  const { user } = useAuth();

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);

  // Date defaults to today in YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Time selection (start and end in "HH:mm")
  const [startTime, setStartTime] = useState<string>("17:00");
  const [endTime, setEndTime] = useState<string>("19:00");
  const [rangeSelectingFrom, setRangeSelectingFrom] = useState<string | null>(null);

  // Existing bookings for conflict checking
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(false);

  // Customer form details
  const [customerName, setCustomerName] = useState<string>(user?.name || "Nguyễn Văn An");
  const [customerPhone, setCustomerPhone] = useState<string>(user?.phone || "0987654321");
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "onsite">("transfer");
  const [note, setNote] = useState<string>("");

  // Submitting state & feedback
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);

  // Update customer fields when user login state changes
  useEffect(() => {
    if (user) {
      if (user.name) setCustomerName(user.name);
      if (user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  // Load locations on mount
  useEffect(() => {
    api.locations
      .getAll()
      .then((res) => {
        if (res.success && res.locations.length > 0) {
          setLocations(res.locations);
          const firstLoc = res.locations[0];
          setSelectedLocation(firstLoc);
          if (firstLoc.courts && firstLoc.courts.length > 0) {
            setSelectedCourt(firstLoc.courts[0]);
          }
        }
      })
      .catch((err) => console.error("Error loading locations:", err));
  }, []);

  // Fetch occupied bookings when location, court, or date changes
  useEffect(() => {
    if (!selectedLocation || !selectedCourt || !selectedDate) return;

    setLoadingBookings(true);
    api.bookings
      .getAll({
        locationId: selectedLocation.id,
        courtId: selectedCourt.id,
        date: selectedDate,
      })
      .then((res) => {
        if (res.success) {
          // Filter only active bookings (pending or confirmed)
          const active = res.bookings.filter(
            (b) => b.status === "pending" || b.status === "confirmed"
          );
          setExistingBookings(active);
        }
      })
      .catch((err) => console.error("Error fetching bookings:", err))
      .finally(() => setLoadingBookings(false));
  }, [selectedLocation, selectedCourt, selectedDate]);

  // Check if a specific hour slot is occupied by an existing booking
  const isSlotOccupied = (slotStart: string, slotEnd: string): Booking | undefined => {
    const sMin = timeToMinutes(slotStart);
    const eMin = timeToMinutes(slotEnd);

    return existingBookings.find((b) => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return bStart < eMin && bEnd > sMin;
    });
  };

  // Check if a slot is currently selected in user's range
  const isSlotSelected = (slotStart: string, slotEnd: string): boolean => {
    const startM = timeToMinutes(startTime);
    const endM = timeToMinutes(endTime);
    const slotS = timeToMinutes(slotStart);
    const slotE = timeToMinutes(slotEnd);

    return slotS >= startM && slotE <= endM;
  };

  // Unified Schedule Board: slot click handler
  const handleSlotClick = (slotStart: string, slotEnd: string) => {
    setErrorMessage(null);

    // If slot is occupied, cannot pick it
    if (isSlotOccupied(slotStart, slotEnd)) {
      setErrorMessage(`Khung giờ ${slotStart} - ${slotEnd} đã được đặt trước.`);
      return;
    }

    if (!rangeSelectingFrom) {
      // First click: select 1 hour or start of range
      setRangeSelectingFrom(slotStart);
      setStartTime(slotStart);
      setEndTime(slotEnd);
    } else {
      // Second click: select range from rangeSelectingFrom to clicked slot
      const fromMin = timeToMinutes(rangeSelectingFrom);
      const toMin = timeToMinutes(slotEnd);

      if (toMin <= fromMin) {
        // Clicked behind: reset start to clicked slot
        setRangeSelectingFrom(slotStart);
        setStartTime(slotStart);
        setEndTime(slotEnd);
      } else {
        // Check if any slot in between is occupied
        const conflict = existingBookings.find((b) => {
          const bStart = timeToMinutes(b.startTime);
          const bEnd = timeToMinutes(b.endTime);
          return bStart < toMin && bEnd > fromMin;
        });

        if (conflict) {
          setErrorMessage(
            `Khoảng giờ bị vướng lịch đã đặt (${conflict.startTime} - ${conflict.endTime}). Vui lòng chọn khoảng giờ liền mạch trống!`
          );
          setRangeSelectingFrom(null);
          return;
        }

        setStartTime(rangeSelectingFrom);
        setEndTime(slotEnd);
        setRangeSelectingFrom(null);
      }
    }
  };

  // Quick adjust duration buttons (+1h, -1h, reset)
  const adjustDuration = (deltaHours: number) => {
    setErrorMessage(null);
    const curEndM = timeToMinutes(endTime);
    const curStartM = timeToMinutes(startTime);
    const newEndM = curEndM + deltaHours * 60;

    if (newEndM <= curStartM) return;
    if (newEndM > 22 * 60) {
      setErrorMessage("Sân đóng cửa lúc 22:00.");
      return;
    }

    // Check conflict
    const conflict = existingBookings.find((b) => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return bStart < newEndM && bEnd > curStartM;
    });

    if (conflict) {
      setErrorMessage(`Không thể tăng thêm giờ vì vướng lịch đã đặt lúc ${conflict.startTime}.`);
      return;
    }

    setEndTime(minutesToTime(newEndM));
  };

  // Pricing calculation
  const regPrice = selectedCourt?.regularPrice || 80000;
  const pkPrice = selectedCourt?.peakPrice || 120000;

  const startM = timeToMinutes(startTime);
  const endM = timeToMinutes(endTime);
  const totalMinutes = Math.max(0, endM - startM);
  const durationHours = totalMinutes / 60;

  let regularMinutes = 0;
  let peakMinutes = 0;
  for (let m = startM; m < endM; m++) {
    if (m >= 16 * 60) {
      peakMinutes++;
    } else {
      regularMinutes++;
    }
  }

  const regularHours = Math.round((regularMinutes / 60) * 10) / 10;
  const peakHours = Math.round((peakMinutes / 60) * 10) / 10;
  const totalPrice = Math.round(
    (regularMinutes / 60) * regPrice + (peakMinutes / 60) * pkPrice
  );

  // Submit Booking
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedLocation || !selectedCourt) {
      setErrorMessage("Vui lòng chọn cơ sở và sân cầu lông");
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage("Vui lòng điền họ tên và số điện thoại người đặt");
      return;
    }

    // Overlap validation
    const conflict = existingBookings.find((b) => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return bStart < endM && bEnd > startM;
    });

    if (conflict) {
      setErrorMessage(
        `Khung giờ ${startTime} - ${endTime} bị trùng với đơn đặt trước (${conflict.startTime} - ${conflict.endTime}).`
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.bookings.create({
        locationId: selectedLocation.id,
        location: selectedLocation.name,
        courtId: selectedCourt.id,
        courtName: selectedCourt.name,
        date: selectedDate,
        startTime,
        endTime,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethod,
        note: note.trim(),
        userId: user?.id,
      });

      if (res.success && res.booking) {
        setSuccessBooking(res.booking);
        // Refresh bookings for the court
        setExistingBookings((prev) => [...prev, res.booking]);
      } else {
        setErrorMessage(res.message || "Đặt sân không thành công");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi khi gửi yêu cầu đặt sân");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <span>Đặt Sân Cầu Lông</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Trực tuyến 24/7
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Chọn cơ sở, sân, ngày chơi và nhấp chọn khung giờ trực quan trên bảng lịch
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/my-bookings")}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Xem lịch sử vé đã đặt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Court & Schedule Selection, Right = Form & Pricing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Court & Schedule */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Chọn Cơ sở */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Chọn Cơ Sở Sân Cầu Lông</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    setSelectedLocation(loc);
                    if (loc.courts && loc.courts.length > 0) {
                      setSelectedCourt(loc.courts[0]);
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedLocation?.id === loc.id
                      ? "bg-emerald-500/10 border-emerald-500/80 text-white shadow-sm shadow-emerald-500/10"
                      : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <p className="font-bold text-sm text-white">{loc.name}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">{loc.address}</p>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-400 mt-2">
                    {loc.courts?.length || 4} Sân thi đấu
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Chọn Ngày & Chọn Sân */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Chọn Ngày */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Chọn Ngày Chơi</span>
              </label>
              <input
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                    selectedDate === todayStr
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
                    setSelectedDate(tomorrow);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                    selectedDate !== todayStr
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Ngày mai
                </button>
              </div>
            </div>

            {/* Chọn Sân */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. Chọn Sân Đấu</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {selectedLocation?.courts?.map((court) => (
                  <button
                    key={court.id}
                    type="button"
                    onClick={() => setSelectedCourt(court)}
                    className={`p-2.5 rounded-xl border text-center transition text-xs font-semibold ${
                      selectedCourt?.id === court.id
                        ? "bg-emerald-500/15 border-emerald-500 text-white shadow-sm"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div>{court.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {court.regularPrice.toLocaleString()}đ/h
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3: Bảng Chọn Giờ Trực Quan (Unified Schedule Board) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>4. Bảng Giờ Tương Tác Trực Tiếp (06:00 – 22:00)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nhấp 1 chạm để chọn 1 tiếng, hoặc nhấp giờ bắt đầu rồi nhấp giờ kết thúc để chọn 2–3 tiếng
                </p>
              </div>

              {/* Status legend */}
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Đang chọn
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700"></span> Còn trống
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-950/70 border border-rose-800 text-rose-400"></span> Đã kín
                </span>
              </div>
            </div>

            {/* Quick Controllers Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Khung giờ đang chọn:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {startTime} – {endTime}
                </span>
                <span className="text-slate-400">({durationHours} tiếng)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustDuration(-1)}
                  disabled={durationHours <= 1}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium text-slate-200 transition flex items-center gap-1"
                >
                  <Minus className="w-3 h-3" />
                  <span>-1 tiếng</span>
                </button>
                <button
                  type="button"
                  onClick={() => adjustDuration(1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>+1 tiếng</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStartTime("17:00");
                    setEndTime("19:00");
                    setRangeSelectingFrom(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đặt lại</span>
                </button>
              </div>
            </div>

            {/* Hourly Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {HOURLY_SLOTS.map((slot) => {
                const occupied = isSlotOccupied(slot.start, slot.end);
                const isSelected = isSlotSelected(slot.start, slot.end);
                const isStart = startTime === slot.start;
                const isEnd = endTime === slot.end;

                let btnStyle = "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-600";
                if (occupied) {
                  btnStyle = "bg-rose-950/30 border-rose-900/60 text-rose-400/80 cursor-not-allowed opacity-60";
                } else if (isSelected) {
                  btnStyle = "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-500/20";
                }

                return (
                  <button
                    key={slot.start}
                    type="button"
                    disabled={!!occupied}
                    onClick={() => handleSlotClick(slot.start, slot.end)}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center relative ${btnStyle}`}
                  >
                    <span className="font-bold text-xs tracking-tight">
                      {slot.start} - {slot.end}
                    </span>
                    <span className="text-[10px] mt-0.5 opacity-80">
                      {occupied
                        ? "❌ Đã kín"
                        : isStart
                        ? "🟢 Bắt đầu"
                        : isEnd
                        ? "🏁 Kết thúc"
                        : slot.isPeak
                        ? "120.000đ/h"
                        : "80.000đ/h"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info & Price Summary Form */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Thông Tin & Thanh Toán</span>
            </h3>

            {/* Error message alert */}
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Họ và tên người đặt *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Customer Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Số điện thoại liên hệ *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ví dụ: 0987 654 321"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("transfer")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition flex flex-col items-center gap-1 ${
                      paymentMethod === "transfer"
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-300"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Chuyển khoản QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("onsite")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition flex flex-col items-center gap-1 ${
                      paymentMethod === "onsite"
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-300"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Tiền mặt tại sân</span>
                  </button>
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Ghi chú (tùy chọn)</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Yêu cầu mượn vợt, nước uống..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              {/* Pricing Breakdown Summary */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Cơ sở & Sân:</span>
                  <span className="text-white font-medium">
                    {selectedCourt?.name} ({selectedLocation?.name})
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Ngày chơi:</span>
                  <span className="text-white font-medium">{selectedDate}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Thời lượng:</span>
                  <span className="text-white font-medium">
                    {startTime} – {endTime} ({durationHours} tiếng)
                  </span>
                </div>

                {regularHours > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Giờ thường ({regularHours}h @ 80k):</span>
                    <span className="text-slate-300">
                      {(regularHours * regPrice).toLocaleString()}đ
                    </span>
                  </div>
                )}

                {peakHours > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Giờ cao điểm ({peakHours}h @ 120k):</span>
                    <span className="text-amber-400">
                      {(peakHours * pkPrice).toLocaleString()}đ
                    </span>
                  </div>
                )}

                <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">Tổng cộng:</span>
                  <span className="text-xl font-extrabold text-emerald-400">
                    {totalPrice.toLocaleString()}đ
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý đặt sân...</span>
                  </>
                ) : (
                  <>
                    <span>Xác Nhận Đặt Sân Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Booking Success Modal */}
      {successBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center text-3xl border border-emerald-500/30">
              🏸
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Đặt Sân Thành Công!</h3>
              <p className="text-xs text-slate-400">
                Mã đơn đặt sân của bạn đã được khởi tạo trong hệ thống.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Mã đặt sân:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {successBooking.bookingCode}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Cơ sở:</span>
                <span className="font-medium text-white">{successBooking.location}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Sân:</span>
                <span className="font-medium text-white">{successBooking.courtName}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Thời gian:</span>
                <span className="font-medium text-white">
                  {successBooking.date} ({successBooking.startTime} - {successBooking.endTime})
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Tổng tiền:</span>
                <span className="font-bold text-emerald-400">
                  {successBooking.totalPrice.toLocaleString()}đ
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Trạng thái:</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                  Chờ xác nhận (Pending)
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setSuccessBooking(null);
                  navigate("/my-bookings");
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <span>Xem vé trong Lịch sử đặt sân</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSuccessBooking(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Đặt thêm sân khác
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
