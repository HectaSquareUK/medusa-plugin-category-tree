# @hectasquare/medusa-plugin-category-tree

An enterprise-grade, **AAA interactive Category Tree, Mind Map & Category Detail Hub** plugin for **Medusa v2 Admin**.

[![npm version](https://img.shields.io/npm/v/@hectasquare/medusa-plugin-category-tree.svg)](https://www.npmjs.com/package/@hectasquare/medusa-plugin-category-tree)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717.svg?logo=github)](https://github.com/HectaSquareUK/medusa-plugin-category-tree)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Medusa v2 Ready](https://img.shields.io/badge/Medusa-v2.x-green.svg)](https://medusajs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

Inspired by modern visual and canvas tools like **Figma, Miro, Linear, and NotebookLM**, this plugin transforms Medusa's standard nested category list into a fluid, 60fps pan/zoom node canvas with branch-specific harmonic color coding, left-edge tier level indicators, sibling superscript rankings, and an all-in-one **Category Detail Hub** with product ranking and commercial top seller management.

---

## 🌟 Why This Plugin?

In high-volume e-commerce stores with hundreds or thousands of categories across multiple sales channels and brands:
- Standard nested tables and indent lists quickly become unwieldy, difficult to scan, and prone to navigation fatigue.
- Re-parenting or reordering categories through repeated modal dropdowns is slow, error-prone, and provides no immediate visual feedback.
- Managing products, rankings, and commercial visibility required constantly hopping back and forth between administrative screens.

**With this plugin:**
- **Zero backend contamination:** Lives entirely inside an external npm plugin (`@hectasquare/medusa-plugin-category-tree`). Your backend core remains pristine.
- **Bird’s-eye hierarchy visualization:** Instant visual comprehension of your entire category taxonomy with orthogonal connections (`smoothstep`) and branch-specific harmonic colors.
- **Hierarchical Centered Layout:** Clean Buchheim/Walker-style tree geometry centering parents directly over children without cross-canvas wire tangle.
- **Interactive drag-and-drop reparenting:** Connect and restructure categories directly on the canvas with real-time topological cycle protection.
- **Category Detail Hub:** Complete 4-tab slide-over hub replacing the need to visit legacy pages—edit metadata, manage products, rank items, and configure storefronts in one place.
- **Product Ranking & Top Commercial Sellers:** Reorder sibling products directly with interactive controls and star items with `⭐ Top Seller` status reflected in storefronts.
- **Multi-storefront filtering:** Seamlessly filter the entire tree by Sales Channel (`All Storefronts`, `Monfil`, `Superpunch`, etc.).
- **Atomic batch updates:** Stage moves visually on canvas and commit them in a single transactional request with automatic rollback.

---

## 🚀 Key Features

### 🗂️ All-in-One Category Detail Hub
Clicking the edit pencil icon on any node opens a wide slide-over hub featuring 4 dedicated workspaces:
1. **General & Ranking:**
   - Title, Handle, Description, and Active / Internal toggles.
   - Sibling category rank ordering (`↑ Earlier`, `↓ Later`, `Top (#0)`).
   - Direct `↗ Open Full Page` link opening `/app/categories/:id` in a separate tab when desired.
2. **Products Management:**
   - Full product listing with thumbnail, title, collection, variant count, and status badges.
   - **Sibling Product Ranking:** Dynamic rank numbering (`#1`, `#2`, `#3`...) with interactive `▲` Move Up and `▼` Move Down buttons.
   - **⭐ Top Commercial Seller:** One-click toggle marking priority commercial showcase products.
   - **Remove Products:** Individual removal or multi-select bulk remove.
   - **Full-Screen FocusModal:** Direct parity with Medusa's legacy Add Products modal with full-width table, search (`Q Search`), pagination, and batch assignment.
3. **Storefronts & Media:**
   - Multi-sales channel visibility checkboxes (`Monfil Store`, `Superpunch`, etc.).
   - Category thumbnail and image URL editor with live preview.
4. **YouTube Videos:**
   - Multi-video demonstration manager with real-time thumbnail preview cards and quick remove actions.

---

### 🎨 Branch-Specific Harmonic Color Coding
- Every major branch receives a distinct harmonic color (Emerald, Indigo, Amber, Rose, Cyan, Violet, Pink, Lime, Sky, Orange) assigned deterministically from its top-level root ancestor.
- Vertical left-edge tier indicator bars and connecting orthogonal edge lines inherit the branch color, making complex multi-level trees effortless to scan visually.

---

### 🌳 Dual-Mode Visual Layout Engine
- **Vertical Tree (Top-to-Bottom):** Clustered hierarchical layout centering parents cleanly over children.
- **Horizontal Mind Map (Left-to-Right):** Lateral branching layout (Linear/Miro style) ideal for wide root catalogs.
- Recalculates dynamically with sub-millisecond responsiveness.

---

### ⛶ Box / Marquee Multi-Selection
- Click and drag anywhere on the canvas to marquee-select multiple nodes at once (`⛶ Box Select`).
- Move entire subtrees or selected clusters in unison.

---

### 🏷️ Left-Edge Tier Level Indicators & Superscript Ranks
- **Tier 1 (Root):** Single vertical bar in branch accent.
- **Tier 2 (Sub):** Dual vertical bars with high-contrast spacing.
- **Tier 3 (Sub-Sub):** Triple vertical bars.
- **Sibling Superscripts:** Numbers (`¹`, `²`, `³`, `⁴`, `ⁿ`) representing the category's display rank among siblings.

---

### 📂 NotebookLM-Style Subtree Collapse
- Expand or collapse individual subtrees with a single click.
- Collapsed nodes show an indicator badge (e.g., `[ ▸ 4 sub ]`).
- Quick actions in the floating dock to expand or collapse all nodes or selective subtrees.

---

### 🛡️ Topological Cycle Protection
- Real-time client-side and server-side cycle detection.
- Completely prevents accidental self-parenting (`A -> A`) or cyclic loops (`A -> B -> C -> A`).

---

## 📦 Installation

Install the package in your Medusa backend project:

```bash
npm install @hectasquare/medusa-plugin-category-tree
# or
pnpm add @hectasquare/medusa-plugin-category-tree
# or
yarn add @hectasquare/medusa-plugin-category-tree
```

---

## ⚙️ Configuration

Register the plugin in your backend's `medusa-config.js` (or `medusa-config.ts`):

```javascript
module.exports = defineConfig({
  plugins: [
    {
      resolve: "@hectasquare/medusa-plugin-category-tree",
      options: {},
    },
  ],
})
```

When you start your Medusa backend (`npx medusa develop` or `pnpm dev`), the plugin automatically injects:
1. **Admin UI Page & Sidebar Item:** Registered under `/app/category-tree` with a folder tree icon.
2. **Backend API Endpoints:** Under `/admin/category-tree` supporting atomic reorders, rank shifts, and category creations.

---

## 🛒 Storefront Integration (Product Ranking & Top Sellers)

The plugin persists category-scoped ranking and top seller configuration into `category.metadata`:
- `category.metadata.ordered_product_ids: string[]`
- `category.metadata.product_ranks: Record<string, number>`
- `category.metadata.top_sellers: string[]`

### Storefront 2 Priority Showcase Example
In your storefront API or data layer (e.g. Next.js App Router):

```typescript
// Inspect category metadata for top commercial sellers
const topSellerIds = category.metadata?.top_sellers || []

if (topSellerIds.length > 0) {
  // Fetch top seller products and place them first in designated order
  const { products: topProducts } = await getProductsList({
    queryParams: { id: topSellerIds },
  })
  topProducts.sort((a, b) => topSellerIds.indexOf(a.id) - topSellerIds.indexOf(b.id))
  
  // Fill remaining slots from the general category pool without duplicates
  return [...topProducts, ...otherCategoryProducts]
}
```

---

## 🏗️ Architecture & Project Structure

```text
medusa-plugin-category-tree/
├── src/
│   ├── admin/
│   │   ├── index.tsx                         # Medusa Admin SDK registration
│   │   ├── routes/category-tree/             # Route /app/category-tree
│   │   └── components/category-tree/
│   │       ├── category-tree-canvas.tsx      # Interactive canvas & marquee selection
│   │       ├── category-node.tsx             # Node card with tier bars & ranks
│   │       ├── custom-edge.tsx               # Orthogonal edge matching branch color
│   │       ├── canvas-dock.tsx               # Floating glassmorphic dock
│   │       ├── tier-bars.tsx                 # Branch-colored tier bars
│   │       ├── edit-category-drawer.tsx      # 4-tab Category Detail Hub
│   │       ├── category-products-manager.tsx # Products table, ranking & FocusModal
│   │       ├── create-category-drawer.tsx    # Slide-over subcategory creator
│   │       └── lib/
│   │           ├── layout-engine.ts          # Buchheim/Walker centered tree engine
│   │           └── tree-state.ts             # Palette, tiers, ranks, & cycle checks
│   ├── api/admin/category-tree/              # Server route handlers
│   └── workflows/                            # Atomic reorder workflows
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🛠️ Development & Building

To build the plugin for distribution:

```bash
# In the plugin directory
pnpm build
# or
npm run build
```

This compiles TypeScript definitions and JavaScript bundles into `.medusa/server/`.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to open an issue or pull request on our repository.

---

## 📄 License

Apache License 2.0 © [HectaSquare Team](https://github.com/HectaSquareUK)
