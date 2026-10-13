import { useState, useEffect } from 'react';
import { Search, Loader2, ShieldCheck, User as UserIcon, Lock, Unlock, RefreshCw } from 'lucide-react';
import { fetchAdminUsers, updateAdminUser, type AdminUserItem } from '../api/admin-client';

export function AdminUsersTab() {
    const [users, setUsers] = useState<AdminUserItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAdminUsers(search);
            setUsers(data);
        } catch {
            // handle error gracefully
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleToggleRole = async (user: AdminUserItem) => {
        const nextRole = user.role === 'admin' ? 'user' : 'admin';
        try {
            await updateAdminUser(user.id, { role: nextRole });
            setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)));
        } catch {
            alert('Cập nhật vai trò người dùng thất bại.');
        }
    };

    const handleToggleStatus = async (user: AdminUserItem) => {
        const nextStatus = user.status === 'active' ? 'suspended' : 'active';
        try {
            await updateAdminUser(user.id, { status: nextStatus });
            setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)));
        } catch {
            alert('Cập nhật trạng thái người dùng thất bại.');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-800">
                <div>
                    <h3 className="text-sm font-semibold text-white">Quản trị người dùng &amp; Hạn mức</h3>
                    <p className="text-xs text-slate-400">
                        Xem danh sách, phân quyền và kiểm soát trạng thái tài khoản
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            placeholder="Tìm theo email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={loadUsers}
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Làm mới"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
                    <p className="text-sm">Đang tải danh sách người dùng...</p>
                </div>
            ) : users.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-slate-800 rounded-2xl bg-slate-900/30">
                    <UserIcon className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs">Không tìm thấy người dùng nào phù hợp.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/30">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="p-3 font-semibold">Thành viên</th>
                                <th className="p-3 font-semibold">Vai trò</th>
                                <th className="p-3 font-semibold">Trạng thái</th>
                                <th className="p-3 font-semibold">Dùng hôm nay</th>
                                <th className="p-3 font-semibold text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-3">
                                        <div className="flex items-center gap-2.5">
                                            {user.avatarUrl ? (
                                                <img
                                                    src={user.avatarUrl}
                                                    alt={user.displayName ?? user.email}
                                                    className="h-7 w-7 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="h-7 w-7 rounded-lg bg-indigo-600/20 text-indigo-300 flex items-center justify-center font-bold">
                                                    {user.displayName?.[0]?.toUpperCase() ??
                                                        user.email[0].toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-white">
                                                    {user.displayName ?? 'Người dùng'}
                                                </div>
                                                <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                user.role === 'admin'
                                                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                            }`}
                                        >
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                user.status === 'active'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                            }`}
                                        >
                                            {user.status === 'active' ? 'Hoạt động' : 'Đình chỉ'}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="text-[11px] text-slate-300">
                                            <span>Chat: {user.dailyChatRequests}</span>
                                            <span className="text-slate-600 mx-1.5">•</span>
                                            <span>Explain: {user.dailyExplainRequests}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleRole(user)}
                                                className={`p-1.5 rounded-lg border text-[11px] transition-colors ${
                                                    user.role === 'admin'
                                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                                                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                                }`}
                                                title={user.role === 'admin' ? 'Hạ xuống User' : 'Nâng lên Admin'}
                                            >
                                                <ShieldCheck className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(user)}
                                                className={`p-1.5 rounded-lg border text-[11px] transition-colors ${
                                                    user.status === 'active'
                                                        ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-rose-400'
                                                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                                                }`}
                                                title={
                                                    user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'
                                                }
                                            >
                                                {user.status === 'active' ? (
                                                    <Lock className="h-3.5 w-3.5" />
                                                ) : (
                                                    <Unlock className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
