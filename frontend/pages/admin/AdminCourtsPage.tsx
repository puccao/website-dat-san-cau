import React, { useState, useEffect } from "react";
import { api } from "../../services/api.js";
import { Location, Court } from "../../types/index.js";
import {
  MapPin,
  Sparkles,
  RefreshCw,
  Edit2,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Layers,
  Navigation,
} from "lucide-react";

export const AdminCourtsPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingCourtId, setUpdatingCourtId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalLocationId, setModalLocationId] = useState<string>("");
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [courtForm, setCourtForm] = useState({
    name: "",
    type: "standard" as "standard" | "indoor" | "vip",
    regularPrice: 80000,
    peakPrice: 130000,
    status: "active" as "active" | "maintenance",
    position: "Khu A - Sân 1",
  });
  const [formError, setFormError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchLocations = () => {
    setLoading(true);
    api.locations
      .getAll()
      .then((res) => {
        if (res.success) {
          setLocations(res.locations);
        }
      })
      .catch((err) => console.error("Error fetching locations:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const openAddModal = (locationId: string) => {
    setModalLocationId(locationId);
    setEditingCourt(null);
    const loc = locations.find((l) => l.id === locationId);
    const nextCourtNum = (loc?.courts.length || 0) + 1;
    const zone = nextCourtNum <= 2 ? "A" : nextCourtNum <= 4 ? "B" : "C";
    setCourtForm({
      name: `Sân số ${nextCourtNum}`,
      type: "standard",
      regularPrice: 80000,
      peakPrice: 130000,
      status: "active",
      position: `Khu ${zone} - Sân số ${nextCourtNum} (Tầng 1)`,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (locationId: string, court: Court) => {
    setModalLocationId(locationId);
    setEditingCourt(court);
    setCourtForm({
      name: court.name,
      type: (court.type as any) || "standard",
      regularPrice: court.regularPrice,
      peakPrice: court.peakPrice,
      status: court.status,
      position: court.position || "Khu trung tâm",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSaveCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!courtForm.name.trim()) {
      setFormError("Vui lòng nhập tên sân");
      return;
    }

    if (courtForm.regularPrice <= 0 || courtForm.peakPrice <= 0) {
      setFormError("Giá sân phải lớn hơn 0");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingCourt) {
        // Update existing court
        const res = await api.locations.updateCourt(modalLocationId, editingCourt.id, {
          name: courtForm.name.trim(),
          type: courtForm.type,
          regularPrice: Number(courtForm.regularPrice),
          peakPrice: Number(courtForm.peakPrice),
          status: courtForm.status,
          position: (courtForm.position || "Khu trung tâm").trim(),
        });

        if (res.success) {
          setFeedback({ text: `Đã cập nhật sân ${courtForm.name} thành công!`, type: "success" });
          setIsModalOpen(false);
          fetchLocations();
        } else {
          setFormError(res.message || "Không thể cập nhật sân");
        }
      } else {
        // Add new court
        const res = await api.locations.addCourt(modalLocationId, {
          name: courtForm.name.trim(),
          type: courtForm.type,
          regularPrice: Number(courtForm.regularPrice),
          peakPrice: Number(courtForm.peakPrice),
          status: courtForm.status,
          position: (courtForm.position || "Khu trung tâm").trim(),
        });

        if (res.success) {
          setFeedback({ text: `Đã thêm sân mới ${courtForm.name} thành công!`, type: "success" });
          setIsModalOpen(false);
          fetchLocations();
        } else {
          setFormError(res.message || "Không thể thêm sân mới");
        }
      }
    } catch (err: any) {
      setFormError(err.message || "Lỗi khi lưu thông tin sân");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourt = async (locationId: string, court: Court) => {
    if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn sân "${court.name}" khỏi cơ sở này?`)) {
      return;
    }

    try {
      setUpdatingCourtId(court.id);
      const res = await api.locations.deleteCourt(locationId, court.id);
      if (res.success) {
        setFeedback({ text: `Đã xóa ${court.name} thành công`, type: "success" });
        fetchLocations();
      } else {
        setFeedback({ text: res.message || "Không thể xóa sân", type: "error" });
      }
    } catch (err: any) {
      setFeedback({ text: err.message || "Lỗi khi xóa sân", type: "error" });
    } finally {
      setUpdatingCourtId(null);
    }
  };

  const handleToggleStatus = async (locationId: string, court: Court) => {
    const newStatus = court.status === "active" ? "maintenance" : "active";
    try {
      setUpdatingCourtId(court.id);
      const res = await api.admin.toggleCourtStatus({
        locationId,
        courtId: court.id,
        status: newStatus,
      });

      if (res.success) {
        setFeedback({
          text: `Đã chuyển ${court.name} sang trạng thái: ${newStatus === "active" ? "Hoạt động" : "Bảo trì"}`,
          type: "success",
        });
        fetchLocations();
      }
    } catch (err: any) {
      setFeedback({ text: err.message || "Lỗi cập nhật trạng thái", type: "error" });
    } finally {
      setUpdatingCourtId(null);
    }
  };

  const totalCourts = locations.reduce((acc, loc) => acc + (loc.courts?.length || 0), 0);
  const maintenanceCourts = locations.reduce(
    (acc, loc) => acc + (loc.courts?.filter((c) => c.status === "maintenance").length || 0),
    0
  );
  const activeCourts = totalCourts - maintenanceCourts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-amber-400" />
            <span>Quản Lý Sân & Bảng Giá Theo Giờ</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            CRUD toàn diện từng sân cầu lông: Thêm mới, đổi tên, phân loại, chỉnh giá giờ thường & cao điểm
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {locations.length > 0 && (
            <button
              onClick={() => openAddModal(locations[0].id)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm sân mới</span>
            </button>
          )}

          <button
            onClick={fetchLocations}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <span className="text-xs text-slate-400">Tổng số sân toàn chuỗi:</span>
          <span className="text-lg font-black text-white">{totalCourts} sân</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <span className="text-xs text-slate-400">Đang hoạt động sẵn sàng:</span>
          <span className="text-lg font-black text-emerald-400">{activeCourts} sân</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <span className="text-xs text-slate-400">Đang tạm thời bảo trì:</span>
          <span className="text-lg font-black text-amber-400">{maintenanceCourts} sân</span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="font-bold opacity-80">
            ✕
          </button>
        </div>
      )}

      {/* Locations List */}
      <div className="space-y-8">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl shadow-black/20"
          >
            {/* Location Title & Branch Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>{loc.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {loc.address} — Hotline: <strong className="text-slate-300">{loc.phone}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  {loc.openTime} – {loc.closeTime}
                </span>

                <button
                  onClick={() => openAddModal(loc.id)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm sân vào cơ sở này</span>
                </button>
              </div>
            </div>

            {/* Courts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {loc.courts?.map((court) => {
                const isBusy = updatingCourtId === court.id;
                const isMaintenance = court.status === "maintenance";

                return (
                  <div
                    key={court.id}
                    className={`p-4 rounded-xl border transition space-y-3 flex flex-col justify-between ${
                      isMaintenance
                        ? "bg-slate-950/80 border-rose-900/40 text-slate-400"
                        : "bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-sm text-white block">{court.name}</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                            {court.type === "vip" ? "VIP Sàn Thảm" : court.type === "indoor" ? "Trong Nhà" : "Tiêu Chuẩn"}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            isMaintenance
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {isMaintenance ? "Đang bảo trì" : "Hoạt động"}
                        </span>
                      </div>

                      {/* Vị trí sân trong khuôn viên */}
                      <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <Navigation className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{court.position || "Khu trung tâm"}</span>
                      </div>

                      <div className="text-xs space-y-1 text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                        <div className="flex justify-between">
                          <span>Giờ thường (6h-16h):</span>
                          <span className="font-semibold text-white">
                            {court.regularPrice.toLocaleString()}đ/h
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Giờ vàng (16h-22h):</span>
                          <span className="font-semibold text-amber-400">
                            {court.peakPrice.toLocaleString()}đ/h
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
                      {/* Toggle Maintenance */}
                      <button
                        onClick={() => handleToggleStatus(loc.id, court)}
                        disabled={isBusy}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                          isMaintenance
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        }`}
                      >
                        {isMaintenance ? "Mở lại sân" : "Tạm bảo trì"}
                      </button>

                      {/* Edit Court Full Modal */}
                      <button
                        onClick={() => openEditModal(loc.id, court)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Chỉnh sửa chi tiết sân"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Court */}
                      <button
                        onClick={() => handleDeleteCourt(loc.id, court)}
                        disabled={isBusy}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Xóa sân này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Court Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>{editingCourt ? `Chỉnh Sửa Sân: ${editingCourt.name}` : "Thêm Sân Mới"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCourt} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Tên sân thi đấu *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Sân 1, Sân VIP 2"
                  value={courtForm.name}
                  onChange={(e) => setCourtForm({ ...courtForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block flex items-center justify-between">
                  <span>Vị trí sân trong cơ sở (Position) *</span>
                  <span className="text-[10px] text-amber-400 font-normal">Khu vực / Tầng / Sân</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Khu A - Tầng 1 (Sân trung tâm), Khu B - Cạnh khán đài..."
                  value={courtForm.position}
                  onChange={(e) => setCourtForm({ ...courtForm, position: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Phân loại sân</label>
                  <select
                    value={courtForm.type}
                    onChange={(e: any) => setCourtForm({ ...courtForm, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="standard">Tiêu chuẩn</option>
                    <option value="indoor">Trong nhà</option>
                    <option value="vip">VIP Thảm chuyên dụng</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Trạng thái ban đầu</label>
                  <select
                    value={courtForm.status}
                    onChange={(e: any) => setCourtForm({ ...courtForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="active">Sẵn sàng (Hoạt động)</option>
                    <option value="maintenance">Bảo trì (Tạm khóa)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">
                  Giá Giờ Thường (06:00 - 16:00) (VNĐ/tiếng) *
                </label>
                <input
                  type="number"
                  step="5000"
                  min="20000"
                  max="1000000"
                  required
                  value={courtForm.regularPrice}
                  onChange={(e) =>
                    setCourtForm({ ...courtForm, regularPrice: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">
                  Giá Giờ Cao Điểm (16:00 - 22:00) (VNĐ/tiếng) *
                </label>
                <input
                  type="number"
                  step="5000"
                  min="20000"
                  max="1000000"
                  required
                  value={courtForm.peakPrice}
                  onChange={(e) =>
                    setCourtForm({ ...courtForm, peakPrice: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-amber-400 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{editingCourt ? "Lưu thay đổi" : "Tạo sân mới"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
