import { PromotionDTO, CustomerDTO, CartDTO } from "@medusajs/framework/types";
import { OrderDTO } from "@medusajs/framework/types";

export type CartData = CartDTO & {
  promotions?: PromotionDTO[];
  customer?: CustomerDTO;
  metadata: {
    loyalty_promo_id?: string;
  };
};

export type OrderData = OrderDTO & {
  promotion?: PromotionDTO[];
  customer?: CustomerDTO;
  cart?: CartData;
};

export const CUSTOMER_ID_PROMOTION_RULE_ATTRIBUTE = "customer_id";


export function getCartLoyaltyPromotion(
  cart: CartData
): PromotionDTO | undefined {
  if (!cart?.metadata?.loyalty_promo_id) {
    return;
  }

  return cart.promotions?.find(
    (promotion) => promotion.id === cart.metadata.loyalty_promo_id
  );
}

export function orderHasLoyaltyPromotion(order: OrderData): boolean {
  const loyaltyPromotion = getCartLoyaltyPromotion(
    order.cart as unknown as CartData
  );

  return (
    loyaltyPromotion?.rules?.some((rule) => {
      return (
        rule?.attribute === CUSTOMER_ID_PROMOTION_RULE_ATTRIBUTE &&
        (rule?.values?.some((value) => value.value === order.customer?.id) ||
          false)
      );
    }) || false
  );
}
