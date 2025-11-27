import React from 'react';
import Select from '@/shared/components/Select';
import Button from '@/shared/components/Button';
import PriceRangeFilter from '../PriceRangeFilter';
import RatingFilter from '../RatingFilter';
import type { SelectOption } from '@/types';
import styles from './FilterSidebar.module.scss';
import Icon from '@/shared/components/Icon';

export interface FilterSidebarProps {
  // 價格篩選
  minPrice: number | null;
  maxPrice: number | null;
  onPriceChange: (min: number | null, max: number | null) => void;

  // 評價篩選
  rating: number | null;
  onRatingChange: (rating: number | null) => void;

  // 排序
  sortBy: string;
  onSortChange: (sortBy: string) => void;

  // 重置
  onReset: () => void;
}

const SORT_OPTIONS: SelectOption[] = [
  { value: 'relevance', label: '相關度' },
  { value: 'price-asc', label: '價格：低到高' },
  { value: 'price-desc', label: '價格：高到低' },
  { value: 'createdAt-desc', label: '最新上架' },
  { value: 'soldCount-desc', label: '銷量最高' },
];

function FilterSidebar({
  minPrice,
  maxPrice,
  onPriceChange,
  rating,
  onRatingChange,
  sortBy,
  onSortChange,
  onReset,
}: FilterSidebarProps) {
  return (
    <div className={styles.filterSidebar}>
      {/* 排序選項 */}
      <div className={styles.filterSection}>
        <h3 className={styles.filterTitle}>排序方式</h3>
        <Select
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={onSortChange}
          placeholder="選擇排序"
          ariaLabel="選擇排序方式"
        />
      </div>

      {/* 價格範圍篩選 */}
      <div className={styles.filterSection}>
        <PriceRangeFilter
          minPrice={minPrice}
          maxPrice={maxPrice}
          onChange={onPriceChange}
        />
      </div>

      {/* 評價篩選 */}
      <div className={styles.filterSection}>
        <RatingFilter value={rating} onChange={onRatingChange} />
      </div>

      {/* 重置按鈕 */}
      <Button
        variant="outline"
        onClick={onReset}
        className={styles.resetButton}
      >
        <Icon icon="arrow-rotate-right" size='sm'/>
        重置篩選
      </Button>
    </div>
  );
}

export default FilterSidebar;
