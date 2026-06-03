import { PackageSearch, Scissors, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getProducts } from './api';

const fallbackProducts = [
  {
    id: 1,
    name: 'Argan Hair Serum',
    category: 'Hair Care',
    description: 'Lightweight serum for shine and frizz control.',
    price: 499,
    image_url: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=900&q=80',
    stock_quantity: 18
  },
  {
    id: 2,
    name: 'Matte Styling Wax',
    category: 'Styling',
    description: 'Strong hold wax with a natural matte finish.',
    price: 349,
    image_url: 'https://images.unsplash.com/photo-1626784215021-2e39ccf971cd?auto=format&fit=crop&w=900&q=80',
    stock_quantity: 25
  },
  {
    id: 3,
    name: 'Beard Oil',
    category: 'Beard Care',
    description: 'Nourishing beard oil for softness and healthy shine.',
    price: 399,
    image_url: 'https://images.unsplash.com/photo-1621607512022-6aecc4fed814?auto=format&fit=crop&w=900&q=80',
    stock_quantity: 15
  },
  {
    id: 4,
    name: 'Charcoal Face Wash',
    category: 'Skin Care',
    description: 'Daily face wash for oil control and deep cleansing.',
    price: 299,
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80',
    stock_quantity: 30
  },
  {
    id: 5,
    name: 'Keratin Shampoo',
    category: 'Hair Care',
    description: 'Smoothing shampoo for stronger, softer hair.',
    price: 449,
    image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=80',
    stock_quantity: 22
  },
  {
    id: 6,
    name: 'Hydrating Face Cream',
    category: 'Skin Care',
    description: 'Moisturizing cream for a clean, fresh finish.',
    price: 549,
    image_url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=900&q=80',
    stock_quantity: 12
  }
];

function currency(value) {
  return Number(value).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
}

const productCartStorageKey = 'stylecut_product_cart';

function readSavedCartItems() {
  try {
    const savedCart = JSON.parse(window.localStorage.getItem(productCartStorageKey)) || {};
    return Object.fromEntries(
      Object.entries(savedCart)
        .map(([productId, quantity]) => [productId, Number(quantity)])
        .filter(([, quantity]) => Number.isFinite(quantity) && quantity > 0)
    );
  } catch {
    return {};
  }
}

function cartItemCount(items) {
  return Object.values(items).reduce((total, quantity) => total + Number(quantity || 0), 0);
}

function playCartDropSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    return;
  }

  const audioContext = new AudioContext();
  const masterGain = audioContext.createGain();
  masterGain.connect(audioContext.destination);
  masterGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  masterGain.gain.exponentialRampToValueAtTime(0.85, audioContext.currentTime + 0.01);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.55);

  const thud = audioContext.createOscillator();
  const thudGain = audioContext.createGain();
  thud.type = 'square';
  thud.frequency.setValueAtTime(170, audioContext.currentTime);
  thud.frequency.exponentialRampToValueAtTime(54, audioContext.currentTime + 0.18);
  thudGain.gain.setValueAtTime(0.55, audioContext.currentTime);
  thudGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.24);
  thud.connect(thudGain).connect(masterGain);
  thud.start(audioContext.currentTime);
  thud.stop(audioContext.currentTime + 0.26);

  [820, 1120, 1480].forEach((frequency, index) => {
    const clink = audioContext.createOscillator();
    const clinkGain = audioContext.createGain();
    const startTime = audioContext.currentTime + 0.07 + index * 0.055;

    clink.type = 'square';
    clink.frequency.setValueAtTime(frequency, startTime);
    clinkGain.gain.setValueAtTime(0.0001, startTime);
    clinkGain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.01);
    clinkGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.2);
    clink.connect(clinkGain).connect(masterGain);
    clink.start(startTime);
    clink.stop(startTime + 0.22);
  });
}

