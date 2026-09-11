import React, { ReactNode } from "react";
import { useAuth } from "../../context/AuthContext.js";
import {
  LayoutDashboard,
  CalendarCheck,
  MapPin,
  Users,
  ArrowLeft,
  Shield,
  LogOut,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

interface AdminLayoutProps {
  currentPath: string;
  navigate: (path: string) => void;
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentPath,
  navigate,
  children,
}) => {
  const { user, isAdmin, logout, quickLogin } = useAuth();

  // Role guard: If not an admin, display access barrier with quick-login option
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Yêu cầu quyền Quản Trị Viên</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Khu vực này dành riêng cho tài khoản Quản trị viên (Admin) để duyệt đơn, quản lý doanh thu và trạng thái sân.
            </p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 text-left text-xs text-slate-300 space-y-1.5">
            <p className="font-semibold text-amber-400">Tài khoản quản trị viên thử nghiệm:</p>
            <p>• Email: <span className="font-mono text-white">admin@badminton.vn</span></p>
            <p>• Mật khẩu: <span className="font-mono text-white">admin123</span></p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => quickLogin("admin")}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>Chuyển sang tài khoản Admin ngay (1-chạm)</span>
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
            >
              Quay lại Trang chủ người dùng
            </button>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      path: "/admin",
      label: "Tổng quan thống kê",
      icon: LayoutDashboard,
    },
    {
      path: "/admin/bookings",
      label: "Quản lý Đơn đặt sân",
      icon: CalendarCheck,
    },
    {
      path: "/admin/courts",
      label: "Quản lý Sân & Bảng giá",
      icon: MapPin,
    },
    {
      path: "/admin/users",
      label: "Danh sách Hội viên",
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        {/* Admin Brand */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20">
              🏸
            </div>
            <div>
              <div className="font-bold text-base text-white flex items-center gap-1.5">
                Admin<span className="text-amber-400">Portal</span>
              </div>
              <span className="text-[11px] font-medium text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Quản trị hệ thống
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 flex-1">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Phân hệ Quản trị
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition text-left ${
                  isActive
                    ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-amber-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Giao diện Người dùng
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition border border-dashed border-slate-800 hover:border-emerald-500/30"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Xem trang Khách hàng</span>
          </button>
        </nav>

        {/* Admin User Card & Quick Role Switcher */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                AD
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-amber-400">admin@badminton.vn</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Đăng xuất"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => quickLogin("user")}
            className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center justify-center gap-1.5"
          >
            <span>Đổi sang quyền Người dùng</span>
          </button>
        </div>
      </aside>

      {/* Admin Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Admin Topbar */}
        <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">
              {menuItems.find((m) => m.path === currentPath)?.label || "Bảng điều khiển Admin"}
            </span>
            <span className="hidden sm:inline-block text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
              MongoDB Database Connected
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/booking")}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Tạo lịch đặt sân</span>
            </button>

            <button
              onClick={() => navigate("/")}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Trang chủ
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};
