import Medusa from "@medusajs/js-sdk"

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return (window as any).__BACKEND_URL__ || window.location.origin
  }
  return process.env.BACKEND_URL || "http://localhost:9000"
}

export const sdk = new Medusa({
  baseUrl: getBaseUrl(),
  auth: {
    type: "session",
  },
})
