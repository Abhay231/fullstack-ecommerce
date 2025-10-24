import React, { useState } from 'react';

const ProductImage = ({ 
  src, 
  alt, 
  className = "w-full h-48 object-cover rounded-lg",
  fallbackColor = "bg-gray-200"
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  // Fallback image if the main image fails
  const fallbackImage = `https://via.placeholder.com/500x500/e5e7eb/6b7280?text=Product+Image`;

  if (imageError) {
    return (
      <div className={`${className} ${fallbackColor} flex items-center justify-center`}>
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm">Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} ${fallbackColor} flex items-center justify-center animate-pulse`}>
          <div className="text-gray-400">Loading...</div>
        </div>
      )}
      <img
        src={src || fallbackImage}
        alt={alt}
        className={`${className} ${isLoading ? 'hidden' : 'block'}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
};

export default ProductImage;
