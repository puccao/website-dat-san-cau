import React, { useState, useEffect } from "react";
import { api } from "../../services/api.js";
import { User } from "../../types/index.js";
import { Users, RefreshCw, Mail, Phone, Calendar, ShieldCheck, UserCheck } from "lucide-react";

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<
    (User & { bookingCount: number; totalSpent: number; createdAt: string })[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUsers = () => {
    setLoading(true);
    api.admin
      .getUsers()
      .then((res) => {
        if (res.success) {
          setUsers(res.users);
        }
      })
      .catch((err) => console.error("Error fetching users:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>Danh Sách Người Dùng & Hội Viên</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý tài khoản, phân quyền vai trò (Admin / User) và số liệu chi tiêu
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
            Đang tải dữ liệu hội viên...
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">Chưa có người dùng nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Tên người dùng</th>
                  <th className="py-3.5 px-4">Liên hệ (Email / SĐT)</th>
                  <th className="py-3.5 px-4">Vai trò (Role)</th>
                  <th className="py-3.5 px-4">Số lượt đặt sân</th>
                  <th className="py-3.5 px-4">Tổng chi tiêu</th>
                  <th className="py-3.5 px-4 text-right">Ngày tham gia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const isAdmin = u.role === "admin";
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              isAdmin
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{u.name}</div>
                            <div className="text-[10px] text-slate-500">ID: {u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            isAdmin
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          }`}
                        >
                          {isAdmin ? (
                            <>
                              <ShieldCheck className="w-3 h-3 text-amber-400" />
                              <span>Quản trị viên (Admin)</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3 text-emerald-400" />
                              <span>Khách hàng (User)</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-white">
                        {u.bookingCount} đơn
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        {u.totalSpent.toLocaleString()}đ
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
