import { supabase } from "../lib/supabase"

export async function generateSitemap() {
  const siteUrl = window.location.origin

  const urls: string[] = []

  // HOME
  urls.push("/")

  // BLOG ARCHIVE
  urls.push("/blog")

  // BLOG DETAIL
  const { data: blogs } = await supabase
    .from("pages")
    .select("slug, updated_at")
    .eq("status", "published")

  blogs?.forEach(b => {
    urls.push(`/blog/${b.slug}`)
  })

  // CATEGORY
  const { data: categories } = await supabase
    .from("categories")
    .select("slug")
    .eq("is_published", true)
    .eq("is_deleted", false)

  categories?.forEach(c => {
    urls.push(`/category/${c.slug}`)
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    url => `
  <url>
    <loc>${siteUrl}${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${url === "/" ? "1.0" : "0.7"}</priority>
  </url>`
  )
  .join("")}
</urlset>`

  return xml
}
