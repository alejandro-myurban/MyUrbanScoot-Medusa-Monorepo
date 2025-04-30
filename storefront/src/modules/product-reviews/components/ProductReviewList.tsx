// "use client"

// import React from "react"
// import { useProductReviews } from "../hooks/useProductReviews"
// import { StarRating } from "./StarRating"
// import { RatingDistribution } from "./RatingDistribution"
// import { format } from "date-fns"

// interface ProductReviewsListProps {
//   productId: string
//   className?: string
// }

// export const ProductReviewsList: React.FC<ProductReviewsListProps> = ({
//   productId,
//   className = "",
// }) => {
//   const {
//     reviews,
//     loading,
//     statsLoading,
//     error,
//     averageRating,
//     totalReviews,
//     ratingsDistribution,
//   } = useProductReviews(productId)

//   if (loading || statsLoading) {
//     return <div className="text-center py-4">Loading reviews...</div>
//   }

//   if (error) {
//     return (
//       <div className="text-red-500 text-center py-4">
//         Error loading reviews: {error.message}
//       </div>
//     )
//   }

//   return (
//     <div className={`space-y-6 ${className}`}>
//       <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
//         <div>
//           <h3 className="text-xl font-semibold mb-2">Customer Reviews</h3>
//           {averageRating !== null && (
//             <div className="flex items-center gap-2">
//               <StarRating rating={averageRating} />
//               <span className="text-sm text-gray-600">
//                 {averageRating.toFixed(1)} out of 5 ({totalReviews}{" "}
//                 {totalReviews === 1 ? "review" : "reviews"})
//               </span>
//             </div>
//           )}
//         </div>

//         {Object.keys(ratingsDistribution).length > 0 && (
//           <div className="w-full md:w-64">
//             <RatingDistribution
//               ratingsCount={ratingsDistribution}
//               totalReviews={totalReviews}
//             />
//           </div>
//         )}
//       </div>

//       {reviews?.length === 0 ? (
//         <div className="text-center py-4 bg-gray-50 rounded-lg">
//           No reviews yet. Be the first to review this product!
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {reviews?.map((review) => (
//             <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
//               <div className="flex justify-between items-start mb-2">
//                 <div>
//                   <p className="font-medium">{review.display_name}</p>
//                   <p className="text-xs text-gray-500">
//                     {format(new Date(review.created_at), "MMM d, yyyy")}
//                   </p>
//                 </div>
//                 <StarRating rating={review.rating} size={16} />
//               </div>

//               {review.title && (
//                 <p className="font-medium mb-1">{review.title}</p>
//               )}

//               {review.content && (
//                 <p className="text-gray-700 text-sm">{review.content}</p>
//               )}

//               {(review as any).response && (
//                 <div className="mt-3 pl-4 border-l-2 border-gray-300">
//                   <p className="text-xs font-medium text-gray-700 mb-1">
//                     Response from seller:
//                   </p>
//                   <p className="text-sm text-gray-600">
//                     {(review as any).response.content}
//                   </p>
//                   <p className="text-xs text-gray-500 mt-1">
//                     {format(
//                       new Date((review as any).response.created_at),
//                       "MMM d, yyyy"
//                     )}
//                   </p>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }
