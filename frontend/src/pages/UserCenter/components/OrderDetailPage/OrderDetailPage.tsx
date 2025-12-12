import { useParams, useNavigate } from 'react-router-dom';
import Button from '@/shared/components/Button';
import styles from './OrderDetailPage.module.scss';

/**
 * 訂單詳情頁面
 */
function OrderDetailPage() {
  const { order_id } = useParams<{ order_id: string }>();
  const navigate = useNavigate();

  return (
    <div className={styles.orderDetailPage}>
      <Button
        variant="ghost"
        icon="arrow-left"
        onClick={() => navigate('/user/orders')}
        className={styles.backButton}
      >
        返回訂單列表
      </Button>

      <h1>訂單詳情</h1>
      <p>訂單編號：{order_id}</p>
      <p>訂單詳情頁開發中...</p>
    </div>
  );
}

export default OrderDetailPage;