function Products() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cartItems, setCartItems] = useState(readSavedCartItems); // { productId: quantity }
  const [addedProduct, setAddedProduct] = useState(null); // { id, name, quantity }
  const [cartOpen, setCartOpen] = useState(false);
  const cartCount = useMemo(() => cartItemCount(cartItems), [cartItems]);

  const cartProducts = useMemo(() => {
    return Object.entries(cartItems).map(([productId, quantity]) => {
      const product = products.find((item) => item.id === Number(productId));
      return product ? { ...product, quantity } : null;
    }).filter(Boolean);
  }, [cartItems, products]);

  const handleOrderNow = (product) => {
    const orderItems = product
      ? [{ id: product.id, name: product.name, price: Number(product.price), quantity: cartItems[product.id] || 1 }]
      : cartProducts.map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: item.quantity
        }));

    if (!orderItems.length) {
      window.alert('Please add at least one product to order.');
      return;
    }

    const totalAmount = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);

    window.localStorage.setItem(
      'stylecut_pending_product_order',
      JSON.stringify({
        items: orderItems,
        totalAmount
      })
    );
    setCartOpen(false);
    window.location.hash = '#/product-checkout';
  };

  const handleAddToCart = (product) => {
    const nextQuantity = (cartItems[product.id] || 0) + 1;

    playCartDropSound();
    setCartItems((prevItems) => ({
      ...prevItems,
      [product.id]: (prevItems[product.id] || 0) + 1
    }));
    setAddedProduct({
      id: product.id,
      name: product.name,
      quantity: nextQuantity
    });
  };

  useEffect(() => {
    async function loadProducts() {
      try {
        setProducts(await getProducts());
      } catch {
        setProducts(fallbackProducts);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(productCartStorageKey, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (addedProduct) {
      const timer = setTimeout(() => {
        setAddedProduct(null);
      }, 3000); // Clear notification after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [addedProduct]);

  const categories = useMemo(() => {
    const productCategories = products.map((product) => product.category);
    return ['All', ...new Set(productCategories)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') {
      return products;
    }

    return products.filter((product) => product.category === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <main className="products-page">
      <aside className="products-sidebar">
        <div className="products-sidebar-top">
          <a className="brand products-brand" href="#/home" aria-label="StyleCut home">
            <span className="brand-mark">
              <Scissors size={22} />
            </span>
            <span className="brand-text">
              <strong>StyleCut</strong>
              <small>Salon Studio</small>
            </span>
          </a>
        </div>

        <div className="category-panel">
          <div className="category-title">
            <PackageSearch size={22} />
            <span>Categories</span>
          </div>

          <div className="category-list">
            {categories.map((category) => (
              <button
                className={category === selectedCategory ? 'category-button active' : 'category-button'}
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="products-content">
        <div className="products-topbar">
          <div className="products-heading">
            <p>Grooming products</p>
            <h1>{selectedCategory === 'All' ? 'All products' : selectedCategory}</h1>
            <span>{filteredProducts.length} items available</span>
          </div>

          <div className="products-actions">
            <a className="back-home products-back" href="#/home" aria-label="Go back to home">
              Back
            </a>

            <div className="cart-dropdown-wrapper">
              <button
                className="cart-indicator"
                type="button"
                aria-label="Open cart dropdown"
                aria-expanded={cartOpen}
                onClick={() => setCartOpen((currentOpen) => !currentOpen)}
              >
                <ShoppingBag size={22} />
                <span>{cartCount}</span>
              </button>

              {cartOpen && (
                <div className="cart-dropdown">
                  <div className="cart-dropdown-header">
                    <strong>Cart items</strong>
                    <span>{cartCount} item{cartCount === 1 ? '' : 's'}</span>
                  </div>

                  {cartProducts.length > 0 ? (
                    <>
                      <ul className="cart-dropdown-list">
                        {cartProducts.map((product) => (
                          <li className="cart-dropdown-item" key={product.id}>
                            <div>
                              <strong>{product.name}</strong>
                              <small>{product.category}</small>
                            </div>
                            <span>{product.quantity}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="cart-dropdown-footer">
                        <button
                          className="order-now-button"
                          type="button"
                          onClick={() => handleOrderNow()}
                        >
                          Order Now
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="cart-dropdown-empty">No items added yet.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="products-grid">
          {filteredProducts.map((product) => (
            <article className="product-shop-card" key={product.id}>
              <img src={product.image_url} alt={product.name} />

              <div className="product-shop-body">
                <span className="product-category">{product.category}</span>
                <h2>{product.name}</h2>
                <p>{product.description}</p>

                <div className="product-shop-footer">
                  <strong>{currency(product.price)}</strong>
                  <span>{product.stock_quantity > 0 ? 'In stock' : 'Out of stock'}</span>
                </div>

                {cartItems[product.id] ? (
                  <>
                    <div className="quantity-controls">
                      <span className="added-label">Added</span>
                      <button
                        className="quantity-btn quantity-btn-minus"
                        type="button"
                        onClick={() => {
                          const newQuantity = cartItems[product.id] - 1;
                          if (newQuantity === 0) {
                            setCartItems((prevItems) => {
                              const updated = { ...prevItems };
                              delete updated[product.id];
                              return updated;
                            });
                          } else {
                            setCartItems((prevItems) => ({
                              ...prevItems,
                              [product.id]: newQuantity
                            }));
                          }
                        }}
                      >
                        <Minus size={18} />
                      </button>
                      <button className="quantity-badge" type="button" disabled>
                        {cartItems[product.id]}
                      </button>
                      <button
                        className="quantity-btn quantity-btn-plus"
                        type="button"
                        onClick={() => handleAddToCart(product)}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <button
                      className="order-now-button"
                      type="button"
                      onClick={() => handleOrderNow(product)}
                    >
                      Order Now
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="add-product-button"
                      type="button"
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingBag size={18} />
                      Add to Cart
                    </button>
                    <button
                      className="order-now-button"
                      type="button"
                      onClick={() => handleOrderNow(product)}
                    >
                      Order Now
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>

        {addedProduct && (
          <div className="add-notification">
            <p>✓ <strong>{addedProduct.name}</strong> added to cart (Qty: {addedProduct.quantity})</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default Products;
