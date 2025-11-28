import React from "react";
import styles from "./CategoryFilter.module.scss";

export interface CategoryFilterProps {
  value: string | null;
  onChange: (categoryId: string | null) => void;
  categories: Array<{
    productTypeId: string;
    typeName: string;
    count: number;
  }>;
}

function CategoryFilter({ value, onChange, categories }: CategoryFilterProps) {
  const handleChange = (categoryId: string | null) => {
    onChange(categoryId);
  };

  // 計算總商品數
  const totalCount = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <div className={styles.categoryFilter}>
      <h3 className={styles.filterTitle}>商品分類</h3>
      <div className={styles.categoryOptions}>
        {/* "全部" 選項 */}
        <label
          htmlFor="category-all"
          className={`${styles.categoryOption} ${
            value === null ? styles.active : ""
          }`}
        >
          <input
            type="radio"
            id="category-all"
            name="category"
            value=""
            checked={value === null}
            onChange={() => handleChange(null)}
            className={styles.radioInput}
          />
          <span className={styles.optionLabel}>
            <span className={styles.text}>全部商品</span>
            {totalCount > 0 && (
              <span className={styles.count}>({totalCount})</span>
            )}
          </span>
        </label>

        {/* 各分類選項 */}
        {categories.map((category) => {
          const isChecked = value === category.productTypeId;
          const optionId = `category-${category.productTypeId}`;

          return (
            <label
              key={optionId}
              htmlFor={optionId}
              className={`${styles.categoryOption} ${
                isChecked ? styles.active : ""
              }`}
            >
              <input
                type="radio"
                id={optionId}
                name="category"
                value={category.productTypeId}
                checked={isChecked}
                onChange={() => handleChange(category.productTypeId)}
                className={styles.radioInput}
              />
              <span className={styles.optionLabel}>
                <span className={styles.text}>{category.typeName}</span>
                {category.count > 0 && (
                  <span className={styles.count}>({category.count})</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryFilter;
