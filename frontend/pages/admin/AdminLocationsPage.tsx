import React, { useState, useEffect } from "react";
import { api } from "../../services/api.js";
import { Location } from "../../types/index.js";
import {
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  Clock,
  Phone,
  Compass,
  Building2,
  CheckCircle2,
  AlertTriangle,
  X,
  Navigation,
  Sparkles,
  Layers,
  Map,
} from "lucide-react";

interface AdminLocationsPageProps {
  navigate?: (path: string) => void;
}

export const AdminLocationsPage: React.FC<AdminLocationsPageProps> = ({ navigate }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal State for Create / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");

  // Location Form State
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    district: "",
    city: "Hà Nội",
    phone: "0900 000 000",
    openTime: "06:00",
    closeTime: "22:00",
    mapUrl: "",
    latitude: 21.0285,
    longitude: 105.8542,
    directions: "",
    initialCourtsCount: 4,
  });

  // Modal State for Details / Map View
  const [detailLocation, setDetailLocation] = useState<Location | null>(null);

  // Modal State for Delete Confirm
  const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchLocations = () => {
    setLoading(true);
    api.locations
      .getAll()
      .then((res) => {
        if (res.success) {
          setLocations(res.locations);
        }
      })
      .catch((err) => {
        console.error("Lỗi lấy danh sách cơ sở:", err);
        setFeedback({ text: "Không thể tải danh sách cơ sở", type: "error" });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingLocation(null);
    setFormData({
      name: "",
      address: "",
      district: "Cầu Giấy",
      city: "Hà Nội",
      phone: "0912 345 678",
      openTime: "06:00",
      closeTime: "22:00",
      mapUrl: "https://maps.google.com/?q=21.033,105.792",
      latitude: 21.033,
      longitude: 105.792,
      directions: "Bãi gửi xe máy & ô tô miễn phí tại cổng phụ nhà thi đấu.",
      initialCourtsCount: 4,
    });
    setFormError("");
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (loc: Location) => {
    setEditingLocation(loc);
    setFormData({
      name: loc.name,
      address: loc.address,
      district: loc.district || "",
      city: loc.city || "Hà Nội",
      phone: loc.phone || "0900 000 000",
      openTime: loc.openTime || "06:00",
      closeTime: loc.closeTime || "22:00",
      mapUrl: loc.mapUrl || "",
      latitude: loc.latitude || 0,
      longitude: loc.longitude || 0,
      directions: loc.directions || "",
      initialCourtsCount: loc.courts?.length || 4,
    });
    setFormError("");
    setIsFormModalOpen(true);
  };

  // Handle Create / Update Submit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Vui lòng nhập tên cơ sở sân cầu lông");
      return;
    }

    if (!formData.address.trim()) {
      setFormError("Vui lòng nhập địa chỉ cơ sở");
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingLocation) {
        // Update existing location
        const res = await api.locations.update(editingLocation.id, {
          name: formData.name.trim(),
          address: formData.address.trim(),
          district: formData.district.trim(),
          city: formData.city.trim(),
          phone: formData.phone.trim(),
          openTime: formData.openTime,
          closeTime: formData.closeTime,
          mapUrl: formData.mapUrl.trim(),
          latitude: Number(formData.latitude) || 0,
          longitude: Number(formData.longitude) || 0,
          directions: formData.directions.trim(),
        });

        if (res.success) {
          showFeedback("Cập nhật thông tin cơ sở thành công!");
          setIsFormModalOpen(false);
          fetchLocations();
        }
      } else {
        // Create new location with initial courts with position metadata
        const courts = Array.from({ length: formData.initialCourtsCount }).map((_, i) => {
          const num = i + 1;
          const zoneLetter = num <= 2 ? "A" : num <= 4 ? "B" : "C";
          return {
            id: `court_${num}`,
            name: `Sân ${num} (Thảm Enlio)`,
            type: num === 3 ? "VIP" : "Standard",
            status: "active" as const,
            regularPrice: num === 3 ? 90000 : 80000,
            peakPrice: num === 3 ? 130000 : 120000,
            position: `Khu ${zoneLetter} - Sân số ${num} (Tầng 1)`,
          };
        });

        const res = await api.locations.create({
          name: formData.name.trim(),
          address: formData.address.trim(),
          district: formData.district.trim(),
          city: formData.city.trim(),
          phone: formData.phone.trim(),
          openTime: formData.openTime,
          closeTime: formData.closeTime,
          mapUrl: formData.mapUrl.trim(),
          latitude: Number(formData.latitude) || 0,
          longitude: Number(formData.longitude) || 0,
          directions: formData.directions.trim(),
          courts: courts as any,
        });

        if (res.success) {
          showFeedback("Tạo cơ sở mới thành công kèm hệ thống sân thi đấu!");
          setIsFormModalOpen(false);
          fetchLocations();
        }
      }
    } catch (err: any) {
      setFormError(err.message || "Lỗi xử lý cơ sở");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deleteLocationId) return;

    try {
      setDeleting(true);
      const res = await api.locations.delete(deleteLocationId);
      if (res.success) {
        showFeedback("Đã xóa cơ sở thành công!");
        setDeleteLocationId(null);
        fetchLocations();
      }
    } catch (err: any) {
      showFeedback(err.message || "Không thể xóa cơ sở này", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Filter locations
  const filteredLocations = locations.filter((loc) => {
    const matchSearch =
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.district && loc.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (loc.phone && loc.phone.includes(searchTerm));

    const matchCity =
      selectedCity === "all" ||
      (loc.city && loc.city.toLowerCase() === selectedCity.toLowerCase());

    return matchSearch && matchCity;
  });

  // Calculate statistics
  const totalLocations = locations.length;
  const totalCourts = locations.reduce((sum, l) => sum + (l.courts?.length || 0), 0);
  const citiesCount = new Set(locations.map((l) => l.city).filter(Boolean)).size;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold transition-all duration-300 ${
            feedback.type === "success"
              ? "bg-emerald-500 text-slate-950 border border-emerald-400 shadow-emerald-500/20"
              : "bg-rose-500 text-white border border-rose-400 shadow-rose-500/20"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Quản Lý Cơ Sở & Địa Điểm
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold uppercase tracking-wider">
              Hệ thống sân
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Quản lý thông tin các cụm sân, vị trí địa lý, định vị Google Maps, chỉ dẫn tìm đường và sơ đồ vị trí sân thi đấu
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm cơ sở mới</span>
          </button>

          <button
            onClick={fetchLocations}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Tổng số cơ sở</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalLocations}</div>
          <div className="text-[10px] text-slate-500">Cụm sân đang hoạt động</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Tổng số sân thi đấu</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{totalCourts}</div>
          <div className="text-[10px] text-slate-500">Thảm tiêu chuẩn BWF</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Địa bàn phủ sóng</span>
            <MapPin className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{citiesCount || 2} Khu vực</div>
          <div className="text-[10px] text-slate-500">Hà Nội & TP. Hồ Chí Minh</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Khung giờ đón khách</span>
            <Clock className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-teal-300">06:00 - 22:00</div>
          <div className="text-[10px] text-slate-500">Hoạt động tất cả các ngày</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên cơ sở, địa chỉ, quận..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Lọc theo thành phố:</span>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tất cả thành phố</option>
            <option value="Hà Nội">Hà Nội</option>
            <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
          </select>
        </div>
      </div>

      {/* Locations List / Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-500" />
          <p className="text-sm">Đang tải danh sách cơ sở...</p>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
          <MapPin className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Không tìm thấy cơ sở nào</h3>
          <p className="text-xs text-slate-400">
            Hãy thử tìm kiếm với từ khóa khác hoặc nhấn "Thêm cơ sở mới" để mở rộng chi nhánh
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm cơ sở đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredLocations.map((loc) => {
            return (
              <div
                key={loc.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between"
              >
                {/* Location Top Bar */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-white">{loc.name}</h2>
                        {loc.district && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                            {loc.district}
                          </span>
                        )}
                        {loc.city && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                            {loc.city}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-300 flex items-start gap-1.5 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{loc.address}</span>
                      </div>
                    </div>

                    <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {loc.courts?.length || 0} Sân
                    </span>
                  </div>

                  {/* Directions / Parking info */}
                  {loc.directions && (
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                        <Compass className="w-3.5 h-3.5" />
                        <span>Chỉ dẫn vị trí & Bãi đỗ xe:</span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {loc.directions}
                      </p>
                    </div>
                  )}

                  {/* Operational Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-800 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Giờ mở cửa</div>
                        <div className="font-semibold text-white">
                          {loc.openTime} - {loc.closeTime}
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-800 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Hotline đặt sân</div>
                        <div className="font-semibold text-white truncate">{loc.phone}</div>
                      </div>
                    </div>
                  </div>

                  {/* Courts list inside this location with Court Position badges */}
                  <div className="space-y-2 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>Danh sách sân & Vị trí trong cơ sở:</span>
                      </span>
                      {navigate && (
                        <button
                          onClick={() => navigate("/admin/courts")}
                          className="text-[11px] text-amber-400 hover:underline"
                        >
                          Chỉnh sửa sân & giá →
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {loc.courts?.map((court) => (
                        <div
                          key={court.id}
                          className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white truncate">
                              {court.name}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                court.status === "active"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-rose-500/20 text-rose-400"
                              }`}
                            >
                              {court.status === "active" ? "Hoạt động" : "Bảo trì"}
                            </span>
                          </div>

                          {/* Court position badge */}
                          <div className="flex items-center gap-1 text-[11px] text-amber-300 font-medium">
                            <Navigation className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">
                              {court.position || "Khu trung tâm"}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-400 flex justify-between pt-0.5">
                            <span>Giờ thường: {court.regularPrice.toLocaleString()}đ</span>
                            <span className="text-amber-400">
                              Vàng: {court.peakPrice.toLocaleString()}đ
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Actions Bar */}
                <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {loc.mapUrl ? (
                      <a
                        href={loc.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Xem Google Maps</span>
                      </a>
                    ) : (
                      <button
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              loc.address
                            )}`,
                            "_blank"
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
                      >
                        <Map className="w-3.5 h-3.5 text-amber-400" />
                        <span>Mở bản đồ</span>
                      </button>
                    )}

                    <button
                      onClick={() => setDetailLocation(loc)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                    >
                      Chi tiết
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(loc)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-medium transition flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>

                    <button
                      onClick={() => setDeleteLocationId(loc.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-medium transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT LOCATION */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingLocation ? "Chỉnh sửa Thông tin Cơ sở" : "Thêm Cơ sở Cầu Lông Mới"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cung cấp địa chỉ chuẩn xác và định vị để khách hàng dễ dàng tìm đường
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Tên cơ sở */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Tên cơ sở thi đấu <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Sân Cầu Lông Cầu Giấy, Sân Cầu Lông Đống Đa..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Địa chỉ chi tiết */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Địa chỉ chi tiết <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Số nhà, tên đường, phường..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Quận / Huyện và Tỉnh / Thành phố */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Quận / Huyện
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Cầu Giấy, Đống Đa, Thủ Đức..."
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Tỉnh / Thành phố
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Hà Nội, TP. Hồ Chí Minh..."
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Hotline và Giờ hoạt động */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Số điện thoại Hotline
                  </label>
                  <input
                    type="text"
                    placeholder="0912 345 678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Giờ mở cửa
                  </label>
                  <input
                    type="text"
                    placeholder="06:00"
                    value={formData.openTime}
                    onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Giờ đóng cửa
                  </label>
                  <input
                    type="text"
                    placeholder="22:00"
                    value={formData.closeTime}
                    onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Google Maps Link & Tọa độ */}
              <div className="space-y-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Compass className="w-4 h-4" />
                  <span>Định vị Google Maps & Tọa độ sân</span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Đường dẫn Google Maps (Share Link hoặc Map URL)
                  </label>
                  <input
                    type="text"
                    placeholder="https://maps.google.com/?q=21.033,105.792"
                    value={formData.mapUrl}
                    onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Vĩ độ (Latitude)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="21.033"
                      value={formData.latitude}
                      onChange={(e) =>
                        setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Kinh độ (Longitude)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="105.792"
                      value={formData.longitude}
                      onChange={(e) =>
                        setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Chỉ dẫn tìm đường & bãi đỗ xe */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Chỉ dẫn vị trí & Bãi đỗ xe
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Cách ngã tư 200m, bãi gửi xe máy & ô tô rộng rãi miễn phí tại cổng 2..."
                  value={formData.directions}
                  onChange={(e) => setFormData({ ...formData, directions: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Nếu là tạo mới: chọn số sân ban đầu */}
              {!editingLocation && (
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Khởi tạo số lượng sân ban đầu:
                  </label>
                  <div className="flex gap-3">
                    {[2, 4, 6].map((count) => (
                      <button
                        type="button"
                        key={count}
                        onClick={() => setFormData({ ...formData, initialCourtsCount: count })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                          formData.initialCourtsCount === count
                            ? "bg-amber-500/20 border-amber-500 text-amber-300"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {count} Sân (Tự động gán vị trí)
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Hệ thống sẽ tự động gán phân khu và vị trí chuẩn (Khu A, Khu B, Tầng 1) cho từng sân. Bạn có thể tinh chỉnh sau tại trang Quản lý Sân.
                  </p>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{editingLocation ? "Lưu cập nhật" : "Tạo cơ sở"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETAIL / MAP VIEW */}
      {/* ========================================================================= */}
      {detailLocation && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{detailLocation.name}</span>
                </h3>
                <p className="text-xs text-slate-400">{detailLocation.address}</p>
              </div>

              <button
                onClick={() => setDetailLocation(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Map embed / link action */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <MapPin className="w-4 h-4" />
                    <span>Vị trí trên bản đồ</span>
                  </span>
                  {detailLocation.mapUrl && (
                    <a
                      href={detailLocation.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <span>Mở trong Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <p>• Địa chỉ: <span className="font-semibold text-white">{detailLocation.address}</span></p>
                  {detailLocation.district && (
                    <p>• Quận/Huyện: <span className="text-cyan-400">{detailLocation.district}</span>, {detailLocation.city}</p>
                  )}
                  {detailLocation.latitude ? (
                    <p className="font-mono text-[11px] text-slate-400">
                      • Tọa độ: {detailLocation.latitude}, {detailLocation.longitude}
                    </p>
                  ) : null}
                  {detailLocation.directions && (
                    <p className="pt-2 text-slate-400 text-xs border-t border-slate-800/80">
                      🧭 <span className="text-amber-300 font-medium">Chỉ dẫn:</span> {detailLocation.directions}
                    </p>
                  )}
                </div>
              </div>

              {/* Courts breakdown */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Danh sách sân & Vị trí thực tế ({detailLocation.courts?.length || 0} sân):
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {detailLocation.courts?.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{c.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {c.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5">
                          <Navigation className="w-3 h-3" />
                          <span>{c.position || "Khu trung tâm"}</span>
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        <div className="font-bold text-emerald-400">
                          {c.regularPrice.toLocaleString()}đ /h
                        </div>
                        <div className="text-[10px] text-amber-400">
                          Vàng: {c.peakPrice.toLocaleString()}đ
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setDetailLocation(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONFIRM */}
      {/* ========================================================================= */}
      {deleteLocationId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">Xác nhận xóa cơ sở này?</h3>
              <p className="text-xs text-slate-400">
                Hành động này sẽ xóa toàn bộ thông tin cơ sở và danh sách sân trực thuộc. Các đơn đặt sân cũ vẫn được lưu trữ để đối soát doanh thu.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteLocationId(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Hủy bỏ
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                {deleting ? "Đang xóa..." : "Đồng ý xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
