import React, { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../Icon/Icon";
import styles from "./HeaderB.module.scss";

function HeaderB() {
  const [language, setLanguage] = useState("zh-TW");
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setShowLanguageMenu(false);
    // TODO: Implement i18n language switching
  };

  return (
    <header className={styles.headerB}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Logo */}
          <Link to="/" className={styles.logo}>
            <img src="/RT-Mart_logo.png" alt="RT-MART" />
          </Link>

          {/* Language Toggle */}
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
    </header>
  );
}

export default HeaderB;
