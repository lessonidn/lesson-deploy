import { Link } from 'react-router-dom'

// Definisikan tipe Category
type Category = {
  id: string
  name: string
  slug: string
}

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      to={`/category/${category.slug}`}
      className="border rounded-xl p-6 bg-white hover:shadow-lg transition"
    >
      <h2 className="text-xl font-semibold">{category.name}</h2>
    </Link>
  )
}