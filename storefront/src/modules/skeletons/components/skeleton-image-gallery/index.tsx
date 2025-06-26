const ImageGallerySkeleton: React.FC = () => {
  return (
    <div className="animate-pulse">
      {/* Imagen principal */}
      <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>

      {/* Thumbnails */}
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-16 h-16 bg-gray-200 rounded-md"></div>
        ))}
      </div>
    </div>
  )
}

export default ImageGallerySkeleton
