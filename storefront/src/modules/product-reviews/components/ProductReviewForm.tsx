// "use client"

// import React from "react"
// import { useProductReviews } from "../hooks/useProductReviews"
// import { StarRating } from "./StarRating"

// interface ProductReviewFormProps {
//   productId: string
//   onSuccess?: () => void
//   className?: string
// }

// export const ProductReviewForm: React.FC<ProductReviewFormProps> = ({
//   productId,
//   onSuccess,
//   className = "",
// }) => {
//   const { submitReview, submitting, error } = useProductReviews(productId)
//   const [rating, setRating] = React.useState(0)
//   const [displayName, setDisplayName] = React.useState("")
//   const [title, setTitle] = React.useState("")
//   const [content, setContent] = React.useState("")
//   const [submitError, setSubmitError] = React.useState<string | null>(null)
//   const [submitSuccess, setSubmitSuccess] = React.useState(false)

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setSubmitError(null)

//     if (!rating) {
//       setSubmitError("Please select a rating")
//       return
//     }

//     if (!displayName.trim()) {
//       setSubmitError("Please enter your name")
//       return
//     }

//     // const success = await submitReview({
//     //   display_name: displayName,
//     //   rating,
//     //   title: title || undefined,
//     //   content: content || undefined,
//     // })

//     if (success) {
//       setRating(0)
//       setDisplayName("")
//       setTitle("")
//       setContent("")
//       setSubmitSuccess(true)

//       if (onSuccess) {
//         onSuccess()
//       }

//       // Reset success message after 3 seconds
//       setTimeout(() => {
//         setSubmitSuccess(false)
//       }, 3000)
//     }
//   }

//   return (
//     <div className={`border border-gray-200 rounded-lg p-4 ${className}`}>
//       <h3 className="text-xl font-semibold mb-4">Write a Review</h3>

//       {submitSuccess && (
//         <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
//           Your review has been submitted successfully! It will be visible after
//           approval.
//         </div>
//       )}

//       {(submitError || error) && (
//         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
//           {submitError || error?.message}
//         </div>
//       )}

//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Rating
//           </label>
//           <StarRating
//             rating={rating}
//             readOnly={false}
//             onChange={setRating}
//             className="mb-1"
//           />
//           <p className="text-xs text-gray-500">Click on the stars to rate</p>
//         </div>

//         <div>
//           <label
//             htmlFor="display_name"
//             className="block text-sm font-medium text-gray-700 mb-1"
//           >
//             Your Name *
//           </label>
//           <input
//             type="text"
//             id="display_name"
//             value={displayName}
//             onChange={(e) => setDisplayName(e.target.value)}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//             required
//           />
//         </div>

//         <div>
//           <label
//             htmlFor="review_title"
//             className="block text-sm font-medium text-gray-700 mb-1"
//           >
//             Review Title
//           </label>
//           <input
//             type="text"
//             id="review_title"
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label
//             htmlFor="review_content"
//             className="block text-sm font-medium text-gray-700 mb-1"
//           >
//             Review Content
//           </label>
//           <textarea
//             id="review_content"
//             value={content}
//             onChange={(e) => setContent(e.target.value)}
//             rows={4}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <button
//           type="submit"
//           disabled={submitting}
//           className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {submitting ? "Submitting..." : "Submit Review"}
//         </button>
//       </form>
//     </div>
//   )
// }
