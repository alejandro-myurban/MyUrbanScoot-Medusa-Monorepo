import { Heading, Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"

const EmptyCartMessage = () => {
  return (
    <div className="py-48 px-2 flex flex-col justify-center items-start" data-testid="empty-cart-message">
      <Text className="font-archivo mt-4 mb-6 sm:text-xl max-w-[32rem]">
       No tienes nada en tu carrito. <br/>¡Explora nuestros productos y añade algo especial!
      </Text>
      <div className="font-archivo">
        <InteractiveLink href="/categories/g2-pro-max">Explora algunos de nuestros vinilos personalizables!</InteractiveLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
