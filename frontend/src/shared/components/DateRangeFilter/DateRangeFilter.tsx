import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import Tab from '../Tab/Tab';
import type { DateRangeFilterProps } from '../../../types/common';
import styles from './DateRangeFilter.module.scss';

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  showQuickSelectors = false,
  onQuickSelect,
  activeQuickSelector,
  className,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [activeTab, setActiveTab] = useState<'quick' | 'custom'>('quick');

  // Sync tab with activeQuickSelector state
  useEffect(() => {
    if (activeQuickSelector) {
      setActiveTab('quick');
    } else if (startDate || endDate) {
      setActiveTab('custom');
    }
  }, [activeQuickSelector, startDate, endDate]);

  const handleQuickButtonClick = (period: 'day' | 'week' | 'month' | 'year') => {
    if (onQuickSelect) {
      onQuickSelect(period);
    }
  };

  const tabItems = [
    { key: 'quick', label: '快速選擇' },
    { key: 'custom', label: '自定義日期' },
  ];

  return (
    <div className={`${styles.dateRangeFilter} ${className || ''}`}>
      {showQuickSelectors && onQuickSelect ? (
        <>
          <Tab
            items={tabItems}
            activeTab={activeTab}
            onChange={(key) => setActiveTab(key as 'quick' | 'custom')}
            variant="underline"
            className={styles.tabContainer}
          />

          <div className={styles.tabContent}>
            {activeTab === 'quick' && (
              <div className={styles.quickSelectorsContent}>
                <p className={styles.description}>
                  <Icon icon="clock" />
                  選擇最近的時間範圍
                </p>
                <div className={styles.quickSelectors}>
                  <button
                    type="button"
                    className={`${styles.quickButton} ${activeQuickSelector === 'day' ? styles.active : ''}`}
                    onClick={() => handleQuickButtonClick('day')}
                  >
                    最近 1 天
                  </button>
                  <button
                    type="button"
                    className={`${styles.quickButton} ${activeQuickSelector === 'week' ? styles.active : ''}`}
                    onClick={() => handleQuickButtonClick('week')}
                  >
                    最近 7 天
                  </button>
                  <button
                    type="button"
                    className={`${styles.quickButton} ${activeQuickSelector === 'month' ? styles.active : ''}`}
                    onClick={() => handleQuickButtonClick('month')}
                  >
                    最近 30 天
                  </button>
                  <button
                    type="button"
                    className={`${styles.quickButton} ${activeQuickSelector === 'year' ? styles.active : ''}`}
                    onClick={() => handleQuickButtonClick('year')}
                  >
                    最近 365 天
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'custom' && (
              <div className={styles.customDateContent}>
                <p className={styles.description}>
                  <Icon icon="calendar" />
                  選擇任意時間範圍
                </p>
                <div className={styles.dateInputs}>
                  <div className={styles.dateField}>
                    <label htmlFor="startDate">開始日期</label>
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => onStartDateChange(e.target.value)}
                      max={endDate || today}
                      className={styles.dateInput}
                    />
                  </div>
                  <div className={styles.dateField}>
                    <label htmlFor="endDate">結束日期</label>
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      onChange={(e) => onEndDateChange(e.target.value)}
                      min={startDate}
                      max={today}
                      className={styles.dateInput}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className={styles.dateInputs}>
          <div className={styles.dateField}>
            <label htmlFor="startDate">開始日期</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              max={endDate || today}
              className={styles.dateInput}
            />
          </div>
          <div className={styles.dateField}>
            <label htmlFor="endDate">結束日期</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              min={startDate}
              max={today}
              className={styles.dateInput}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
