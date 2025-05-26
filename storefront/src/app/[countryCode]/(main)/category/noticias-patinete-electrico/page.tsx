"use client"
import React, { useEffect, useState } from "react"
import {
  Search,
  Calendar,
  User,
  ArrowRight,
  Filter,
  Grid,
  List,
  Clock,
} from "lucide-react"
import { getPosts, StorePost } from "@lib/data/posts"
import { useParams, useRouter } from "next/navigation"
import Newsletter from "@modules/posts/components/newsletter"

const BlogPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [viewMode, setViewMode] = useState("grid")
  const [blogPosts, setBlogPosts] = useState<StorePost[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { countryCode } = useParams()

  useEffect(() => {
    async function loadPosts() {
      try {
        const posts = await getPosts()
        setBlogPosts(posts)
        console.log("fetched blogPosts:", posts)
      } catch (err: any) {
        console.error(err)
        setError(err.message)
      }
    }
    loadPosts()
  }, [])

  const navigateToPost = (post: StorePost) => {
    const postDate = new Date(post.published_at)
    const year = postDate.getFullYear()
    const month = String(postDate.getMonth() + 1).padStart(2, "0")
    const day = String(postDate.getDate()).padStart(2, "0")
    const slug = post.slug

    console.log("Navigating to post:", post)
    const url = `/${countryCode}/${year}/${month}/${day}/${slug}`
    router.push(url)
  }

  // Helper function to extract text from HTML content for excerpt
  const getExcerpt = (htmlContent: string, maxLength: number = 150): string => {
    const div = document.createElement("div")
    div.innerHTML = htmlContent
    const text = div.textContent || div.innerText || ""
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  // Helper function to get category name
  const getCategoryName = (post: StorePost): string => {
    if (
      post.category &&
      typeof post.category === "object" &&
      "name" in post.category
    ) {
      return post.category.name as string
    }
    return (post.category as string) || "Sin categoría"
  }

  // Helper function to calculate read time
  const calculateReadTime = (htmlContent: string): string => {
    const div = document.createElement("div")
    div.innerHTML = htmlContent
    const text = div.textContent || div.innerText || ""
    const wordsPerMinute = 200
    const wordCount = text.split(/\s+/).length
    const readTime = Math.ceil(wordCount / wordsPerMinute)
    return `${readTime} min`
  }

  // Get unique categories from posts
  const categories = [
    "all",
    ...Array.from(new Set(blogPosts.map((post) => getCategoryName(post)))),
  ]

  const filteredPosts = blogPosts.filter((post) => {
    const excerpt = getExcerpt(post.content || "")
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" || getCategoryName(post) === selectedCategory
    return matchesSearch && matchesCategory
  })

  // For now, we'll consider all posts as regular posts since we don't have a featured field
  // You can modify this logic based on your business rules
  const featuredPosts: StorePost[] = [] // filteredPosts.slice(0, 2) if you want to show first 2 as featured
  const regularPosts = filteredPosts

  // Default image for posts without images
  const defaultImage =
    "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Nuestro <span className="text-mysGreen-100">Blog</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Descubre los mejores consejos, tutoriales y reviews sobre
              patinetes eléctricos
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar artículos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mysGreen-100 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-mysGreen-100 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "Todas las categorías" : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${
                    viewMode === "grid"
                      ? "bg-mysGreen-100 text-white"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${
                    viewMode === "list"
                      ? "bg-mysGreen-100 text-white"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-mysGreen-100 text-white px-3 py-1 rounded-full text-sm mr-3">
                Destacados
              </span>
              Artículos principales
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <article
                  onClick={() => navigateToPost(post)}
                  key={post.id}
                  className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={defaultImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="bg-mysGreen-100 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {getCategoryName(post)}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-mysGreen-100 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {getExcerpt(post.content || "")}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {post.author_name || "MyUrbanScoot"}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(post.published_at).toLocaleDateString(
                            "es-ES"
                          )}
                        </div>
                      </div>
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        <Clock className="w-4 h-4 mr-2" />{" "}
                        {calculateReadTime(post.content || "")}
                      </span>
                    </div>
                    <button className="flex items-center text-mysGreen-100 font-medium hover:text-mysGreen-100 transition-colors">
                      Leer más
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Regular Posts */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Todos los artículos ({regularPosts.length})
          </h2>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post) => (
                <article
                  onClick={() => navigateToPost(post)}
                  key={post.id}
                  className="group cursor-pointer bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.image || defaultImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-mysGreen-100 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {getCategoryName(post)}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-mysGreen-100 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {post.extract}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {post.author_name || "MyUrbanScoot"}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(post.published_at).toLocaleDateString(
                          "es-ES"
                        )}
                      </div>
                      <span className="bg-gray-100 px-2 py-1 rounded flex items-center ">
                        <Clock className="w-4 h-4 mr-2" />
                        {calculateReadTime(post.content || "")}
                      </span>
                    </div>
                    <button className="flex items-center text-mysGreen-100 font-medium text-sm hover:text-mysGreen-100 transition-colors">
                      Leer más
                      <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {regularPosts.map((post) => (
                <article
                  key={post.id}
                  className="group cursor-pointer bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3 h-48 md:h-32 overflow-hidden">
                      <img
                        src={defaultImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="md:w-2/3 p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="bg-mysGreen-100 text-white px-2 py-1 rounded-full text-xs font-medium">
                            {getCategoryName(post)}
                          </span>
                          <span className="bg-gray-100 flex items-center px-2 py-1 rounded text-xs">
                            <Clock className="w-4 h-4 mr-2" />
                            {calculateReadTime(post.content || "")}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-mysGreen-100 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {getExcerpt(post.content || "")}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {post.author_name || "MyUrbanScoot"}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(post.published_at).toLocaleDateString(
                              "es-ES"
                            )}
                          </div>
                        </div>
                        <button className="flex items-center text-mysGreen-100 font-medium text-sm hover:text-mysGreen-100 transition-colors">
                          Leer más
                          <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron artículos
            </h3>
            <p className="text-gray-600">
              Intenta ajustar tu búsqueda o filtros
            </p>
          </div>
        )}

        {/* Newsletter Section */}
        <Newsletter />
      </main>
    </div>
  )
}

export default BlogPage
