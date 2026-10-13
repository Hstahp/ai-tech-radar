import { useState, useEffect } from 'react';
import { X, LayoutDashboard, Sliders, Tags, Users, ShieldAlert, ShieldCheck } from 'lucide-react';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AdminTagsTab } from './AdminTagsTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminAuditTab } from './AdminAuditTab';

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'overview' | 'settings' | 'tags' | 'users' | 'audit';

export function AdminModal({ isOpen, onClose }: AdminModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const navTabs = [
        { id: 'overview' as TabType, label: 'Tổng quan', icon: LayoutDashboard },
        { id: 'settings' as TabType, label: 'Cấu hình', icon: Sliders },
        { id: 'tags' as TabType, label: 'Quản lý Thẻ', icon: Tags },
        { id: 'users' as TabType, label: 'Người dùng', icon: Users },
        { id: 'audit' as TabType, label: 'Kiểm toán', icon: ShieldAlert },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-white tracking-tight">
                                    Bảng điều khiển Quản trị (Admin Portal)
                                </h2>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    Admin Only
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">
                                Quản lý hạn mức, cấu hình vận hành, thẻ chủ đề và nhật ký kiểm toán
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                        aria-label="Đóng"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-900/30 border-b border-slate-800/80 overflow-x-auto scrollbar-none">
                    {navTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap transition-all ${
                                    isActive
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeTab === 'overview' && <AdminOverviewTab />}
                    {activeTab === 'settings' && <AdminSettingsTab />}
                    {activeTab === 'tags' && <AdminTagsTab />}
                    {activeTab === 'users' && <AdminUsersTab />}
                    {activeTab === 'audit' && <AdminAuditTab />}
                </div>
            </div>
        </div>
    );
}
