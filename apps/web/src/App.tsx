import { Loader2, AlertCircle } from "lucide-react";
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

  // 1. Phân luồng ROUTE ADMIN
  if (currentPath.startsWith("/admin")) {
    return (
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
    );
  }

  // 2. Phân luồng ROUTE ITEM DETAIL (/item/:key)
  if (currentPath.startsWith("/item/")) {
    const itemKey = decodeURIComponent(currentPath.replace("/item/", ""));
    return (
      <ItemDetailPage
        itemKey={itemKey}
        items={data?.items || []}
        user={user}
        onNavigateHome={() => navigate("/")}
        onLogin={loginWithGoogle}
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
    );
  }

  // 3. Phân luồng ROUTE TRANG CHỦ (Bản tin / Bento Grid)
  return (
    <UserLayout
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

          <DigestSection
            items={filteredItems}
            onNavigateToDetail={(key: string) => navigate(`/item/${encodeURIComponent(key)}`)}
          />
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
  );
}
