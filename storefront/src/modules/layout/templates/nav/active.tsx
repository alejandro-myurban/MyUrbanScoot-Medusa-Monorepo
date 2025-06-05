// components/ActiveNavItem.tsx
"use client"
import { usePathname } from "next/navigation"

interface ActiveNavItemProps {
  href: string
  children: React.ReactNode
  className?: string
}

export default function ActiveNavItem({
  href,
  children,
  className = "",
}: ActiveNavItemProps) {
  const pathname = usePathname()
  const isBlogActive = pathname.includes("/category/")

  return (
    <span
      className={`relative text-black/80 hover:text-white cursor-pointer transition-all duration-300 ${
        isBlogActive
          ? 'text-black after:content-[""] after:absolute font-bold  after:top-2.5 after:-z-10 after:left-0 after:w-full after:h-1.5 after:bg-mysGreen-100 after:mt-1'
          : ""
      } ${className}`}
    >
      {children}
    </span>
  )
}
