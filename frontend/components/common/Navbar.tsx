import React from "react";
import { useAuth } from "../../context/AuthContext.js";
import {
  Calendar,
  Clock,
  Shield,
  User as UserIcon,
  LogOut,
  Home,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, isAdmin, logout, quickLogin } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Role testing switcher banner */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Vai trò hiện tại:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded-full ${
                isAdmin
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              {isAdmin ? "👑 Quản Trị Viên (Admin)" : "👤 Người Dùng (Khách hàng)"}
            </span>
            {user && <span className="text-slate-500">({user.email})</span>}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 hidden sm:inline">Chuyển vai trò thử nghiệm:</span>
            <button
              onClick={() => quickLogin("user")}
              className={`px-2.5 py-1 rounded transition text-xs font-medium ${
                !isAdmin
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              👤 Người dùng
            </button>
            <button
              onClick={() => quickLogin("admin")}
              className={`px-2.5 py-1 rounded transition text-xs font-medium ${
                isAdmin
                  ? "bg-amber-600 text-white shadow-sm shadow-amber-500/20"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              👑 Admin
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              🏸
            </div>
            <div>
              <div className="font-bold text-lg text-white flex items-center gap-1.5">
                Badminton<span className="text-emerald-400">Hub</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  VN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Hệ thống đặt sân cầu lông chuyên nghiệp
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => navigate("/")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                currentPath === "/"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Trang chủ</span>
            </button>

            <button
              onClick={() => navigate("/booking")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                currentPath === "/booking"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Đặt sân</span>
            </button>

            <button
              onClick={() => navigate("/my-bookings")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                currentPath === "/my-bookings"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Lịch sử đặt sân</span>
            </button>

            {/* If Admin, show direct link to Admin Area */}
            {isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 ml-1"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Trang Admin</span>
              </button>
            )}
          </nav>

          {/* User Profile / Auth Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-sm font-semibold text-white leading-tight">
                    {user.name}
                  </span>
                  <span className="text-xs text-slate-400 leading-tight">
                    {isAdmin ? "Quản trị viên" : "Hội viên"}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Đăng xuất"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition border border-slate-800"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/login")}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
                >
                  Đăng ký
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
