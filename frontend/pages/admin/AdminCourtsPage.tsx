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
} from "lucide-react";

export const AdminCourtsPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingCourtId, setUpdatingCourtId] = useState<string | null>(null);
  const [editingCourt, setEditingCourt] = useState<{
    locationId: string;
    court: Court;
    regularPrice: number;
    peakPrice: number;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

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
        setFeedback(`Đã chuyển ${court.name} sang trạng thái: ${newStatus === "active" ? "Hoạt động" : "Bảo trì"}`);
        fetchLocations();
      }
    } catch (err: any) {
      setFeedback(err.message || "Lỗi cập nhật");
    } finally {
      setUpdatingCourtId(null);
    }
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourt) return;

    try {
      setUpdatingCourtId(editingCourt.court.id);
      const res = await api.admin.toggleCourtStatus({
        locationId: editingCourt.locationId,
        courtId: editingCourt.court.id,
        regularPrice: editingCourt.regularPrice,
        peakPrice: editingCourt.peakPrice,
      });

      if (res.success) {
        setFeedback(`Đã cập nhật bảng giá cho ${editingCourt.court.name}!`);
        setEditingCourt(null);
        fetchLocations();
      }
    } catch (err: any) {
      setFeedback(err.message || "Lỗi cập nhật giá");
    } finally {
      setUpdatingCourtId(null);
    }
  };

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
            Điều chỉnh trạng thái hoạt động (bảo trì/sẵn sàng) và cập nhật đơn giá giờ thường & giờ cao điểm
          </p>
        </div>

        <button
          onClick={fetchLocations}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Locations List */}
      <div className="space-y-8">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
          >
            {/* Location Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>{loc.name}</span>
                </h3>
                <p className="text-xs text-slate-400">{loc.address} — Hotline: {loc.phone}</p>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                Mở cửa: {loc.openTime} – {loc.closeTime}
              </span>
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
                        <span className="font-bold text-sm text-white">{court.name}</span>
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

                      <div className="text-xs space-y-1 text-slate-400">
                        <div className="flex justify-between">
                          <span>Giờ thường:</span>
                          <span className="font-semibold text-white">
                            {court.regularPrice.toLocaleString()}đ/h
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Giờ cao điểm:</span>
                          <span className="font-semibold text-amber-400">
                            {court.peakPrice.toLocaleString()}đ/h
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
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

                      {/* Edit Price */}
                      <button
                        onClick={() =>
                          setEditingCourt({
                            locationId: loc.id,
                            court,
                            regularPrice: court.regularPrice,
                            peakPrice: court.peakPrice,
                          })
                        }
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                        title="Đổi giá"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Price Modal */}
      {editingCourt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                Cập Nhật Giá Sân: {editingCourt.court.name}
              </h3>
              <button
                onClick={() => setEditingCourt(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">
                  Giá Giờ Thường (06:00 - 16:00) (VNĐ/tiếng)
                </label>
                <input
                  type="number"
                  step="5000"
                  min="30000"
                  max="500000"
                  value={editingCourt.regularPrice}
                  onChange={(e) =>
                    setEditingCourt({
                      ...editingCourt,
                      regularPrice: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">
                  Giá Giờ Cao Điểm (16:00 - 22:00) (VNĐ/tiếng)
                </label>
                <input
                  type="number"
                  step="5000"
                  min="30000"
                  max="500000"
                  value={editingCourt.peakPrice}
                  onChange={(e) =>
                    setEditingCourt({
                      ...editingCourt,
                      peakPrice: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-amber-400 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCourt(null)}
                  className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
