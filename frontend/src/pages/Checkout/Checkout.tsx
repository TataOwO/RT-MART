import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Checkout.module.scss';
import ItemListCard from '@/shared/components/ItemListCard';
import CheckoutSummary from '@/pages/Cart/components/CheckoutSummary';
import Button from '@/shared/components/Button';
import Dialog from '@/shared/components/Dialog';
import AddressCard from './components/AddressCard';
import AddressSelectionDialog from './components/AddressSelectionDialog';
import AddressFormDialog, { type AddressFormData } from './components/AddressFormDialog';
import PaymentMethodSelector from './components/PaymentMethodSelector';
import type { CartItem, Address } from '@/types';
import type { PaymentMethod, CreateOrderRequest } from '@/types/order';
import { getAddresses, getDefaultAddress, addAddress } from '@/shared/services/addressService';
import { createOrder } from '@/shared/services/orderService';

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  // 從購物車傳來的選取商品
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);

  // 收件地址
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // 付款方式
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  // 訂單備註
  const [orderNote, setOrderNote] = useState('');

  // 載入狀態
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog 狀態
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [showAddressFormDialog, setShowAddressFormDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [orderId, setOrderId] = useState('');

  // 計算金額
  const subtotal = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [checkoutItems]
  );

  const shipping = subtotal >= 500 ? 0 : 60;
  const discount = 0; // TODO: 優惠券功能
  const total = subtotal + shipping - discount;

  // 初始化
  useEffect(() => {
    const initCheckout = async () => {
      try {
        setIsLoading(true);

        // 1. 獲取購物車傳來的商品
        const items = location.state?.items as CartItem[] | undefined;
        if (!items || items.length === 0) {
          // 沒有商品，導回購物車
          navigate('/cart', { replace: true });
          return;
        }
        setCheckoutItems(items);

        // 2. 獲取預設地址和所有地址
        const [defaultAddr, allAddresses] = await Promise.all([
          getDefaultAddress(),
          getAddresses(),
        ]);

        if (defaultAddr) setSelectedAddress(defaultAddr);
        setAddresses(allAddresses);
      } catch (error) {
        console.error('Failed to initialize checkout:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initCheckout();
  }, [location.state, navigate]);

  // 變更地址
  const handleChangeAddress = () => {
    setShowAddressDialog(true);
  };

  // 選擇地址
  const handleSelectAddress = (addressId: string) => {
    const address = addresses.find((addr) => addr.id === addressId);
    if (address) {
      setSelectedAddress(address);
    }
  };

  // 新增地址
  const handleAddNewAddress = () => {
    setShowAddressDialog(false);
    setShowAddressFormDialog(true);
  };

  // 提交新地址
  const handleSubmitNewAddress = async (addressData: AddressFormData) => {
    try {
      const newAddress = await addAddress(addressData);
      setAddresses((prev) => [...prev, newAddress]);
      setSelectedAddress(newAddress);
    } catch (error) {
      console.error('Failed to add address:', error);
      alert('新增地址失敗');
    }
  };

  // 確認訂單
  const handleConfirmOrder = async () => {
    if (!selectedAddress) {
      alert('請選擇收件地址');
      return;
    }

    if (!paymentMethod) {
      alert('請選擇付款方式');
      return;
    }

    try {
      setIsSubmitting(true);

      const orderData: CreateOrderRequest = {
        items: checkoutItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        addressId: selectedAddress.id,
        paymentMethod: paymentMethod,
        note: orderNote,
        subtotal,
        shipping,
        discount,
        totalAmount: total,
      };

      const response = await createOrder(orderData);

      // 顯示成功 Dialog
      setOrderId(response.orderId);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Failed to create order:', error);
      alert(error instanceof Error ? error.message : '訂單建立失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 成功 Dialog 確認
  const handleSuccessConfirm = () => {
    setShowSuccessDialog(false);
    navigate('/', { replace: true });
  };

  // Loading 狀態
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div className={styles.checkoutPage}>
      <div className={styles.container}>
        {/* 左側：訂單資訊 */}
        <div className={styles.checkoutContent}>
          {/* 1. 商品清單 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>商品清單</h2>
            <div className={styles.itemList}>
              {checkoutItems.map((item) => (
                <ItemListCard
                  key={item.id}
                  variant="order-detail"
                  item={item}
                />
              ))}
            </div>
          </section>

          {/* 2. 收件地址 */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>收件地址</h2>
              <Button
                variant="outline"
                onClick={handleChangeAddress}
                className={styles.changeBtn}
              >
                變更地址
              </Button>
            </div>

            {selectedAddress ? (
              <AddressCard address={selectedAddress} isDefault={selectedAddress.isDefault} />
            ) : (
              <div className={styles.noAddress}>
                <p>尚未設定收件地址</p>
                <Button variant="primary" onClick={handleChangeAddress}>
                  新增地址
                </Button>
              </div>
            )}
          </section>

          {/* 3. 付款方式 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>付款方式</h2>
            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
          </section>

          {/* 4. 訂單備註 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>訂單備註</h2>
            <textarea
              className={styles.noteTextarea}
              placeholder="給賣家的備註（選填，最多 200 字）"
              maxLength={200}
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              rows={4}
            />
            <div className={styles.charCount}>{orderNote.length} / 200</div>
          </section>
        </div>

        {/* 右側：訂單摘要 */}
        <div className={styles.checkoutSummary}>
          <CheckoutSummary
            subtotal={subtotal}
            shipping={shipping}
            discount={discount}
            total={total}
            itemCount={checkoutItems.length}
            selectedCount={checkoutItems.length}
            freeShippingThreshold={500} // TODO: 改為從後端取得
            onCheckout={handleConfirmOrder}
            disabled={isSubmitting || !selectedAddress || !paymentMethod}
            buttonText={isSubmitting ? '處理中...' : '確認訂單'}
          />
        </div>
      </div>

      {/* 地址選擇 Dialog */}
      <AddressSelectionDialog
        isOpen={showAddressDialog}
        onClose={() => setShowAddressDialog(false)}
        addresses={addresses}
        currentAddressId={selectedAddress?.id || null}
        onSelectAddress={handleSelectAddress}
        onAddNewAddress={handleAddNewAddress}
      />

      {/* 地址表單 Dialog */}
      <AddressFormDialog
        isOpen={showAddressFormDialog}
        onClose={() => setShowAddressFormDialog(false)}
        onSubmit={handleSubmitNewAddress}
        mode="add"
      />

      {/* 訂單成功 Dialog */}
      <Dialog
        isOpen={showSuccessDialog}
        onClose={handleSuccessConfirm}
        type="alert"
        variant="info"
        icon="check-circle"
        title="訂單建立成功！"
        message={`您的訂單編號：${orderId}\n我們將盡快為您處理訂單`}
        confirmText="返回首頁"
        onConfirm={handleSuccessConfirm}
      />
    </div>
  );
}

export default Checkout;
