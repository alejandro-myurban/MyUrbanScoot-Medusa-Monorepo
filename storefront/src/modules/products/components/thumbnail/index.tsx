import { Container, clx } from "@medusajs/ui"
import Image from "next/image"
import React from "react"

import PlaceholderImage from "@modules/common/icons/placeholder-image"

type ThumbnailProps = {
  thumbnail?: string | null
  // TODO: Fix image typings
  images?: any[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  "data-testid"?: string
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  "data-testid": dataTestid,
}) => {
  const initialImage = thumbnail || images?.[0]?.url

  return (
    <Container
      className={clx(
        "relative w-full overflow-hidden p-4 bg-ui-bg-subtle shadow-elevation-card-rest group-hover:shadow-elevation-card-hover transition-shadow ease-in-out duration-150",
        className,
        {
          // Aspect ratios ajustados para más altura
          "aspect-[4/4]": isFeatured, // Más alto que 3:2
          "aspect-[3/3]": !isFeatured && size !== "square", // Más alto que 5:3
          "aspect-[1/1]": size === "square",
          // Anchos mucho más grandes para evitar cortes
          "w-[320px]": size === "small", // Aumenté de 240px a 320px
          "w-[450px]": size === "medium", // Aumenté de 360px a 450px
          "w-[600px]": size === "large", // Aumenté de 520px a 600px
          "w-full": size === "full",
        }
      )}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder image={initialImage} size={size} />
    </Container>
  )
}

const ImageOrPlaceholder = ({
  image,
  size,
}: Pick<ThumbnailProps, "size"> & { image?: string }) => {
  return image ? (
    <Image
      src={image}
      alt="Thumbnail"
      className="absolute inset-0 object-cover object-center"
      draggable={false}
      quality={75} // Aumenté la calidad de 50 a 75
      sizes="(max-width: 576px) 380px, (max-width: 768px) 500px, (max-width: 992px) 650px, 1000px" // Ajusté para los nuevos tamaños más grandes
      fill
    />
  ) : (
    <div className="w-full h-full absolute inset-0 flex items-center justify-center">
      <PlaceholderImage size={size === "small" ? 20 : 28} />
    </div>
  )
}

export default Thumbnail