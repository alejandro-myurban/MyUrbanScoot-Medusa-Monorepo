"use client"
import { Github } from "@medusajs/icons"
import { Button, Heading } from "@medusajs/ui"
import { HeroCarousel } from "./components/carousel"
import { ProductSection } from "./components/section"

const Hero = () => {
  return (
    <div className="h-[75vh] w-full border-b border-ui-border-base relative bg-ui-bg-subtle">
      <div>
        <img src="https://myurbanscoot.com/wp-content/uploads/2025/04/VINILOS-KUKIRIN-G4-MYURBANSCOOT-2048x853.jpg" />
      </div>
      <div className="min-h-screen bg-gray-50 py-8">
          {/* <HeroCarousel /> */}
        <div className="max-w-7xl mx-auto px-4">
          <ProductSection />
        </div>
      </div>
    </div>
  )
}

export default Hero
