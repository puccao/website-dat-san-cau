import React, { useState, useEffect } from "react";
import { api } from "../../services/api.js";
import { Location, Court, CourtZone } from "../../types/index.js";
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
  ChevronRight,
  ShieldCheck,
  Tag,
  Building,
  Phone,
  Settings,
} from "lucide-react";

export const AdminCourtsPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [updatingCourtId, setUpdatingCourtId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [viewMode, setViewMode] = useState<"hierarchy" | "facilities">("hierarchy");

  // ==========================================
  // LOCATION CRUD STATE (Cơ Sở)
  // ==========================================
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationForm, setLocationForm] = useState({
    name: "",
    address: "",
    district: "Cầu Giấy",
    city: "Hà Nội",
    phone: "0988 123 456",
    openTime: "06:00",
    closeTime: "22:00",
    directions: "",
    mapUrl: "",
    initialCourtsCount: 4,
  });
  const [locationFormError, setLocationFormError] = useState<string>("");
  const [isSubmittingLocation, setIsSubmittingLocation] = useState<boolean>(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [isDeletingLocation, setIsDeletingLocation] = useState<boolean>(false);

  // Court Modal State (Add / Edit Sân)
  const [isCourtModalOpen, setIsCourtModalOpen] = useState<boolean>(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [targetLocationId, setTargetLocationId] = useState<string>("");
  const [courtForm, setCourtForm] = useState({
    name: "",
    type: "Standard" as "Standard" | "VIP" | "Indoor",
    regularPrice: 80000,
    peakPrice: 120000,
    status: "active" as "active" | "maintenance",
    zone: "Khu A (Tầng 1)",
    position: "Sân số 1",
  });
  const [courtFormError, setCourtFormError] = useState<string>("");
  const [isSubmittingCourt, setIsSubmittingCourt] = useState<boolean>(false);

  // Zone Modal State (Add / Edit Khu vực)
  const [isZoneModalOpen, setIsZoneModalOpen] = useState<boolean>(false);
  const [editingZone, setEditingZone] = useState<CourtZone | null>(null);
  const [zoneForm, setZoneForm] = useState({
    name: "",
    description: "",
  });
  const [zoneFormError, setZoneFormError] = useState<string>("");
  const [isSubmittingZone, setIsSubmittingZone] = useState<boolean>(false);

  const fetchLocations = () => {
    setLoading(true);
    api.locations
      .getAll()
      .then((res) => {
        if (res.success) {
          setLocations(res.locations);
          // Default to Sân Cầu Lông Cầu Giấy if present, or first location
          if (!selectedLocationId && res.locations.length > 0) {
            const cauGiayLoc = res.locations.find((l) =>
              l.name.toLowerCase().includes("cầu giấy")
            );
            setSelectedLocationId(cauGiayLoc ? cauGiayLoc.id : res.locations[0].id);
          }
        }
      })
      .catch((err) => console.error("Error fetching locations:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const activeLocation =
    locations.find((l) => l.id === selectedLocationId) || locations[0] || null;

  // Derive zones for active location
  const locationZones: CourtZone[] = React.useMemo(() => {
    if (!activeLocation) return [];
    if (activeLocation.zones && activeLocation.zones.length > 0) {
      return activeLocation.zones;
    }
    // Fallback zones extracted from courts if not explicitly stored
    const zoneNames = Array.from(
      new Set(activeLocation.courts.map((c) => c.zone || "Khu A (Tầng 1)"))
    );
    return zoneNames.map((name, idx) => ({
      id: `zone_gen_${idx}`,
      name,
      description: `Khu vực quản lý sân ${name}`,
    }));
  }, [activeLocation]);

  // Group courts by Zone
  const courtsByZone = React.useMemo(() => {
    if (!activeLocation) return {};
    const map: Record<string, Court[]> = {};

    // Initialize all existing zones
    locationZones.forEach((z) => {
      map[z.name] = [];
    });

    // Populate courts into zones
    activeLocation.courts.forEach((c) => {
      const zName = c.zone || locationZones[0]?.name || "Khu A (Tầng 1)";
      if (!map[zName]) {
        map[zName] = [];
      }
      map[zName].push(c);
    });

    return map;
  }, [activeLocation, locationZones]);

  // ==========================================
  // LOCATION CRUD HANDLERS (Quản lý Cơ Sở)
  // ==========================================
  const openAddLocationModal = () => {
    setEditingLocation(null);
    const nextIdx = locations.length + 1;
    setLocationForm({
      name: `Sân Cầu Lông Cơ Sở ${nextIdx}`,
      address: "Số 123 Đường Cầu Giấy, Dịch Vọng",
      district: "Cầu Giấy",
      city: "Hà Nội",
      phone: "0988 123 456",
      openTime: "06:00",
      closeTime: "22:00",
      directions: "Bãi đỗ xe máy và ô tô miễn phí trước cửa sân, lối vào thuận tiện.",
      mapUrl: "",
      initialCourtsCount: 4,
    });
    setLocationFormError("");
    setIsLocationModalOpen(true);
  };

  const openEditLocationModal = (loc: Location) => {
    setEditingLocation(loc);
    setLocationForm({
      name: loc.name,
      address: loc.address,
      district: loc.district || "",
      city: loc.city || "Hà Nội",
      phone: loc.phone || "0900 000 000",
      openTime: loc.openTime || "06:00",
      closeTime: loc.closeTime || "22:00",
      directions: loc.directions || "",
      mapUrl: loc.mapUrl || "",
      initialCourtsCount: loc.courts?.length || 4,
    });
    setLocationFormError("");
    setIsLocationModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocationFormError("");

    if (!locationForm.name.trim()) {
      setLocationFormError("Vui lòng nhập tên cơ sở");
      return;
    }
    if (!locationForm.address.trim()) {
      setLocationFormError("Vui lòng nhập địa chỉ cơ sở");
      return;
    }

    try {
      setIsSubmittingLocation(true);
      if (editingLocation) {
        const res = await api.locations.update(editingLocation.id, {
          name: locationForm.name.trim(),
          address: locationForm.address.trim(),
          district: locationForm.district.trim(),
          city: locationForm.city.trim(),
          phone: locationForm.phone.trim(),
          openTime: locationForm.openTime,
          closeTime: locationForm.closeTime,
          directions: locationForm.directions.trim(),
          mapUrl: locationForm.mapUrl.trim(),
        });

        if (res.success) {
          setFeedback({
            text: `Đã cập nhật thông tin cơ sở "${locationForm.name}" thành công!`,
            type: "success",
          });
          setIsLocationModalOpen(false);
          fetchLocations();
        } else {
          setLocationFormError(res.message || "Không thể cập nhật cơ sở");
        }
      } else {
        const count = Math.max(1, Math.min(16, Number(locationForm.initialCourtsCount) || 4));
        const initialCourts = Array.from({ length: count }, (_, i) => ({
          id: `court_${Date.now()}_${i + 1}`,
          name: `Sân ${i + 1}`,
          type: "Standard" as const,
          status: "active" as const,
          regularPrice: 80000,
          peakPrice: 120000,
          zone: i < 2 ? "Khu A (Tầng 1)" : "Khu B (Tầng 1)",
          position: `Sân số ${i + 1}`,
        }));

        const initialZones = [
          { id: "zone_a", name: "Khu A (Tầng 1)", description: "Mặt thảm Enlio tiêu chuẩn thi đấu, gần quầy lễ tân" },
          { id: "zone_b", name: "Khu B (Tầng 1)", description: "Không gian thoáng mát cạnh khán đài" },
          { id: "zone_vip", name: "Khu VIP (Tầng 2)", description: "Thảm Yonex cao cấp có máy lạnh riêng biệt" },
        ];

        const res = await api.locations.create({
          name: locationForm.name.trim(),
          address: locationForm.address.trim(),
          district: locationForm.district.trim(),
          city: locationForm.city.trim(),
          phone: locationForm.phone.trim(),
          openTime: locationForm.openTime,
          closeTime: locationForm.closeTime,
          directions: locationForm.directions.trim(),
          mapUrl: locationForm.mapUrl.trim(),
          zones: initialZones,
          courts: initialCourts,
        });

        if (res.success) {
          setFeedback({
            text: `Đã thêm cơ sở mới "${locationForm.name}" thành công!`,
            type: "success",
          });
          setIsLocationModalOpen(false);
          if (res.location?.id) {
            setSelectedLocationId(res.location.id);
          }
          fetchLocations();
        } else {
          setLocationFormError(res.message || "Không thể tạo cơ sở mới");
        }
      }
    } catch (err: any) {
      setLocationFormError(err.message || "Lỗi khi lưu thông tin cơ sở");
    } finally {
      setIsSubmittingLocation(false);
    }
  };

  const confirmDeleteLocation = (loc: Location) => {
    if (locations.length <= 1) {
      alert("Hệ thống phải có ít nhất 1 cơ sở hoạt động. Không thể xóa cơ sở duy nhất.");
      return;
    }
    setLocationToDelete(loc);
  };

  const handleExecuteDeleteLocation = async () => {
    if (!locationToDelete) return;

    try {
      setIsDeletingLocation(true);
      const res = await api.locations.delete(locationToDelete.id);
      if (res.success) {
        setFeedback({
          text: `Đã xóa cơ sở "${locationToDelete.name}" thành công!`,
          type: "success",
        });
        setLocationToDelete(null);
        const remaining = locations.filter((l) => l.id !== locationToDelete.id);
        if (remaining.length > 0) {
          setSelectedLocationId(remaining[0].id);
        }
        fetchLocations();
      } else {
        setFeedback({ text: res.message || "Không thể xóa cơ sở", type: "error" });
      }
    } catch (err: any) {
      setFeedback({ text: err.message || "Lỗi khi xóa cơ sở", type: "error" });
    } finally {
      setIsDeletingLocation(false);
    }
  };

  // ==========================================
  // COURT CRUD HANDLERS
  // ==========================================
  const openAddCourtModal = (locationId: string, preselectedZone?: string) => {
    setTargetLocationId(locationId);
    setEditingCourt(null);

    const loc = locations.find((l) => l.id === locationId);
    const existingCourts = loc?.courts || [];
    const nextCourtNum = existingCourts.length + 1;
    const defaultZone = preselectedZone || locationZones[0]?.name || "Khu A (Tầng 1)";

    setCourtForm({
      name: `Sân ${nextCourtNum}`,
      type: "Standard",
      regularPrice: 80000,
      peakPrice: 120000,
      status: "active",
      zone: defaultZone,
      position: `Sân số ${nextCourtNum}`,
    });
    setCourtFormError("");
    setIsCourtModalOpen(true);
  };

  const openEditCourtModal = (locationId: string, court: Court) => {
    setTargetLocationId(locationId);
    setEditingCourt(court);
    setCourtForm({
      name: court.name,
      type: (court.type as any) || "Standard",
      regularPrice: court.regularPrice,
      peakPrice: court.peakPrice,
      status: court.status,
      zone: court.zone || locationZones[0]?.name || "Khu A (Tầng 1)",
      position: court.position || "Sân tiêu chuẩn",
    });
    setCourtFormError("");
    setIsCourtModalOpen(true);
  };

  const handleSaveCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourtFormError("");

    if (!courtForm.name.trim()) {
      setCourtFormError("Vui lòng nhập tên sân");
      return;
    }

    if (courtForm.regularPrice <= 0 || courtForm.peakPrice <= 0) {
      setCourtFormError("Giá sân phải lớn hơn 0");
      return;
    }

    try {
      setIsSubmittingCourt(true);
      if (editingCourt) {
        const res = await api.locations.updateCourt(targetLocationId, editingCourt.id, {
          name: courtForm.name.trim(),
          type: courtForm.type,
          regularPrice: Number(courtForm.regularPrice),
          peakPrice: Number(courtForm.peakPrice),
          status: courtForm.status,
          zone: courtForm.zone.trim(),
          position: courtForm.position.trim(),
        });

        if (res.success) {
          setFeedback({ text: `Đã cập nhật ${courtForm.name} thành công!`, type: "success" });
          setIsCourtModalOpen(false);
          fetchLocations();
        } else {
          setCourtFormError(res.message || "Không thể cập nhật sân");
        }
      } else {
        const res = await api.locations.addCourt(targetLocationId, {
          name: courtForm.name.trim(),
          type: courtForm.type,
          regularPrice: Number(courtForm.regularPrice),
          peakPrice: Number(courtForm.peakPrice),
          status: courtForm.status,
          zone: courtForm.zone.trim(),
          position: courtForm.position.trim(),
        });

        if (res.success) {
          setFeedback({ text: `Đã thêm ${courtForm.name} vào ${courtForm.zone} thành công!`, type: "success" });
          setIsCourtModalOpen(false);
          fetchLocations();
        } else {
          setCourtFormError(res.message || "Không thể thêm sân mới");
        }
      }
    } catch (err: any) {
      setCourtFormError(err.message || "Lỗi khi lưu thông tin sân");
    } finally {
      setIsSubmittingCourt(false);
    }
  };

  const handleDeleteCourt = async (locationId: string, court: Court) => {
    if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn sân "${court.name}"?`)) {
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

  // ==========================================
  // ZONE CRUD HANDLERS
  // ==========================================
  const openAddZoneModal = () => {
    setEditingZone(null);
    const count = locationZones.length + 1;
    setZoneForm({
      name: `Khu vực ${count}`,
      description: "Thảm Enlio tiêu chuẩn, hệ thống chiếu sáng LED chống lóa",
    });
    setZoneFormError("");
    setIsZoneModalOpen(true);
  };

  const openEditZoneModal = (zone: CourtZone) => {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name,
      description: zone.description || "",
    });
    setZoneFormError("");
    setIsZoneModalOpen(true);
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setZoneFormError("");

    if (!zoneForm.name.trim()) {
      setZoneFormError("Vui lòng nhập tên khu vực");
      return;
    }

    if (!activeLocation) return;

    try {
      setIsSubmittingZone(true);
      if (editingZone) {
        const res = await api.locations.updateZone(activeLocation.id, editingZone.id, {
          name: zoneForm.name.trim(),
          description: zoneForm.description.trim(),
        });
        if (res.success) {
          setFeedback({ text: `Đã cập nhật khu vực "${zoneForm.name}" thành công!`, type: "success" });
          setIsZoneModalOpen(false);
          fetchLocations();
        } else {
          setZoneFormError(res.message || "Không thể cập nhật khu vực");
        }
      } else {
        const res = await api.locations.addZone(activeLocation.id, {
          name: zoneForm.name.trim(),
          description: zoneForm.description.trim(),
        });
        if (res.success) {
          setFeedback({ text: `Đã thêm khu vực mới "${zoneForm.name}" thành công!`, type: "success" });
          setIsZoneModalOpen(false);
          fetchLocations();
        } else {
          setZoneFormError(res.message || "Không thể thêm khu vực");
        }
      }
    } catch (err: any) {
      setZoneFormError(err.message || "Lỗi khi lưu khu vực");
    } finally {
      setIsSubmittingZone(false);
    }
  };

  const handleDeleteZone = async (zone: CourtZone) => {
    if (!activeLocation) return;
    const courtsInThisZone = courtsByZone[zone.name] || [];
    const confirmMsg =
      courtsInThisZone.length > 0
        ? `Khu vực "${zone.name}" đang có ${courtsInThisZone.length} sân. Nếu xóa, các sân này sẽ được tự động chuyển sang khu vực mặc định. Bạn có chắc muốn xóa?`
        : `Bạn có chắc muốn xóa khu vực "${zone.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.locations.deleteZone(activeLocation.id, zone.id);
      if (res.success) {
        setFeedback({ text: res.message || `Đã xóa khu vực "${zone.name}"`, type: "success" });
        fetchLocations();
      } else {
        setFeedback({ text: res.message || "Lỗi xóa khu vực", type: "error" });
      }
    } catch (err: any) {
      setFeedback({ text: err.message || "Lỗi khi xóa khu vực", type: "error" });
    }
  };

  // Summary Metrics
  const activeCourtsCount = activeLocation
    ? activeLocation.courts.filter((c) => c.status === "active").length
    : 0;
  const maintenanceCourtsCount = activeLocation
    ? activeLocation.courts.filter((c) => c.status === "maintenance").length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building className="w-6 h-6 text-amber-400" />
            <span>Quản Lý Cơ Sở, Khu Vực & Sân Thi Đấu</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Hệ thống phân cấp 3 tầng toàn diện: <strong className="text-amber-400 font-semibold">Cơ sở</strong> &rarr; <strong className="text-amber-300 font-semibold">Khu vực (Zone)</strong> &rarr; <strong className="text-emerald-400 font-semibold">Sân thi đấu</strong>. Hỗ trợ đầy đủ thêm, sửa, xóa (CRUD).
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 self-start sm:self-auto">
          {/* Primary Button: Thêm Cơ Sở Mới */}
          <button
            onClick={openAddLocationModal}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            title="Thêm một cơ sở / chi nhánh sân cầu lông mới vào hệ thống"
          >
            <Building className="w-4 h-4" />
            <span>+ Thêm Cơ Sở Mới</span>
          </button>

          {viewMode === "hierarchy" && activeLocation && (
            <>
              <button
                onClick={openAddZoneModal}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5"
                title="Thêm khu vực mới cho cơ sở này"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Thêm Khu Vực</span>
              </button>

              <button
                onClick={() => openAddCourtModal(activeLocation.id)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
                title="Thêm sân thi đấu mới"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Sân Mới</span>
              </button>
            </>
          )}

          <button
            onClick={fetchLocations}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* View Mode Switcher: Phân cấp vs Danh sách cơ sở */}
      <div className="flex border-b border-slate-800 pb-2 gap-3 text-xs font-bold">
        <button
          onClick={() => setViewMode("hierarchy")}
          className={`pb-2 px-3 flex items-center gap-2 border-b-2 transition ${
            viewMode === "hierarchy"
              ? "border-amber-400 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>🏸 Phân Cấp Khu Vực & Sân Đấu</span>
        </button>

        <button
          onClick={() => setViewMode("facilities")}
          className={`pb-2 px-3 flex items-center gap-2 border-b-2 transition ${
            viewMode === "facilities"
              ? "border-amber-400 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>🏢 Danh Sách Tất Cả Cơ Sở ({locations.length})</span>
        </button>
      </div>

      {/* Feedback Message */}
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

      {/* VIEW MODE 1: HIERARCHY (Cấu trúc Khu vực & Sân đấu) */}
      {viewMode === "hierarchy" && (
        <>
          {/* Location Selector Tabs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-400 font-semibold px-3 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-amber-400" />
              <span>Chọn Cơ Sở:</span>
            </span>
            {locations.map((loc) => {
              const isSelected = loc.id === (activeLocation?.id || "");
              const isCauGiay = loc.name.toLowerCase().includes("cầu giấy");

              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocationId(loc.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    isSelected
                      ? isCauGiay
                        ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                        : "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
                      : "bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{loc.name}</span>
                  {isCauGiay && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${
                        isSelected ? "bg-slate-950 text-amber-300" : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      Cơ sở chính
                    </span>
                  )}
                  <span className="text-[11px] opacity-75 font-mono">({loc.courts?.length || 0} sân)</span>
                </button>
              );
            })}

            {/* Quick Add Location in Tab Bar */}
            <button
              onClick={openAddLocationModal}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-950/60 hover:bg-slate-800 text-amber-400 border border-dashed border-amber-500/40 transition flex items-center gap-1.5 ml-auto sm:ml-0"
              title="Thêm cơ sở mới"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm cơ sở</span>
            </button>
          </div>

          {/* Active Location Info & Stats */}
          {activeLocation && (
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                      Cơ sở đang chọn
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{activeLocation.openTime} - {activeLocation.closeTime}</span>
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <strong className="text-slate-300">{activeLocation.phone}</strong>
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <span>{activeLocation.name}</span>
                  </h2>

                  <p className="text-xs text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{activeLocation.address}{activeLocation.district ? `, ${activeLocation.district}` : ""}{activeLocation.city ? `, ${activeLocation.city}` : ""}</span>
                  </p>

                  {/* Directions / Parking info */}
                  {activeLocation.directions && (
                    <p className="text-xs text-amber-300/80 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 mt-2">
                      <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Chỉ đường & bãi xe: {activeLocation.directions}</span>
                    </p>
                  )}
                </div>

                {/* Right side: Facility CRUD actions + Stats */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3">
                  {/* Facility Edit & Delete Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditLocationModal(activeLocation)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      title="Chỉnh sửa thông tin cơ sở này"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Sửa Cơ Sở</span>
                    </button>

                    <button
                      onClick={() => confirmDeleteLocation(activeLocation)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs font-semibold transition flex items-center gap-1.5"
                      title="Xóa cơ sở này khỏi hệ thống"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa Cơ Sở</span>
                    </button>
                  </div>

                  {/* Location metrics */}
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">Khu vực</span>
                      <span className="text-sm font-black text-amber-400">{locationZones.length}</span>
                    </div>
                    <div className="bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">Tổng sân</span>
                      <span className="text-sm font-black text-white">{activeLocation.courts.length}</span>
                    </div>
                    <div className="bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">Sẵn sàng</span>
                      <span className="text-sm font-black text-emerald-400">{activeCourtsCount}</span>
                    </div>
                    <div className="bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">Bảo trì</span>
                      <span className="text-sm font-black text-rose-400">{maintenanceCourtsCount}</span>
                    </div>
                  </div>
                </div>
              </div>

          {/* Zones & Courts Hierarchy */}
          <div className="space-y-6 pt-2">
            {locationZones.map((zone) => {
              const courtsInZone = courtsByZone[zone.name] || [];

              return (
                <div
                  key={zone.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4"
                >
                  {/* Zone Header (CRUD for Zone) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Tag className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-base">{zone.name}</h3>
                          <span className="text-[11px] bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800 text-slate-300 font-semibold">
                            {courtsInZone.length} sân
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {zone.description || "Mặt thảm Enlio tiêu chuẩn, ánh sáng LED chống lóa"}
                        </p>
                      </div>
                    </div>

                    {/* Zone Actions: Add Court directly to Zone + Edit Zone + Delete Zone */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => openAddCourtModal(activeLocation.id, zone.name)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition"
                        title={`Thêm sân mới vào ${zone.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm sân vào {zone.name}</span>
                      </button>

                      <button
                        onClick={() => openEditZoneModal(zone)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
                        title="Sửa tên & mô tả khu vực"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteZone(zone)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 transition"
                        title="Xóa khu vực này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Courts in this Zone */}
                  {courtsInZone.length === 0 ? (
                    <div className="py-8 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-800 space-y-2">
                      <p className="text-xs text-slate-400">
                        Chưa có sân nào trong <strong>{zone.name}</strong>
                      </p>
                      <button
                        onClick={() => openAddCourtModal(activeLocation.id, zone.name)}
                        className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm sân đầu tiên vào {zone.name}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                      {courtsInZone.map((court) => {
                        const isBusy = updatingCourtId === court.id;
                        const isMaintenance = court.status === "maintenance";

                        return (
                          <div
                            key={court.id}
                            className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                              isMaintenance
                                ? "bg-slate-900/70 border-rose-900/40 text-slate-400"
                                : "bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700"
                            }`}
                          >
                            <div className="space-y-2.5">
                              {/* Name & Status */}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="font-bold text-sm text-white block">
                                    {court.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                    {court.type === "VIP"
                                      ? "VIP Yonex"
                                      : court.type === "Indoor"
                                      ? "Trong Nhà"
                                      : "Tiêu Chuẩn"}
                                  </span>
                                </div>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                                    isMaintenance
                                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  }`}
                                >
                                  {isMaintenance ? "Đang bảo trì" : "Hoạt động"}
                                </span>
                              </div>

                              {/* Vị trí trong khu vực */}
                              <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                                <Navigation className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate">{court.position || "Sân tiêu chuẩn"}</span>
                              </div>

                              {/* Bảng giá */}
                              <div className="text-xs space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Giờ thường:</span>
                                  <span className="font-semibold text-white font-mono">
                                    {court.regularPrice.toLocaleString()}đ/h
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Giờ cao điểm:</span>
                                  <span className="font-semibold text-amber-400 font-mono">
                                    {court.peakPrice.toLocaleString()}đ/h
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions on Court (Toggle, Edit, Delete) */}
                            <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5">
                              <button
                                onClick={() => handleToggleStatus(activeLocation.id, court)}
                                disabled={isBusy}
                                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                                  isMaintenance
                                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                    : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                                }`}
                              >
                                {isMaintenance ? "Kích hoạt" : "Bảo trì"}
                              </button>

                              <button
                                onClick={() => openEditCourtModal(activeLocation.id, court)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                title="Chỉnh sửa sân"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteCourt(activeLocation.id, court)}
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
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  )}

  {/* VIEW MODE 2: ALL FACILITIES (Quản lý Danh Sách Tất Cả Cơ Sở) */}
  {viewMode === "facilities" && (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-400" />
            <span>Danh Sách Các Cơ Sở / Chi Nhánh ({locations.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Quản lý tập trung toàn bộ cơ sở trong chuỗi sân cầu lông. Bạn có thể thêm cơ sở mới, chỉnh sửa thông tin hoặc xóa cơ sở.
          </p>
        </div>

        <button
          onClick={openAddLocationModal}
          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thêm Cơ Sở Mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc) => {
          const isCauGiay = loc.name.toLowerCase().includes("cầu giấy");
          const courts = loc.courts || [];
          const activeCount = courts.filter((c) => c.status === "active").length;
          const maintCount = courts.filter((c) => c.status === "maintenance").length;
          const zoneCount = loc.zones?.length || 2;

          return (
            <div
              key={loc.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg transition"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base leading-tight flex items-center gap-1.5">
                        <span>{loc.name}</span>
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isCauGiay && (
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            Cơ sở chính
                          </span>
                        )}
                        <span className="text-xs text-slate-400">
                          {loc.district || "Hà Nội"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info rows */}
                <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{loc.address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Hotline: <strong className="text-white">{loc.phone || "0988 123 456"}</strong></span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Giờ mở cửa: <strong className="text-slate-200">{loc.openTime} - {loc.closeTime}</strong></span>
                  </p>
                  {loc.directions && (
                    <p className="text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg flex items-start gap-1.5 mt-1">
                      <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{loc.directions}</span>
                    </p>
                  )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
                  <div className="bg-slate-950 p-2 rounded-xl text-center border border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block">Khu vực</span>
                    <span className="text-xs font-black text-amber-400">{zoneCount}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl text-center border border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block">Tổng sân</span>
                    <span className="text-xs font-black text-white">{courts.length}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl text-center border border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block">Sẵn sàng</span>
                    <span className="text-xs font-black text-emerald-400">{activeCount}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl text-center border border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block">Bảo trì</span>
                    <span className="text-xs font-black text-rose-400">{maintCount}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    setSelectedLocationId(loc.id);
                    setViewMode("hierarchy");
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  title="Xem các khu vực và sân của cơ sở này"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Xem & Quản Lý Sân</span>
                </button>

                <button
                  onClick={() => openEditLocationModal(loc)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Chỉnh sửa thông tin cơ sở"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => confirmDeleteLocation(loc)}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Xóa cơ sở"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Facility Card */}
        <div
          onClick={openAddLocationModal}
          className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition group min-h-[260px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500 text-amber-400 group-hover:text-slate-950 flex items-center justify-center mb-3 transition shadow-lg">
            <Plus className="w-6 h-6" />
          </div>
          <h4 className="text-white font-bold text-sm group-hover:text-amber-300 transition">
            Thêm Cơ Sở / Chi Nhánh Mới
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
            Mở rộng chuỗi sân, thiết lập địa chỉ, giờ hoạt động và các sân con.
          </p>
        </div>
      </div>
    </div>
  )}

      {/* ========================================== */}
      {/* ADD / EDIT COURT MODAL */}
      {/* ========================================== */}
      {isCourtModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>{editingCourt ? `Sửa Sân: ${editingCourt.name}` : "Thêm Sân Mới Vào Khu Vực"}</span>
              </h3>
              <button
                onClick={() => setIsCourtModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {courtFormError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{courtFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCourt} className="space-y-4 text-xs">
              {/* Chọn Khu Vực (Zone) */}
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
                  Thuộc Khu Vực (Zone) *
                </label>
                <select
                  value={courtForm.zone}
                  onChange={(e) => setCourtForm({ ...courtForm, zone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
                >
                  {locationZones.map((z) => (
                    <option key={z.id} value={z.name}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tên sân */}
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
                  Tên Sân Thi Đấu * (Ví dụ: Sân 1, Sân 2, Sân VIP 1)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Sân 1"
                  value={courtForm.name}
                  onChange={(e) => setCourtForm({ ...courtForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Vị trí chi tiết */}
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
                  Vị trí chi tiết trong khu vực
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Sân số 1 (Gần lối vào), Cạnh khán đài A..."
                  value={courtForm.position}
                  onChange={(e) => setCourtForm({ ...courtForm, position: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Phân loại & Trạng thái */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Phân loại sân</label>
                  <select
                    value={courtForm.type}
                    onChange={(e: any) => setCourtForm({ ...courtForm, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Standard">Tiêu chuẩn (Enlio)</option>
                    <option value="VIP">VIP (Yonex)</option>
                    <option value="Indoor">Trong nhà</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Trạng thái</label>
                  <select
                    value={courtForm.status}
                    onChange={(e: any) => setCourtForm({ ...courtForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="active">Sẵn sàng hoạt động</option>
                    <option value="maintenance">Đang bảo trì</option>
                  </select>
                </div>
              </div>

              {/* Giá giờ thường */}
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
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

              {/* Giá giờ cao điểm */}
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
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

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCourtModalOpen(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCourt}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-1.5"
                >
                  {isSubmittingCourt ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{editingCourt ? "Lưu Thay Đổi Sân" : "Tạo Sân Mới"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ADD / EDIT ZONE MODAL */}
      {/* ========================================== */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>{editingZone ? `Sửa Khu Vực: ${editingZone.name}` : "Thêm Khu Vực Mới"}</span>
              </h3>
              <button
                onClick={() => setIsZoneModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {zoneFormError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{zoneFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveZone} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
                  Tên Khu Vực * (Ví dụ: Khu A, Khu B, Khu VIP, Tầng 2...)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Khu A (Tầng 1)"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
                  Mô tả / Đặc điểm khu vực
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Thảm Enlio tiêu chuẩn thi đấu, gần quầy lễ tân và phòng thay đồ..."
                  value={zoneForm.description}
                  onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsZoneModalOpen(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingZone}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-1.5"
                >
                  {isSubmittingZone ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{editingZone ? "Lưu Khu Vực" : "Tạo Khu Vực"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ADD / EDIT LOCATION MODAL (CƠ SỞ) */}
      {/* ========================================== */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-400" />
                <span>{editingLocation ? `Sửa Cơ Sở: ${editingLocation.name}` : "Thêm Cơ Sở Sân Cầu Lông Mới"}</span>
              </h3>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {locationFormError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{locationFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveLocation} className="space-y-3.5 text-xs">
              {/* Tên cơ sở */}
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
                  Tên Cơ Sở / Chi Nhánh *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Sân Cầu Lông Cầu Giấy"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Địa chỉ chi tiết */}
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
                  Địa chỉ chi tiết *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Số 35 Phố Dịch Vọng Hậu"
                  value={locationForm.address}
                  onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Quận / Huyện & Thành Phố */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    Quận / Huyện
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Cầu Giấy"
                    value={locationForm.district}
                    onChange={(e) => setLocationForm({ ...locationForm, district: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    Tỉnh / Thành Phố
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Hà Nội"
                    value={locationForm.city}
                    onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Hotline & Số sân */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    Hotline liên hệ
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 0988 123 456"
                    value={locationForm.phone}
                    onChange={(e) => setLocationForm({ ...locationForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {!editingLocation && (
                  <div>
                    <label className="text-slate-300 font-semibold mb-1 block">
                      Số sân khởi tạo ban đầu
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={locationForm.initialCourtsCount}
                      onChange={(e) => setLocationForm({ ...locationForm, initialCourtsCount: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Giờ mở cửa & Giờ đóng cửa */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    Giờ mở cửa
                  </label>
                  <input
                    type="text"
                    placeholder="06:00"
                    value={locationForm.openTime}
                    onChange={(e) => setLocationForm({ ...locationForm, openTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    Giờ đóng cửa
                  </label>
                  <input
                    type="text"
                    placeholder="22:00"
                    value={locationForm.closeTime}
                    onChange={(e) => setLocationForm({ ...locationForm, closeTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Hướng dẫn chỉ đường & bãi xe */}
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
                  Hướng dẫn chỉ đường & bãi gửi xe
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Bãi đỗ xe máy và ô tô miễn phí trước cửa sân, lối vào từ đường lớn..."
                  value={locationForm.directions}
                  onChange={(e) => setLocationForm({ ...locationForm, directions: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLocation}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  {isSubmittingLocation ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{editingLocation ? "Lưu Thay Đổi Cơ Sở" : "Tạo Cơ Sở Mới"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DELETE LOCATION CONFIRMATION MODAL */}
      {/* ========================================== */}
      {locationToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Xác nhận xóa cơ sở</h3>
                <p className="text-xs text-slate-400">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs">
              <p className="text-slate-200">
                Bạn có chắc chắn muốn xóa cơ sở <strong className="text-amber-400 font-bold">"{locationToDelete.name}"</strong>?
              </p>
              <p className="text-slate-400">
                Địa chỉ: {locationToDelete.address}
              </p>
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-[11px]">
                ⚠️ Cảnh báo: Toàn bộ <strong>{locationToDelete.courts?.length || 0} sân thi đấu</strong> và các khu vực thuộc cơ sở này sẽ bị xóa khỏi hệ thống.
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setLocationToDelete(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteLocation}
                disabled={isDeletingLocation}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center gap-1.5 text-xs shadow-lg shadow-rose-950/40"
              >
                {isDeletingLocation ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Xóa Cơ Sở Này</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
