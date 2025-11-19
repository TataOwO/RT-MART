import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "../Button/Button";
import Icon from "../Icon/Icon";
import styles from "./HeaderA.module.scss";

function HeaderA() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [language, setLanguage] = useState("zh-TW");

  // Hide cart icon on cart and checkout pages
  const hideCartIcon = ["/cart", "/checkout"].includes(location.pathname);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchKeyword.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setShowLanguageMenu(false);
    // TODO: Implement i18n language switching
  };

  return (
    <header className={styles.headerA}>
      {/* Top Navigation Bar */}
      <div className={styles.topBar}>
        <div className={styles.container}>
          <div className={styles.topBarLinks}>
            <Link to="/seller/center" className={styles.link}>
              賣家中心
            </Link>
            <Link to="/faq" className={styles.link}>
              常見問題
            </Link>
            <div className={styles.languageMenu}>
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className={styles.languageToggle}
                aria-label="語言選擇"
              >
                <Icon icon="globe" />
                <span>{language === "zh-TW" ? "繁體中文" : "English"}</span>
                <Icon icon="chevron-down" />
              </button>
              {showLanguageMenu && (
                <div className={styles.languageDropdown}>
                  <button
                    className={`${styles.languageItem} ${language === "zh-TW" ? styles.active : ""}`}
                    onClick={() => handleLanguageChange("zh-TW")}
                  >
                    繁體中文
                  </button>
                  <button
                    className={`${styles.languageItem} ${language === "en" ? styles.active : ""}`}
                    onClick={() => handleLanguageChange("en")}
                  >
                    English
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className={styles.mainBar}>
        <div className={styles.container}>
          <div className={styles.mainBarContent}>
            {/* Logo */}
            <Link to="/" className={styles.logo}>
              <img src="/RT-Mart-favicon.png" alt="RT-MART" />
              <span>RT-MART</span>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input
                type="text"
                placeholder="搜尋商品"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className={styles.searchInput}
              />
              <button
                type="submit"
                className={styles.searchButton}
                aria-label="搜尋"
              >
                <Icon icon="search" />
              </button>
            </form>

            {/* Right Section */}
            <div className={styles.rightSection}>
              {/* Shopping Cart */}
              {!hideCartIcon && (
                <Link to="/cart" className={styles.cartButton}>
                  <Icon icon="shopping-cart" />
                  {/* TODO: Replace with actual cart count */}
                  <span className={styles.badge}>0</span>
                </Link>
              )}

              {/* User Menu */}
              {isAuthenticated ? (
                <div className={styles.userMenu}>
                  <button
                    className={styles.userButton}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    aria-label="使用者選單"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className={styles.avatar}
                      />
                    ) : (
                      <Icon icon="user" />
                    )}
                  </button>
                  {showUserMenu && (
                    <div className={styles.dropdown}>
                      <div className={styles.userInfo}>
                        <div className={styles.userInfoRow}>
                          <Icon icon="user" />
                          <span>{user?.username || user?.name}</span>
                        </div>
                        <div className={styles.userInfoRow}>
                          <Icon icon="envelope" />
                          <span>{user?.email}</span>
                        </div>
                      </div>
                      <div className={styles.divider} />
                      <Link
                        to="/user/account/profile"
                        className={styles.dropdownItem}
                        onClick={() => setShowUserMenu(false)}
                      >
                        我的帳戶
                      </Link>
                      <Link
                        to="/user/orders"
                        className={styles.dropdownItem}
                        onClick={() => setShowUserMenu(false)}
                      >
                        我的訂單
                      </Link>
                      <div className={styles.divider} />
                      <button
                        className={`${styles.dropdownItem} ${styles.logout}`}
                        onClick={handleLogout}
                      >
                        登出
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/auth">
                  <Button variant="primary">登入</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeaderA;
