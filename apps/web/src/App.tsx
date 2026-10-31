import { Loader2, AlertCircle, Bookmark } from "lucide-react";
import { UserLayout } from "./app/layouts/UserLayout";
import { AdminLayout } from "./app/layouts/AdminLayout";
import { RequireAdmin } from "./app/guards/RequireAdmin";
import { useSimpleRouter } from "./app/router";
import { FilterBar, DigestSection, useDigest } from "./features/digest";
import { useAuth, UserMenu, UserTagModal } from "./features/auth";
import {
  AdminOverviewPage,
  AdminSettingsPage,
  AdminTagsPage,
  AdminUsersPage,
  AdminAuditPage,
} from "./features/admin";
import { ItemDetailPage } from "./pages/ItemDetailPage";
import { ChatPanel } from "./features/chat";
import { useBookmarks } from "./features/bookmarks";

export function App() {
  const { currentPath, navigate } = useSimpleRouter();

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
    bookmarkFeedItems,
    isBookmarked,
    toggleBookmark,
  } = useBookmarks(user);

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
  } = useDigest(user?.tags, bookmarkFeedItems);

  // 1. Phân luồng ROUTE ADMIN
  if (currentPath.startsWith("/admin")) {
    return (
      <>
        <RequireAdmin
          userRole={user?.role}
          isLoading={isAuthLoading}
          onNavigateHome={() => navigate("/")}
        >
          <AdminLayout currentPath={currentPath} onNavigate={(path: string) => navigate(path)}>
            {currentPath === "/admin" && <AdminOverviewPage />}
            {currentPath === "/admin/settings" && <AdminSettingsPage />}
            {currentPath === "/admin/tags" && <AdminTagsPage />}
            {currentPath === "/admin/users" && <AdminUsersPage />}
            {currentPath === "/admin/audit" && <AdminAuditPage />}
          </AdminLayout>
        </RequireAdmin>
        <ChatPanel user={user} isAuthLoading={isAuthLoading} onLogin={loginWithGoogle} />
      </>
    );
  }

  // 2. Phân luồng ROUTE ITEM DETAIL (/item/:key)
  if (currentPath.startsWith("/item/")) {
    const itemKey = decodeURIComponent(currentPath.replace("/item/", ""));

    if (isLoading) {
      return (
        <>
          <UserLayout
            onNavigateHome={() => navigate("/")}
            rightSlot={
              <UserMenu
                user={user}
                isLoading={isAuthLoading}
                onLogin={loginWithGoogle}
                onLogout={logout}
                onDeleteAccount={deleteAccount}
                onOpenTagModal={openTagModal}
                onOpenAdmin={() => navigate("/admin")}
              />
            }
          >
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
              <p className="text-sm text-slate-400">Đang nạp dữ liệu chi tiết...</p>
            </div>
          </UserLayout>
          <ChatPanel user={user} isAuthLoading={isAuthLoading} onLogin={loginWithGoogle} />
        </>
      );
    }

    // Kết hợp cả danh sách bản tin và bài đã lưu để tìm thấy bài chi tiết
    const allKnownItems = [...(data?.items || []), ...bookmarkFeedItems];

    return (
      <>
        <ItemDetailPage
          itemKey={itemKey}
          items={allKnownItems}
          user={user}
          onNavigateHome={() => navigate("/")}
          onLogin={loginWithGoogle}
          isBookmarked={isBookmarked(itemKey)}
          onToggleBookmark={toggleBookmark}
          rightSlot={
            <UserMenu
              user={user}
              isLoading={isAuthLoading}
              onLogin={loginWithGoogle}
              onLogout={logout}
              onDeleteAccount={deleteAccount}
              onOpenTagModal={openTagModal}
              onOpenAdmin={() => navigate("/admin")}
            />
          }
        />
        <ChatPanel user={user} isAuthLoading={isAuthLoading} onLogin={loginWithGoogle} />
      </>
    );
  }

  // 3. Phân luồng ROUTE TRANG CHỦ (Bản tin / Bento Grid)
  return (
    <>
      <UserLayout
        onNavigateHome={() => navigate("/")}
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
            onOpenAdmin={() => navigate("/admin")}
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
        {error && !isLoading && (
          <div className="rounded-2xl border border-rose-900/50 bg-rose-950/20 p-8 text-center my-8">
            <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white mb-2">Không thể tải bản tin</h2>
            <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">{error}</p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <div className="space-y-8">
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

            {selectedCategory === "bookmarks" && !user ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md shadow-xs dark:shadow-none">
                <div className="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-4 ring-1 ring-amber-200 dark:ring-amber-800/60 shadow-xs">
                  <Bookmark className="h-7 w-7 fill-current" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  Đăng nhập để xem danh sách đã lưu
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mb-5 leading-relaxed">
                  Các bài viết và paper bạn đánh dấu bookmark sẽ được lưu trữ an toàn theo tài khoản và xem lại mọi lúc.
                </p>
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors cursor-pointer"
                >
                  Đăng nhập bằng Google
                </button>
              </div>
            ) : (
              <DigestSection
                items={filteredItems}
                onNavigateToDetail={(key: string) => navigate(`/item/${encodeURIComponent(key)}`)}
                isBookmarked={isBookmarked}
                onToggleBookmark={toggleBookmark}
                emptyTitle={selectedCategory === "bookmarks" ? "Chưa có bài viết nào được lưu" : undefined}
                emptyDescription={
                  selectedCategory === "bookmarks"
                    ? "Bấm vào biểu tượng bookmark 🔖 trên bất kỳ tin tức hoặc paper nào để lưu lại danh sách cá nhân nhé."
                    : undefined
                }
              />
            )}
          </div>
        )}

        {/* Modal chỉnh sửa tags cá nhân */}
        <UserTagModal
          isOpen={isTagModalOpen}
          onClose={closeTagModal}
          currentTags={user?.tags || []}
          onSave={updateTags}
        />
      </UserLayout>
      <ChatPanel user={user} isAuthLoading={isAuthLoading} onLogin={loginWithGoogle} />
    </>
  );
}
