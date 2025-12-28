import { useEffect } from "react"
import { generateSitemap } from "./Sitemap"

export default function SitemapPage() {
  useEffect(() => {
    async function run() {
      const xml = await generateSitemap()

      const blob = new Blob([xml], { type: "application/xml" })
      const url = URL.createObjectURL(blob)

      window.location.href = url
    }

    run()
  }, [])

  return null
}
