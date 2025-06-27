interface PopularBadgeProps {
  text?: string
  className?: string
}

const PopularBadge = ({ text = "Popular", className = "" }: PopularBadgeProps) => {
  return (
    <div 
      className={`
        absolute top-12 right-1 sm:top-2 sm:right-2 z-10
        bg-green-600 text-white text-xs font-medium
        px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-sm
        flex items-center gap-1
        shadow-sm
        ${className}
      `}
    >
      <span>⭐</span>
      <span>{text}</span>
    </div>
  )
}

export default PopularBadge