"use client"
import React, { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Calendar, User, ArrowLeft, Clock } from "lucide-react"
import {
  createPostComment,
  getPostComments,
  getPostsBySlug,
  StorePost,
  StorePostComment,
} from "@lib/data/posts"
import Newsletter from "@modules/posts/components/newsletter"
import { sdk } from "@lib/config"
import { StoreCustomer } from "@medusajs/types"

const PostPage = () => {
  const router = useRouter()
  const { year, month, day, slug } = useParams()
  const [post, setPost] = useState<StorePost | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<StorePostComment[]>([])
  const [customer, setCustomer] = useState<StoreCustomer | null>(null)

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const { customer } = await sdk.store.customer.retrieve()
        console.log("customer", customer)
        setCustomer(customer)
      } catch (err) {
        console.error("Error retrieving customer:", err)
        setCustomer(null)
      }
    }

    fetchCustomer()
  }, [])

  useEffect(() => {
    async function loadPost() {
      if (!slug || typeof slug !== "string") return

      try {
        setLoading(true)
        const postData = await getPostsBySlug(slug as string)
        console.log("AAAAAA", postData)

        if (postData && postData.length > 0) {
          const postItem = postData[0]
          setPost(postItem)

          // Cargar comentarios inmediatamente después de obtener el post
          if (postItem.id) {
            await loadComments(postItem.id)
          }
        }
      } catch (err: any) {
        console.error("Error loading post:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [slug])

  const loadComments = async (postId: string) => {
    try {
      setCommentsLoading(true)
      console.log("Loading comments for postID:", postId)
      const commentsData = await getPostComments(postId)
      console.log("commentsData", commentsData)

      const commentsArray = commentsData || []
      setComments(commentsArray)
    } catch (err: any) {
      console.error("Error loading comments:", err)
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleAddComment = async (formData: FormData) => {
    console.log("Form data:", formData)
    if (!post?.id) return

    const author_name = formData.get("name") as string
    const content = formData.get("comment") as string

    if (!author_name.trim() || !content.trim()) {
      return
    }

    try {
      setCommentsLoading(true)
      const newComment: StorePostComment = {
        //@ts-ignore
        post: post.id,
        author_name,
        content,
      }

      // Llamar a la API para crear el comentario
      const createdComment = await createPostComment(post.id, newComment)

      // Recargar comentarios para obtener la lista actualizada
      await loadComments(post.id)

      // Limpiar el formulario
      const form = document.querySelector("form") as HTMLFormElement
      if (form) form.reset()
    } catch (err: any) {
      console.error("Error adding comment:", err)
      alert("Error al publicar el comentario. Inténtalo de nuevo.")
    } finally {
      setCommentsLoading(false)
    }
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
    return `${readTime} min lectura`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mysGreen-100 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando artículo...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Artículo no encontrado
          </h1>
          <p className="text-gray-600 mb-4">
            El artículo que buscas no existe o ha sido eliminado.
          </p>
          <button
            onClick={() => router.push("/category/noticias-patinete-electrico")}
            className="bg-mysGreen-100 text-white px-6 py-2 rounded-lg hover:bg-mysGreen-200 transition-colors"
          >
            Volver al blog
          </button>
        </div>
      </div>
    )
  }

  const defaultImage =
    "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"

  // Estilos CSS como objeto para el contenido del blog
  const blogContentStyles = {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    lineHeight: "1.6",
    color: "#374151",
  }

  return (
    <div className=" min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .blog-content h1 {
            font-size: 2.25rem;
            font-weight: 700;
            color: #111827;
            margin: 2rem 0 1rem 0;
            line-height: 1.2;
          }
          .blog-content h2 {
            font-size: 1.875rem;
            font-weight: 600;
            color: #111827;
            margin: 1.75rem 0 1rem 0;
            line-height: 1.3;
          }
          .blog-content h3 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #111827;
            margin: 1.5rem 0 0.75rem 0;
            line-height: 1.4;
          }
          .blog-content h4 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #111827;
            margin: 1.25rem 0 0.5rem 0;
          }
          .blog-content p {
            margin: 1rem 0;
            font-size: 1rem;
            line-height: 1.7;
            color: #374151;
          }
          .blog-content ol {
            margin: 1rem 0;
            padding-left: 1.5rem;
            counter-reset: list-counter;
          }
          .blog-content ol li {
            margin: 0.75rem 0;
            font-size: 1rem;
            line-height: 1.6;
            color: #374151;
            counter-increment: list-counter;
            position: relative;
            padding-left: 0.5rem;
          }
          .blog-content ol li::marker {
            font-weight: 600;
            color: #059669;
          }
          .blog-content ul {
            margin: 1rem 0;
            padding-left: 1.5rem;
          }
          .blog-content ul li {
            margin: 0.5rem 0;
            font-size: 1rem;
            line-height: 1.6;
            color: #374151;
          }
          .blog-content ul li::marker {
            color: #059669;
          }
          .blog-content strong {
            font-weight: 600;
            color: #111827;
          }
          .blog-content em {
            font-style: italic;
          }
          .blog-content a {
            color: #059669;
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: border-color 0.2s;
          }
          .blog-content a:hover {
            border-bottom-color: #059669;
          }
          .blog-content blockquote {
            border-left: 4px solid #059669;
            margin: 1.5rem 0;
            padding: 1rem 1.5rem;
            background-color: #f9fafb;
            font-style: italic;
            color: #4b5563;
          }
          .blog-content img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            margin: 1.5rem 0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .blog-content pre {
            background-color: #1f2937;
            color: #f9fafb;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1.5rem 0;
            font-size: 0.875rem;
          }
          .blog-content code {
            background-color: #f3f4f6;
            color: #374151;
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
            font-size: 0.875rem;
            font-family: 'Fira Code', Consolas, Monaco, 'Courier New', monospace;
          }
          .blog-content pre code {
            background-color: transparent;
            color: inherit;
            padding: 0;
          }
          .blog-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
          }
          .blog-content th,
          .blog-content td {
            border: 1px solid #d1d5db;
            padding: 0.75rem;
            text-align: left;
          }
          .blog-content th {
            background-color: #f9fafb;
            font-weight: 600;
            color: #111827;
          }
          .blog-content hr {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 2rem 0;
          }
        `,
        }}
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-screen-large mx-auto sm:px-6 lg:px-6 py-6">
          <button
            onClick={() => router.push("/category/noticias-patinete-electrico")}
            className="flex items-center text-mysGreen-100 hover:text-mysGreen-200 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al blog
          </button>

          <div className="mb-6">
            <span className="bg-mysGreen-100 text-white px-3 py-1 rounded-full text-sm font-medium">
              {getCategoryName(post)}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-6 text-gray-600 mb-6">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              {post.author_name || "MyUrbanScoot"}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {new Date(post.published_at).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              {calculateReadTime(post.content || "")}
            </div>
          </div>

          {post.extract && (
            <p className="text-xl text-gray-600 leading-relaxed">
              {post.extract}
            </p>
          )}
        </div>
      </header>

      {/* Featured Image */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={post.image || defaultImage}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Content */}
      <main className="max-w-screen-large mx-auto px-4 sm:px-6 lg:px-6 py-12">
        <article className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
          <div
            className="blog-content"
            style={blogContentStyles}
            dangerouslySetInnerHTML={{ __html: post.content || "" }}
          />
        </article>

        {/* Comments Section */}
        <section className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Comentarios ({comments.length})
          </h2>

          {/* Comment Form */}
          <div className="mb-8 p-6 bg-gray-50 rounded-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Deja tu comentario
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                handleAddComment(fd)
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer ? (
                  <span className="text-sm font-medium text-gray-900">
                    {customer.first_name}
                  </span>
                ) : (
                  <div className="col-span-2">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Nombre *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mysGreen-100 focus:border-transparent outline-none transition-all"
                      placeholder="Tu nombre"
                    />
                  </div>
                )}
              </div>
              <div>
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Comentario *
                </label>
                <textarea
                  name="comment"
                  id="comment"
                  rows={4}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mysGreen-100 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Escribe tu comentario aquí..."
                ></textarea>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={commentsLoading}
                  className="bg-mysGreen-100 text-white px-6 py-3 rounded-lg hover:bg-mysGreen-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {commentsLoading ? "Publicando..." : "Publicar comentario"}
                </button>
              </div>
            </form>
          </div>

          {/* Comments List */}
          {commentsLoading && comments.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mysGreen-100 mx-auto mb-2"></div>
              <p className="text-gray-600">Cargando comentarios...</p>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-6">
              {comments.map((comment, index) => (
                <div
                  key={comment.id || index}
                  className="p-6 bg-gray-50 rounded-xl shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-mysGreen-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {comment.author_name || "Anónimo"}
                      </span>
                      {comment.created_at && (
                        <p className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString(
                            "es-ES",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-t border-gray-200 pt-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sé el primero en comentar
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Comparte tu opinión sobre este artículo. Tu comentario ayudará
                  a otros lectores a conocer más sobre el tema.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Social Share & Actions */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                ¿Te gustó este artículo?
              </h3>
              <p className="text-gray-600">Compártelo con tus amigos</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Facebook
              </button>
              <button className="bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors">
                Twitter
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <Newsletter />
      </main>
    </div>
  )
}

export default PostPage
