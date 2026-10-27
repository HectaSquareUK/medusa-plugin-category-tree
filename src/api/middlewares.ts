import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { ReorderCategoryBodySchema } from "./admin/category-tree/validators"

export default defineMiddlewares({
  routes: [
    {
      method: ["POST"],
      matcher: "/admin/category-tree/reorder",
      middlewares: [validateAndTransformBody(ReorderCategoryBodySchema)],
    },
  ],
})
