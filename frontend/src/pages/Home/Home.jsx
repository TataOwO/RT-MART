import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.scss';
import ProductCard from '../../shared/components/ProductCard/ProductCard';

// Mock banner data (TODO: Replace with API data)
const banners = [
  {
    id: 1,
    imageUrl:
      "https://i.pinimg.com/736x/ba/92/7f/ba927ff34cd961ce2c184d47e8ead9f6.jpg",
    alt: "促銷活動 1",
  },
  {
    id: 2,
    imageUrl:
      "https://unchainedcrypto.com/wp-content/uploads/2024/08/Untitled-design.png",
    alt: "促銷活動 2",
  },
  {
    id: 3,
    imageUrl:
      "https://uploads.dailydot.com/2018/10/olli-the-polite-cat.jpg?q=65&auto=format&w=1200&ar=2:1&fit=crop",
    alt: "促銷活動 3",
  },
];

// Mock product data (TODO: Replace with API data)
const mockProducts = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `熱門商品 ${i + 1}`,
  currentPrice: 299 + i * 50,
  originalPrice: i % 3 === 0 ? 399 + i * 50 : null,
  rating: 4 + Math.random(),
  soldCount: `${(Math.random() * 10).toFixed(1)}k`,
}));

function Home() {
  const navigate = useNavigate();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // 每 4s 切換輪播圖
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleDotClick = (index) => {
    setCurrentBannerIndex(index);
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.carouselContainer}>
          <div
            className={styles.carouselTrack}
            style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
          >
            {banners.map((banner) => (
              <div key={banner.id} className={styles.carouselSlide}>
                <img src={banner.imageUrl} alt={banner.alt} />
              </div>
            ))}
          </div>

          {/* Dot Indicators */}
          <div className={styles.carouselDots}>
            {banners.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${index === currentBannerIndex ? styles.dotActive : ''}`}
                onClick={() => handleDotClick(index)}
                aria-label={`切換到第 ${index + 1} 張輪播圖`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Hot Products Section */}
      <section className={styles.productsSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>熱門商品</h2>
          <div className={styles.productGrid}>
            {mockProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                currentPrice={product.currentPrice}
                originalPrice={product.originalPrice}
                rating={product.rating}
                soldCount={product.soldCount}
                onClick={handleProductClick}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;