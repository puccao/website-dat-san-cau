import React, { useState, useEffect, useMemo } from "react";
import { api } from "../../services/api.js";
import { Booking, Location, Court } from "../../types/index.js";
import {
  CalendarCheck,
  Search,
  RefreshCw,
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
  Building,
  CheckCircle2,
  Tag,
  DollarSign,
  Check,
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
    zoneName: "",
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

  // Create Booking Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createFormData, setCreateFormData] = useState({
    locationId: "",
    zoneName: "",
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

          // Find Sân Cầu Lông Cầu Giấy
          const cauGiayLoc = locsRes.locations.find((l) =>
            l.name.toLowerCase().includes("cầu giấy")
          ) || locsRes.locations[0];

          if (cauGiayLoc && !createFormData.locationId) {
            const firstZone = cauGiayLoc.zones?.[0]?.name || cauGiayLoc.courts?.[0]?.zone || "Khu A";
            const firstCourt = cauGiayLoc.courts?.[0]?.id || "";
            setCreateFormData((prev) => ({
              ...prev,
              locationId: cauGiayLoc.id,
              zoneName: firstZone,
              courtId: firstCourt,
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

  // Quick reference to Sân Cầu Lông Cầu Giấy
  const cauGiayLocation = useMemo(() => {
    return locations.find((l) => l.name.toLowerCase().includes("cầu giấy")) || null;
  }, [locations]);

  // Handle Quick Create for Sân Cầu Lông Cầu Giấy
  const openCreateForCauGiay = () => {
    if (!cauGiayLocation) {
      setIsCreateOpen(true);
      return;
    }
    const defaultZone =
      cauGiayLocation.zones?.[0]?.name ||
      cauGiayLocation.courts?.[0]?.zone ||
      "Khu A (Tầng 1)";
    const courtsInZone = cauGiayLocation.courts.filter(
      (c) => (c.zone || "Khu A (Tầng 1)") === defaultZone
    );
    const defaultCourt = courtsInZone[0]?.id || cauGiayLocation.courts[0]?.id || "";

    setCreateFormData({
      locationId: cauGiayLocation.id,
      zoneName: defaultZone,
      courtId: defaultCourt,
      date: new Date().toISOString().split("T")[0],
      startTime: "17:00",
      endTime: "19:00",
      customerName: "",
      customerPhone: "",
      status: "confirmed",
      paymentMethod: "onsite",
      note: "Đặt trực tiếp tại Sân Cầu Lông Cầu Giấy",
    });
    setCreateError("");
    setIsCreateOpen(true);
  };

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

    const loc = locations.find((l) => l.id === b.locationId) || locations[0];
    const court = loc?.courts.find((c) => c.id === b.courtId);
    const zoneName = court?.zone || loc?.zones?.[0]?.name || "Khu A (Tầng 1)";

    setEditFormData({
      locationId: b.locationId || loc?.id || "",
      zoneName: zoneName,
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
        setMessage({
          text: `Đã cập nhật đơn đặt sân ${editingBooking.bookingCode} thành công!`,
          type: "success",
        });
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
        setMessage({
          text: `Đã tạo đơn đặt sân mới thành công! Mã: ${res.booking.bookingCode}`,
          type: "success",
        });
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
      const matchLoc = b.location?.toLowerCase().includes(term);
      if (!matchCode && !matchName && !matchPhone && !matchCourt && !matchLoc) return false;
    }
    return true;
  });

  // Calculate metrics
  const totalFilteredRevenue = filteredBookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;

  // Sân Cầu Lông Cầu Giấy specific metrics
  const cauGiayBookings = bookings.filter(
    (b) =>
      b.locationId === cauGiayLocation?.id ||
      b.location?.toLowerCase().includes("cầu giấy")
  );
  const cauGiayRevenue = cauGiayBookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const cauGiayPending = cauGiayBookings.filter((b) => b.status === "pending").length;

  // Active Location & Zones for Create Modal
  const currentCreateLoc =
    locations.find((l) => l.id === createFormData.locationId) || locations[0] || null;
  const createLocZones = useMemo(() => {
    if (!currentCreateLoc) return [];
    if (currentCreateLoc.zones && currentCreateLoc.zones.length > 0) {
      return currentCreateLoc.zones;
    }
    const names = Array.from(
      new Set(currentCreateLoc.courts.map((c) => c.zone || "Khu A (Tầng 1)"))
    );
    return names.map((name, idx) => ({ id: `cz_${idx}`, name }));
  }, [currentCreateLoc]);

  const courtsInCreateZone = useMemo(() => {
    if (!currentCreateLoc) return [];
    const targetZone = createFormData.zoneName || createLocZones[0]?.name;
    const matched = currentCreateLoc.courts.filter(
      (c) => (c.zone || createLocZones[0]?.name) === targetZone
    );
    return matched.length > 0 ? matched : currentCreateLoc.courts;
  }, [currentCreateLoc, createFormData.zoneName, createLocZones]);

  // Active Location & Zones for Edit Modal
  const currentEditLoc =
    locations.find((l) => l.id === editFormData.locationId) || locations[0] || null;
  const editLocZones = useMemo(() => {
    if (!currentEditLoc) return [];
    if (currentEditLoc.zones && currentEditLoc.zones.length > 0) {
      return currentEditLoc.zones;
    }
    const names = Array.from(
      new Set(currentEditLoc.courts.map((c) => c.zone || "Khu A (Tầng 1)"))
    );
    return names.map((name, idx) => ({ id: `ez_${idx}`, name }));
  }, [currentEditLoc]);

  const courtsInEditZone = useMemo(() => {
    if (!currentEditLoc) return [];
    const targetZone = editFormData.zoneName || editLocZones[0]?.name;
    const matched = currentEditLoc.courts.filter(
      (c) => (c.zone || editLocZones[0]?.name) === targetZone
    );
    return matched.length > 0 ? matched : currentEditLoc.courts;
  }, [currentEditLoc, editFormData.zoneName, editLocZones]);

  // Live Price Calculation Helper for Create Modal
  const previewCreatePrice = useMemo(() => {
    const court = currentCreateLoc?.courts.find((c) => c.id === createFormData.courtId);
    if (!court) return 0;
    const [startH] = createFormData.startTime.split(":").map(Number);
    const [endH] = createFormData.endTime.split(":").map(Number);
    if (isNaN(startH) || isNaN(endH) || endH <= startH) return 0;

    let total = 0;
    for (let h = startH; h < endH; h++) {
      if (h >= 16) {
        total += court.peakPrice;
      } else {
        total += court.regularPrice;
      }
    }
    return total;
  }, [currentCreateLoc, createFormData.courtId, createFormData.startTime, createFormData.endTime]);

  const isCauGiayFilterSelected =
    cauGiayLocation && locationFilter === cauGiayLocation.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-amber-400" />
            <span>Quản Lý Đơn Đặt Sân (Admin Booking CRUD)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản trị toàn diện đơn đặt: Tạo đơn tại quầy, duyệt vé, chọn Khu vực & Sân, chỉnh sửa lịch và hủy/xóa đơn.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Nút Tạo Đơn Nhanh Cho Sân Cầu Lông Cầu Giấy */}
          <button
            onClick={openCreateForCauGiay}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            title="Tạo đơn đặt trực tiếp cho Sân Cầu Lông Cầu Giấy"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Đơn Sân Cầu Giấy</span>
          </button>

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
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* Quick Location Filter Bar (Featuring Sân Cầu Lông Cầu Giấy) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-400 font-semibold px-2 flex items-center gap-1">
          <Building className="w-3.5 h-3.5 text-amber-400" />
          <span>Lọc Cơ sở:</span>
        </span>

        <button
          onClick={() => setLocationFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            locationFilter === "all"
              ? "bg-slate-700 text-white"
              : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          Tất cả cơ sở ({bookings.length})
        </button>

        {locations.map((loc) => {
          const isSelected = locationFilter === loc.id;
          const isCauGiay = loc.name.toLowerCase().includes("cầu giấy");
          const count = bookings.filter(
            (b) => b.locationId === loc.id || b.location === loc.name
          ).length;

          return (
            <button
              key={loc.id}
              onClick={() => setLocationFilter(loc.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isSelected
                  ? isCauGiay
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-emerald-600 text-white"
                  : isCauGiay
                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>{loc.name}</span>
              <span className="text-[10px] font-mono opacity-80 font-normal">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Sân Cầu Lông Cầu Giấy Special Banner & KPIs */}
      {isCauGiayFilterSelected && cauGiayLocation && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-black/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                Cơ sở Cầu Giấy
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {cauGiayLocation.openTime} – {cauGiayLocation.closeTime}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              Sân Cầu Lông Cầu Giấy — {cauGiayLocation.address}
            </h3>
            <p className="text-xs text-slate-400">
              Hotline tiếp nhận: <strong className="text-amber-300">{cauGiayLocation.phone}</strong> • Số sân:{" "}
              <strong className="text-white">{cauGiayLocation.courts?.length || 0} sân</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Đơn tại Cầu Giấy</span>
              <span className="text-base font-black text-amber-400">{cauGiayBookings.length}</span>
            </div>
            <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Chờ duyệt</span>
              <span className="text-base font-black text-amber-300">{cauGiayPending}</span>
            </div>
            <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Doanh thu Cầu Giấy</span>
              <span className="text-base font-black text-emerald-400">
                {cauGiayRevenue.toLocaleString()}đ
              </span>
            </div>
            <button
              onClick={openCreateForCauGiay}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1 shadow-md shadow-amber-500/20 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Đặt sân này</span>
            </button>
          </div>
        </div>
      )}

      {/* Global KPI Counters Bar */}
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
          <span className="text-[11px] text-slate-400 block">Đã duyệt (Confirmed)</span>
          <span className="text-xl font-black text-emerald-400">{confirmedCount} đơn</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 block">Doanh thu theo bộ lọc</span>
          <span className="text-xl font-black text-emerald-400">
            {totalFilteredRevenue.toLocaleString()}đ
          </span>
        </div>
      </div>

      {/* Feedback message */}
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
              placeholder="Tìm mã đơn, tên khách, số điện thoại, tên sân..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Location Dropdown Filter */}
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

        {/* Status Tabs */}
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
          <div className="py-16 text-center text-slate-400 text-xs space-y-3">
            <p>Không tìm thấy đơn đặt sân nào phù hợp với bộ lọc hiện tại</p>
            {isCauGiayFilterSelected && (
              <button
                onClick={openCreateForCauGiay}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo đơn đầu tiên cho Sân Cầu Lông Cầu Giấy</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Sân & Cơ sở</th>
                  <th className="py-3 px-4">Ngày & Giờ chơi</th>
                  <th className="py-3 px-4">Tổng tiền & HT</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác CRUD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBookings.map((b) => {
                  const id = b._id || b.id || "";
                  const isUpdating = updatingId === id;
                  const isCauGiay = b.location?.toLowerCase().includes("cầu giấy");

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
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <span>{b.courtName}</span>
                          {isCauGiay && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              Cầu Giấy
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[170px]">
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
                          {/* Xem chi tiết (Read) */}
                          <button
                            onClick={() => setViewingBooking(b)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Xem chi tiết đơn"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Chỉnh sửa đơn (Update) */}
                          <button
                            onClick={() => openEditModal(b)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Chỉnh sửa ngày, giờ, sân"
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

                          {/* Xóa vĩnh viễn (Delete) */}
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

      {/* ========================================== */}
      {/* VIEW DETAIL MODAL */}
      {/* ========================================== */}
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
                      Nội dung chuyển khoản: <strong className="text-emerald-400">{viewingBooking.bookingCode}</strong>
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

      {/* ========================================== */}
      {/* EDIT BOOKING MODAL (With Zone & Court Hierarchy) */}
      {/* ========================================== */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">
                  Chỉnh Sửa Đơn Đặt: {editingBooking.bookingCode}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Đổi ngày, khung giờ hoặc chuyển sang Khu vực & Sân khác
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
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, customerName: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={editFormData.customerPhone}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, customerPhone: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Cơ sở */}
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Chọn Cơ sở</label>
                <select
                  value={editFormData.locationId}
                  onChange={(e) => {
                    const newLocId = e.target.value;
                    const loc = locations.find((l) => l.id === newLocId);
                    const zName = loc?.zones?.[0]?.name || loc?.courts?.[0]?.zone || "Khu A";
                    const crtId = loc?.courts?.[0]?.id || "";
                    setEditFormData({
                      ...editFormData,
                      locationId: newLocId,
                      zoneName: zName,
                      courtId: crtId,
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

              {/* Chọn Khu Vực & Sân */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block flex items-center gap-1">
                    <Tag className="w-3 h-3 text-amber-400" />
                    <span>Khu Vực (Zone)</span>
                  </label>
                  <select
                    value={editFormData.zoneName}
                    onChange={(e) => {
                      const newZone = e.target.value;
                      const matchedCourts = currentEditLoc?.courts.filter(
                        (c) => (c.zone || editLocZones[0]?.name) === newZone
                      );
                      setEditFormData({
                        ...editFormData,
                        zoneName: newZone,
                        courtId: matchedCourts?.[0]?.id || currentEditLoc?.courts?.[0]?.id || "",
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {editLocZones.map((z) => (
                      <option key={z.id} value={z.name}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Sân thi đấu</label>
                  <select
                    value={editFormData.courtId}
                    onChange={(e) => setEditFormData({ ...editFormData, courtId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {courtsInEditZone.map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name} ({court.type} -{" "}
                        {court.status === "maintenance" ? "Bảo trì" : "Hoạt động"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ngày & Giờ */}
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
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, startTime: e.target.value })
                    }
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
                    onChange={(e: any) =>
                      setEditFormData({ ...editFormData, status: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="pending">Chờ duyệt (Pending)</option>
                    <option value="confirmed">Đã duyệt & Giữ chỗ (Confirmed)</option>
                    <option value="completed">Đã hoàn thành (Completed)</option>
                    <option value="cancelled">Đã hủy (Cancelled)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    Hình thức thanh toán
                  </label>
                  <select
                    value={editFormData.paymentMethod}
                    onChange={(e: any) =>
                      setEditFormData({ ...editFormData, paymentMethod: e.target.value })
                    }
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

      {/* ========================================== */}
      {/* CREATE DIRECT BOOKING MODAL (With Zone & Court Hierarchy) */}
      {/* ========================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>
                    {currentCreateLoc?.name.toLowerCase().includes("cầu giấy")
                      ? "Tạo Đơn Sân Cầu Lông Cầu Giấy"
                      : "Tạo Đơn Đặt Sân Trực Tiếp"}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Phân cấp theo Khu vực (Zone) & Sân thi đấu với bảng tính giá tự động
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
                    placeholder="Ví dụ: Anh Tuấn"
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
                    placeholder="0912345678"
                    value={createFormData.customerPhone}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, customerPhone: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Cơ sở */}
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Chọn Cơ sở</label>
                <select
                  value={createFormData.locationId}
                  onChange={(e) => {
                    const newLocId = e.target.value;
                    const loc = locations.find((l) => l.id === newLocId);
                    const zName = loc?.zones?.[0]?.name || loc?.courts?.[0]?.zone || "Khu A";
                    const crtId = loc?.courts?.[0]?.id || "";
                    setCreateFormData({
                      ...createFormData,
                      locationId: newLocId,
                      zoneName: zName,
                      courtId: crtId,
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

              {/* Phân cấp: Chọn Khu Vực -> Chọn Sân */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Chọn Khu Vực *</span>
                  </label>
                  <select
                    value={createFormData.zoneName}
                    onChange={(e) => {
                      const newZone = e.target.value;
                      const matched = currentCreateLoc?.courts.filter(
                        (c) => (c.zone || createLocZones[0]?.name) === newZone
                      );
                      setCreateFormData({
                        ...createFormData,
                        zoneName: newZone,
                        courtId: matched?.[0]?.id || currentCreateLoc?.courts?.[0]?.id || "",
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
                  >
                    {createLocZones.map((z) => (
                      <option key={z.id} value={z.name}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Chọn Sân trong Khu Vực *</label>
                  <select
                    value={createFormData.courtId}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, courtId: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
                  >
                    {courtsInCreateZone.map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name} ({court.type} - {court.regularPrice.toLocaleString()}đ/h)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ngày & Giờ */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Ngày chơi *</label>
                  <input
                    type="date"
                    required
                    value={createFormData.date}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, date: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={createFormData.startTime}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, startTime: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Giờ kết thúc</label>
                  <input
                    type="time"
                    required
                    value={createFormData.endTime}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, endTime: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Live Preview Giá */}
              {previewCreatePrice > 0 && (
                <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between text-xs">
                  <span className="text-emerald-300 font-medium">
                    Giá tiền tạm tính tự động theo khung giờ:
                  </span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {previewCreatePrice.toLocaleString()}đ
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    Hình thức thanh toán
                  </label>
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
                  <label className="text-slate-300 font-semibold mb-1 block">Ghi chú đơn</label>
                  <input
                    type="text"
                    value={createFormData.note}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, note: e.target.value })
                    }
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
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
