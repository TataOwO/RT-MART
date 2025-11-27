import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import styles from "./Home.module.scss";
import ProductCard from "@/shared/components/ProductCard/ProductCard";
import Hero from "./components/Hero/Hero";
import { getProducts } from "@/shared/services/productService";
import type { Product } from "@/types";

interface Banner {
  id: number;
  imageUrl: string;
  alt: string;
  link?: string;
}

// Mock banner data (TODO: Replace with API data)
const banners: Banner[] = [
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

function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await getProducts({ limit: 20 });
        setProducts(response.products);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleProductClick = (productId: string | number) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <Hero banners={banners} autoPlayInterval={4000} height={400} />

      {/* Hot Products Section */}
      <section className={styles.productsSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>熱門商品</h2>
          {isLoading ? (
            <div className={styles.loading}>載入中...</div>
          ) : (
            <div className={styles.productGrid}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  currentPrice={product.currentPrice}
                  originalPrice={product.originalPrice}
                  image={product.images[0]}
                  rating={product.rating}
                  soldCount={product.soldCount}
                  onClick={handleProductClick}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;
