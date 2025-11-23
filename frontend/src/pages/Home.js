import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, Star, TrendingUp, Users, Package } from 'lucide-react';
import { fetchProducts } from '../store/slices/productSlice';

const Home = () => {
  const dispatch = useDispatch();
  const { products, isLoading } = useSelector((state) => state.products);

  useEffect(() => {
    // Fetch featured products for homepage
    dispatch(fetchProducts({ 
      featured: true, 
      limit: 8,
      sort: '-createdAt' 
    }));
  }, [dispatch]);

  const stats = [
    { icon: Users, label: 'Happy Customers', value: '10,000+' },
    { icon: Package, label: 'Products', value: '5,000+' },
    { icon: TrendingUp, label: 'Orders Delivered', value: '25,000+' },
    { icon: Star, label: 'Average Rating', value: '4.8' },
  ];

  const features = [
    {
      title: 'Premium Quality',
      description: 'All products are carefully selected and quality tested',
      icon: '🏆'
    },
    {
      title: 'Fast Delivery',
      description: 'Quick and reliable shipping to your doorstep',
      icon: '🚀'
    },
    {
      title: '24/7 Support',
      description: 'Round-the-clock customer service assistance',
      icon: '💬'
    },
    {
      title: 'Secure Payment',
      description: 'Safe and encrypted payment processing',
      icon: '🔒'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section - Professional Banner */}
      <section
        className="relative text-white"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1513709630908-291a1b6f0d8b?auto=format&fit=crop&w=2000&q=60')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="text-left">
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
                Handpicked products. Exceptional prices.
              </h1>
              <p className="text-lg md:text-xl text-gray-200 max-w-xl mb-8">
                Shop top brands, discover trending items and enjoy fast delivery—curated for a smarter shopping experience.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/products"
                  className="inline-flex items-center px-6 py-3 bg-emerald-400 text-emerald-900 font-semibold rounded-md shadow hover:scale-105 transform transition"
                >
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>

                <Link
                  to="/products?featured=true"
                  className="inline-flex items-center px-6 py-3 border border-white/30 text-white rounded-md hover:bg-white/10 transition"
                >
                  Featured
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-6 text-sm text-gray-300">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-emerald-300" />
                  <div>
                    <div className="text-white font-semibold">10,000+</div>
                    <div className="text-gray-300">Happy Customers</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-emerald-300" />
                  <div>
                    <div className="text-white font-semibold">25,000+</div>
                    <div className="text-gray-300">Orders Delivered</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {products.slice(0, 4).map((product) => (
                  <Link key={product._id} to={`/products/${product._id}`} className="group block rounded-lg overflow-hidden shadow-lg bg-white">
                    <div className="relative">
                      <img
                        src={product.images?.[0]?.url || '/placeholder-image.jpg'}
                        alt={product.name}
                        className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">Sale</span>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</div>
                      <div className="text-sm text-gray-500">${product.discountedPrice || product.price}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <stat.icon className="h-12 w-12 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose EcomStore?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're committed to providing you with the best shopping experience possible
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-xl text-gray-600">
              Check out our most popular and trending items
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-gray-200 animate-pulse rounded-lg h-80"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <div key={product._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                  <Link to={`/products/${product._id}`}>
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200">
                      <img
                        src={product.images?.[0]?.url || '/placeholder-image.jpg'}
                        alt={product.name}
                        className="h-48 w-full object-cover object-center hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(product.ratings?.average || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-2">
                          ({product.ratings?.count || 0})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-gray-900">
                            ${product.discountedPrice || product.price}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-sm text-gray-500 line-through ml-2">
                              ${product.originalPrice}
                            </span>
                          )}
                        </div>
                        {product.inventory?.quantity <= 10 && product.inventory?.quantity > 0 && (
                          <span className="text-xs text-orange-600 font-medium">
                            Only {product.inventory.quantity} left
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              View All Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Stay Updated
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about new products, 
            exclusive offers, and special deals.
          </p>
          <form className="max-w-md mx-auto flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-l-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-r-md font-medium transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;
