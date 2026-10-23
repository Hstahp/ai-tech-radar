import { useState } from "react";
import { Loader2, AlertCircle, Sparkles, Tag as TagIcon, LogIn } from "lucide-react";
import { MainLayout } from "../layouts/MainLayout";
import { FilterBar, DigestSection, useDigest } from "../features/digest";
import { useAuth, UserMenu, UserTagModal } from "../features/auth";
import { AdminModal } from "../features/admin";
import { Button } from "../components/ui/Button";

export function HomePage() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const {
    user,
    isLoading: isAuthLoading,
    isTagModalOpen,
    openTagModal,
    closeTagModal,
    loginWithGoogle,
    logout,
    deleteAccount,
    updateTags,
  } = useAuth();

  const {
    data,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedVerdict,
    setSelectedVerdict,
    filteredItems,
    totalCount,
    filteredCount,
  } = useDigest(user?.tags);

  return (
    <MainLayout
      digestDate={data?.digest_date}
      itemsCount={data?.items_count}
      rightSlot={
        <UserMenu
          user={user}
          isLoading={isAuthLoading}
          onLogin={loginWithGoogle}
          onLogout={logout}
          onDeleteAccount={deleteAccount}
          onOpenTagModal={openTagModal}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />
      }
    >
      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm text-slate-400">Đang nạp dữ liệu radar công nghệ...</p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-center max-w-lg mx-auto my-12">
          <AlertCircle className="h-8 w-8 text-rose-400 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-rose-300">Không thể tải dữ liệu</h3>
          <p className="text-xs text-rose-400/80 mt-1">{error}</p>
        </div>
      )}

      {/* Content state */}
      {!isLoading && !error && (
        <>
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedVerdict={selectedVerdict}
            onVerdictChange={setSelectedVerdict}
            totalCount={totalCount}
            filteredCount={filteredCount}
          />

          {/* Xu ly cac trang thai cua tab "Danh cho ban" */}
          {selectedCategory === "my_feed" && !user && (
            <div className="p-10 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none text-center max-w-lg mx-auto my-10 space-y-4 transition-colors">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <LogIn className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Cá nhân hóa bản tin AI của bạn</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Đăng nhập bằng tài khoản Google để chọn các chủ đề công nghệ yêu thích và lọc bản tin dành riêng cho bạn.
                </p>
              </div>
              <Button variant="primary" size="md" onClick={loginWithGoogle}>
                Đăng nhập ngay
              </Button>
            </div>
          )}

          {selectedCategory === "my_feed" && user && user.tags.length === 0 && (
            <div className="p-10 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none text-center max-w-lg mx-auto my-10 space-y-4 transition-colors">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <TagIcon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Bạn chưa chọn chủ đề quan tâm</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Hãy chọn tối đa 10 thẻ (ví dụ #agent, #devtools, #mcp...) để hệ thống tự động lọc các mục bạn muốn xem.
                </p>
              </div>
              <Button variant="primary" size="md" onClick={openTagModal}>
                Chọn chủ đề ngay
              </Button>
            </div>
          )}

          {selectedCategory === "my_feed" && user && user.tags.length > 0 && filteredItems.length === 0 && (
            <div className="p-10 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none text-center max-w-lg mx-auto my-10 space-y-4 transition-colors">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Không có mục phù hợp hôm nay</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Bản tin hôm nay chưa có bài viết nào thuộc các chủ đề bạn đã chọn. Bạn có thể mở rộng danh sách chủ đề hoặc xem mục "Tất cả".
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={openTagModal}>
                Điều chỉnh chủ đề
              </Button>
            </div>
          )}

          {(selectedCategory !== "my_feed" || (user && user.tags.length > 0 && filteredItems.length > 0)) && (
            <DigestSection items={filteredItems} />
          )}
        </>
      )}

      {user && (
        <UserTagModal
          isOpen={isTagModalOpen}
          onClose={closeTagModal}
          currentTags={user.tags}
          onSave={updateTags}
        />
      )}

      {user && user.role === "admin" && (
        <AdminModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
        />
      )}
    </MainLayout>
  );
}

