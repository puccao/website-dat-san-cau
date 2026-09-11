import React from "react";
import { Phone, Mail, MapPin, ShieldCheck, Clock, Award } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                🏸
              </div>
              Badminton<span className="text-emerald-400">Hub</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nền tảng đặt sân cầu lông hiện đại, kết nối trực tiếp với hệ thống sân thi đấu tiêu chuẩn quốc tế tại Hà Nội và TP. Hồ Chí Minh.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Cam kết giữ sân 100% khi đặt thành công</span>
            </div>
          </div>

          {/* Col 2: Hệ thống cơ sở */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Cơ sở sân hoạt động</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Số 35 Trần Quý Kiên, Cầu Giấy, Hà Nội</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Số 18 Võ Văn Ngân, TP. Thủ Đức, TP. HCM</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Số 120 Hoàng Hoa Thám, Tân Bình, TP. HCM</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Tiêu chuẩn sân */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Tiêu chuẩn chất lượng</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Thảm cao su Enlio & Yonex chống trơn BWF</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hệ thống đèn chống chói góc rộng 400 Lux</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Phòng thay đồ, tắm nóng lạnh miễn phí</span>
              </li>
              <li className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Căng cước vợt lấy liền & phụ kiện cầu lông</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Liên hệ & Hỗ trợ */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Hỗ trợ & Đặt chỗ</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hotline: 1900 6868 (06:00 - 22:00)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Email: contact@badminton.vn</span>
              </li>
              <li className="pt-2 text-[11px] text-slate-500">
                Database: MongoDB (Local: mongodb://127.0.0.1:27017)
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-900 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 BadmintonHub. Toàn bộ bản quyền thuộc về hệ thống đặt sân cầu lông.</p>
          <div className="flex items-center gap-4">
            <span>Chính sách hoàn hủy</span>
            <span>•</span>
            <span>Quy định sử dụng sân</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
