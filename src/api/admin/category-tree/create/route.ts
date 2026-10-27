import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { CreateCategoryTreeBodySchema } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const parsed = CreateCategoryTreeBodySchema.safeParse(req.body)
  if (!parsed.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
    )
  }

  const {
    name,
    handle: customHandle,
    description,
    parent_category_id,
    rank,
    is_active,
    is_internal,
    sales_channels,
    image_url,
  } = parsed.data

  const productModule = req.scope.resolve(Modules.PRODUCT)

  const handle =
    customHandle?.trim() ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

  const metadata: Record<string, any> = {}
  if (Array.isArray(sales_channels) && sales_channels.length > 0) {
    metadata.sales_channels = sales_channels
  }
  if (image_url) {
    metadata.thumbnail = image_url
    metadata.image = image_url
  }

  const category = await productModule.createProductCategories({
    name,
    handle,
    description: description || undefined,
    parent_category_id: parent_category_id || null,
    rank: typeof rank === "number" ? rank : 0,
    is_active,
    is_internal,
    metadata,
  })

  res.status(201).json({
    category: {
      ...category,
      image_url: image_url || null,
      sales_channels: sales_channels || [],
    },
  })
}
