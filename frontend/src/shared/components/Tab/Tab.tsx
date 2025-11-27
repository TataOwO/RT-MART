import { useState, useEffect } from "react";
import type { TabProps } from "@/types";
import styles from "./Tab.module.scss";

function Tab({
  items,
  activeTab,
  onChange,
  variant = "default",
  className = "",
}: TabProps) {
  const [indicatorStyle, setIndicatorStyle] = useState<{
    width: number;
    left: number;
  } | null>(null);

  // Update indicator position when activeTab changes
  useEffect(() => {
    if (variant === "underline") {
      const activeElement = document.querySelector(
        `[data-tab-key="${activeTab}"]`
      ) as HTMLElement;
      if (activeElement) {
        const { offsetWidth, offsetLeft } = activeElement;
        setIndicatorStyle({
          width: offsetWidth,
          left: offsetLeft,
        });
      }
    }
  }, [activeTab, variant]);

  const handleTabClick = (key: string) => {
    if (key !== activeTab) {
      onChange(key);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTabClick(key);
    }
  };

  return (
    <div
      className={`${styles.tabContainer} ${styles[variant]} ${className}`}
      role="tablist"
    >
      {items.map((item) => {
        const isActive = activeTab === item.key;

        return (
          <button
            key={item.key}
            data-tab-key={item.key}
            className={`${styles.tabItem} ${isActive ? styles.active : ""}`}
            onClick={() => handleTabClick(item.key)}
            onKeyDown={(e) => handleKeyDown(e, item.key)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${item.key}`}
            tabIndex={isActive ? 0 : -1}
          >
            <span className={styles.tabLabel}>{item.label}</span>
            {item.count !== undefined && (
              <span className={styles.tabCount}>({item.count})</span>
            )}
          </button>
        );
      })}

      {/* Animated indicator for underline variant */}
      {variant === "underline" && indicatorStyle && (
        <div
          className={styles.indicator}
          style={{
            width: `${indicatorStyle.width}px`,
            transform: `translateX(${indicatorStyle.left}px)`,
          }}
        />
      )}
    </div>
  );
}

export default Tab;
