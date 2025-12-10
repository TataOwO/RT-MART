import styles from "./CheckoutSummary.module.scss";
import Button from "@/shared/components/Button";
import type {
  CheckoutSummaryCartModeProps,
  CheckoutSummaryCheckoutModeProps,
} from "@/types";

type Props = CheckoutSummaryCartModeProps | CheckoutSummaryCheckoutModeProps;

function CheckoutSummary(props: Props) {
  const { onCheckout, disabled = false, buttonText = "前往結帳" } = props;

  // 結帳模式
  if (props.mode === 'checkout') {
    const { storeGroups } = props;
    const totalItems = storeGroups.reduce((sum, g) => sum + g.items.length, 0);
    const subtotalAll = storeGroups.reduce((sum, g) => sum + g.subtotal, 0);
    const totalShipping = storeGroups.reduce((sum, g) => sum + g.shipping, 0);
    const grandTotal = storeGroups.reduce((sum, g) => sum + g.total, 0);

    return (
      <div className={styles.checkoutSummary}>
        <h3>結帳資訊</h3>

        {/* 多商店訂單提示 */}
        {storeGroups.length > 1 && (
          <div className={styles.orderCount}>
            將建立 {storeGroups.length} 筆訂單
          </div>
        )}

        {/* 價格明細 */}
        <div className={styles.priceBreakdown}>
          <div className={styles.row}>
            <span>商品總金額</span>
            <span>$ {subtotalAll}</span>
          </div>
          <div className={styles.row}>
            <span>運費總金額</span>
            <span>$ {totalShipping}</span>
          </div>
          {totalShipping > 0 && (
            <div className={styles.row}>
              <span>運費折抵</span>
              <span className={styles.discount}>-$ 0</span>
            </div>
          )}
          <div className={styles.divider} />
          <div className={`${styles.row} ${styles.total}`}>
            <span>應付總額</span>
            <span className={styles.totalAmount}>$ {grandTotal}</span>
          </div>
        </div>

        {/* 商品數量 */}
        <div className={styles.selectedInfo}>
          共 {totalItems} 項商品
        </div>

        {/* 結帳按鈕 */}
        <Button
          variant="primary"
          fullWidth
          onClick={onCheckout}
          disabled={disabled}
          className={styles.checkoutBtn}
        >
          {buttonText} ({storeGroups.length} 筆訂單)
        </Button>
      </div>
    );
  }

  // 購物車模式（向後兼容）
  const {
    subtotal,
    shipping,
    discount,
    total,
    itemCount,
    selectedCount,
    freeShippingThreshold = 500,
  } = props;

  return (
    <div className={styles.checkoutSummary}>
      <h3>結帳資訊</h3>

      {/* 免運提示 */}
      {subtotal < freeShippingThreshold && (
        <div className={styles.freeShippingHint}>
          再買 $ {freeShippingThreshold - subtotal} 即可免運
        </div>
      )}

      {/* 價格明細 */}
      <div className={styles.priceBreakdown}>
        <div className={styles.row}>
          <span>商品總額</span>
          <span>$ {subtotal}</span>
        </div>
        <div className={styles.row}>
          <span>運費</span>
          <span className={shipping === 0 ? styles.free : ""}>
            {shipping === 0 ? "免運" : `$ ${shipping}`}
          </span>
        </div>
        <div className={styles.divider} />
        <div className={`${styles.row} ${styles.total}`}>
          <span>應付總額</span>
          <span className={styles.totalAmount}>$ {total}</span>
        </div>
      </div>

      {/* 選取項目數量 */}
      <div className={styles.selectedInfo}>
        已選取 {selectedCount} / {itemCount} 項商品
      </div>

      {/* 結帳按鈕 */}
      <Button
        variant="primary"
        fullWidth
        onClick={onCheckout}
        disabled={disabled}
        className={styles.checkoutBtn}
      >
        {buttonText} ({selectedCount})
      </Button>
    </div>
  );
}

export default CheckoutSummary;
