import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext.js";
import { Shield, User, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from "lucide-react";

interface LoginPageProps {
  navigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate("/");
    } else {
      setError(res.message || "Đăng nhập thất bại");
    }
  };

  const handleQuick = async (role: "admin" | "user") => {
    setLoading(true);
    const ok = await quickLogin(role);
    setLoading(false);
    if (ok) {
      navigate(role === "admin" ? "/admin" : "/");
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center text-2xl mx-auto shadow-lg shadow-emerald-500/20">
            🏸
          </div>
          <h1 className="text-2xl font-bold text-white">Đăng Nhập Tài Khoản</h1>
          <p className="text-xs text-slate-400">
            Truy cập hệ thống đặt sân hoặc quản trị sân cầu lông
          </p>
        </div>

        {/* 1-Click Fast Login Test Buttons */}
        <div className="space-y-2 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider">
            ⚡ Đăng nhập thử nghiệm 1-chạm
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuick("user")}
              disabled={loading}
              className="py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Khách hàng</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuick("admin")}
              disabled={loading}
              className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Quản Trị</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Traditional Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Email tài khoản</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@badminton.vn hoặc admin@badminton.vn"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <span>{loading ? "Đang xử lý..." : "Đăng Nhập"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Chưa có tài khoản?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-emerald-400 hover:underline font-semibold"
          >
            Đăng ký ngay
          </button>
        </div>
      </div>
    </div>
  );
};
