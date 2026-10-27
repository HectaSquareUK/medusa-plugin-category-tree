import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Folder } from "@medusajs/icons"
import { TooltipProvider } from "@medusajs/ui"
import { CategoryTreeCanvas } from "../../components/category-tree/category-tree-canvas"

const CategoryTreePage = () => {
  return (
    <TooltipProvider>
      <CategoryTreeCanvas />
    </TooltipProvider>
  )
}

export const config = defineRouteConfig({
  label: "Category Tree",
  icon: Folder,
})

export default CategoryTreePage
