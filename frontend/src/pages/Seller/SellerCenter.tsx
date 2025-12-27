import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import SellerSidebar from "./components/SellerSidebar";
import Button from "@/shared/components/Button";
import styles from "./SellerCenter.module.scss";

/**
 * Seller Center Layout - 賣家中心主布局
 * 左側導航欄 + 右側主內容區
 * 包含權限檢查邏輯
 */
function SellerCenter() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // 管理員無權訪問賣家中心
  if (user?.role === "admin") {
    return (
      <div className={styles.accessDenied}>
        <h2>無權訪問</h2>
        <p>管理員帳號無法訪問賣家中心。</p>
        <Button onClick={() => navigate("/")}>返回首頁</Button>
      </div>
    );
  }

  return (
    <div className={styles.sellerCenter}>
      {/* 左側導航欄 */}
      <SellerSidebar activeRoute={location.pathname} />

      {/* 右側主內容區 */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}

export default SellerCenter;
