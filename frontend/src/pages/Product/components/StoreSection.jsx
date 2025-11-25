import React from 'react';
import PropTypes from 'prop-types';
import styles from './StoreSection.module.scss';
import Button from '../../../shared/components/Button';
import Icon from '../../../shared/components/Icon/Icon';

function StoreSection({ store }) {
  const handleViewStore = () => {
    // TODO: 跳轉至商店頁面 /store/{store_id}
    console.log('查看商店:', store.id);
  };

  return (
    <div className={styles.storeSection}>
      <div className={styles.storeInfo}>
        {/* 商店頭像 */}
        <div className={styles.storeAvatar}>
          {store.avatar ? (
            <img src={store.avatar} alt={store.name} />
          ) : (
            <Icon icon="store" />
          )}
        </div>

        {/* 商店詳情 */}
        <div className={styles.storeDetails}>
          <h3 className={styles.storeName}>{store.name}</h3>
          <div className={styles.storeStats}>
            <span className={styles.statItem}>
              商品數: <strong>{store.productCount}</strong>
            </span>
            <span className={styles.divider}>|</span>
            <span className={styles.statItem}>
              評價: <Icon icon="star" className={styles.starIcon} /> <strong>{store.rating}</strong>
            </span>
          </div>
          <div className={styles.joinDate}>
            加入時間: {store.joinDate}
          </div>
        </div>
      </div>

      {/* 查看商店按鈕 */}
      <div className={styles.storeAction}>
        <Button variant="outline" onClick={handleViewStore} className={styles.viewStoreBtn}>
          查看商店
        </Button>
      </div>
    </div>
  );
}

StoreSection.propTypes = {
  store: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    productCount: PropTypes.number.isRequired,
    rating: PropTypes.number.isRequired,
    joinDate: PropTypes.string.isRequired,
  }).isRequired,
};

export default StoreSection;
