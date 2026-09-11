import React, { useEffect, useState } from "react";
import { api } from "../../services/api.js";
import { Location } from "../../types/index.js";
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Award,
  Zap,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.locations
      .getAll()
      .then((res) => {
        if (res.success) {
          setLocations(res.locations);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/20 p-8 sm:p-12 lg:p-16">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hệ thống đặt sân cầu lông trực tuyến 24/7</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Đặt Sân Cầu Lông Dễ Dàng, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Giữ Chỗ Tức Thì & Minh Bạch
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Xem lịch sân theo thời gian thực, đặt khung giờ linh hoạt theo từng tiếng, thanh toán nhanh chóng qua QR hoặc tại sân. Thảm thi đấu chuẩn BWF chống trượt chấn thương.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => navigate("/booking")}
              className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm sm:text-base transition shadow-lg shadow-emerald-500/25 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Đặt Sân Ngay Bây Giờ</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate("/my-bookings")}
              className="px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold text-sm sm:text-base transition border border-slate-700 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Tra Cứu Vé Đã Đặt</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Giữ sân 100% không trùng lịch</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Khung giờ 06:00 - 22:00</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Chỉ từ 80.000đ / tiếng</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Policy Section */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Bảng Giá Thuê Sân Niêm Yết</h2>
          <p className="text-sm text-slate-400">
            Biểu phí rõ ràng, không phụ phí ẩn, hỗ trợ đặt sân lẻ hoặc theo nhóm giao lưu
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Card 1: Giờ thường */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 relative hover:border-emerald-500/40 transition">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                Khung giờ vàng tiết kiệm
              </span>
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Giờ Tiêu Chuẩn (Ban Ngày)</h3>
            <p className="text-xs text-slate-400 mb-4">Khung giờ: 06:00 – 16:00 hàng ngày</p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-extrabold text-emerald-400">80.000đ</span>
              <span className="text-slate-400 text-sm">/ tiếng / sân</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Không gian thông thoáng, ánh sáng tự nhiên + đèn 400 Lux</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Phù hợp tập luyện cá nhân, rèn luyện thể lực, nhóm sinh viên</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Miễn phí trà đá, wifi tốc độ cao và phòng tắm nóng lạnh</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Giờ cao điểm */}
          <div className="bg-slate-900/70 border border-amber-500/30 rounded-2xl p-6 relative hover:border-amber-500/60 transition shadow-lg shadow-amber-500/5">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-semibold border border-amber-500/30">
                Cao điểm sau giờ làm việc
              </span>
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Giờ Cao Điểm (Buổi Tối)</h3>
            <p className="text-xs text-slate-400 mb-4">Khung giờ: 16:00 – 22:00 hàng ngày</p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-extrabold text-amber-400">120.000đ</span>
              <span className="text-slate-400 text-sm">/ tiếng / sân</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Bật full 100% công suất đèn thi đấu chống chói</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Không khí thi đấu sôi động, đông đảo bạn chơi giao lưu</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Ưu tiên giữ sân khi thanh toán hoặc đặt trước qua web</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Facilities / Locations Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Hệ Thống Cơ Sở Sân Cầu Lông</h2>
            <p className="text-sm text-slate-400">
              Các cụm sân đạt chuẩn tại Hà Nội và TP. Hồ Chí Minh
            </p>
          </div>

          <button
            onClick={() => navigate("/booking")}
            className="text-emerald-400 hover:text-emerald-300 font-semibold text-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Chọn sân và đặt ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between group"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {loc.courts?.length || 4} Sân thi đấu
                  </span>
                  <span className="text-xs text-slate-400">
                    {loc.openTime} - {loc.closeTime}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition">
                    {loc.name}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-start gap-1.5 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{loc.address}</span>
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hotline sân:</span>
                    <span className="font-semibold text-white">{loc.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Loại thảm:</span>
                    <span className="text-emerald-400">Enlio BWF 4.5mm</span>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => navigate("/booking")}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Xem Lịch Trống & Đặt Sân</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 sm:p-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Thảm Thi Đấu Chuẩn Quốc Tế</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              100% sân sử dụng thảm chuyên dụng Enlio và Yonex có độ ma sát và độ nảy cao, giảm chấn động lên khớp gối và bảo vệ chân vận động viên.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Đặt Lịch 1-Chạm Thông Minh</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bảng ma trận giờ thông minh, tự động ngăn chặn tình trạng đặt trùng giờ (double-booking) và tính tiền chuẩn xác theo giờ thường/cao điểm.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Quản Lý & Hủy Vé Dễ Dàng</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dễ dàng tra cứu danh sách vé đã đặt, xem mã QR vé và có thể hủy đặt sân linh hoạt ngay trên trang cá nhân nếu có việc bận đột xuất.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
