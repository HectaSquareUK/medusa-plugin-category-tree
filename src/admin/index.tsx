import CategoryTreePage, { config } from "./routes/category-tree/page"

const routeModule = {
  routes: [
    {
      Component: CategoryTreePage,
      path: "/category-tree",
    },
  ],
}

const menuItemModule = {
  menuItems: [
    {
      label: config?.label || "Category Tree",
      icon: config?.icon,
      path: "/category-tree",
    },
  ],
}

const widgetModule = { widgets: [] }
const formModule = { customFields: {} }
const displayModule = { displays: {} }
const i18nModule = { resources: {} }

const plugin = {
  widgetModule,
  routeModule,
  menuItemModule,
  formModule,
  displayModule,
  i18nModule,
}

export default plugin
