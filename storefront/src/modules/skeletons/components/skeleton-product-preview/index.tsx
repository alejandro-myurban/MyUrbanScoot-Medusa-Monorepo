import { Container } from "@medusajs/ui"

const SkeletonProductPreview = () => {
  return (
    <div className="animate-pulse">
      <Container
        className="relative w-full overflow-hidden p-4 bg-ui-bg-subtle shadow-elevation-card-rest rounded-large aspect-[4/4]"
      />
      <div className="flex justify-between text-base-regular mt-2">
        <div className="w-4/5 h-6 bg-gray-100 rounded" />
        <div className="w-2/5 h-6 bg-gray-100 rounded" />
      </div>
    </div>
  )
}

export default SkeletonProductPreview
