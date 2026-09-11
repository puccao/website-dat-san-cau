import React, { useState, useEffect } from "react";
import { api } from "../../services/api.js";
import { User } from "../../types/index.js";
import {
  Users,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

type UserListItem = User & { bookingCount?: number; totalSpent?: number; createdAt?: string };

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user" as "user" | "admin",
    password: "",
  });
  const [formError, setFormError] = useState<string>("");

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

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "user",
      password: "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserListItem) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      password: "", // Leave blank if not changing
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError("Vui lòng điền họ tên và email hợp lệ");
      return;
    }

    if (!editingUser && !formData.password) {
      setFormError("Vui lòng nhập mật khẩu khởi tạo cho tài khoản mới");
      return;
    }

    try {
      setActionLoading(true);
      if (editingUser) {
        // Update user
        const res = await api.admin.updateUser(editingUser.id, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          ...(formData.password ? { password: formData.password } : {}),
        });

        if (res.success) {
          setFeedback({ text: `Đã cập nhật thông tin tài khoản ${formData.name}`, type: "success" });
          setIsModalOpen(false);
          fetchUsers();
        } else {
          setFormError(res.message || "Không thể cập nhật người dùng");
        }
      } else {
        // Create user
        const res = await api.admin.createUser({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          password: formData.password,
        });

        if (res.success) {
          setFeedback({ text: `Tạo tài khoản mới thành công cho ${formData.name}`, type: "success" });
          setIsModalOpen(false);
          fetchUsers();
        } else {
          setFormError(res.message || "Không thể tạo người dùng mới");
        }
      }
    } catch (err: any) {
      setFormError(err.message || "Đã xảy ra lỗi khi lưu thông tin");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (user: UserListItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${user.name}" (${user.email})?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.admin.deleteUser(user.id);
      if (res.success) {
        setFeedback({ text: `Đã xóa tài khoản ${user.name} khỏi hệ thống`, type: "success" });
        fetchUsers();
      } else {
        setFeedback({ text: res.message || "Lỗi xóa tài khoản", type: "error" });
      }
    } catch (err: any) {
      setFeedback({ text: err.message || "Lỗi xóa tài khoản", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = u.name.toLowerCase().includes(term);
      const matchEmail = u.email.toLowerCase().includes(term);
      const matchPhone = u.phone?.toLowerCase().includes(term);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>Quản Lý Người Dùng & Phân Quyền</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            CRUD toàn diện tài khoản hội viên, cấp quyền Quản trị viên (Admin) và theo dõi chi tiêu
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm tài khoản</span>
          </button>

          <button
            onClick={fetchUsers}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Feedback message */}
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

      {/* Filter & Search Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên (Admin)</option>
              <option value="user">Người dùng (User)</option>
            </select>
            <span className="text-xs text-slate-400 whitespace-nowrap">
              {filteredUsers.length} người
            </span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
            Đang tải dữ liệu hội viên...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Không tìm thấy người dùng nào phù hợp với bộ lọc
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Tên người dùng</th>
                  <th className="py-3.5 px-4">Liên hệ (Email / SĐT)</th>
                  <th className="py-3.5 px-4">Vai trò (Role)</th>
                  <th className="py-3.5 px-4">Số lượt đặt</th>
                  <th className="py-3.5 px-4">Tổng chi tiêu</th>
                  <th className="py-3.5 px-4">Ngày tham gia</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => {
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
                        {u.bookingCount ?? 0} đơn
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        {(u.totalSpent ?? 0).toLocaleString()}đ
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "---"}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>{editingUser ? "Chỉnh Sửa Tài Khoản" : "Tạo Tài Khoản Mới"}</span>
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

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Họ và tên *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Phân quyền vai trò</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "user" })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      formData.role === "user"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Khách hàng (User)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "admin" })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      formData.role === "admin"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Quản trị (Admin)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block flex items-center justify-between">
                  <span>Mật khẩu {editingUser ? "(Bỏ trống nếu giữ nguyên)" : "*"}</span>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? "•••••••• (Giữ nguyên mật khẩu cũ)" : "Nhập mật khẩu..."}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{editingUser ? "Lưu thay đổi" : "Tạo tài khoản"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

