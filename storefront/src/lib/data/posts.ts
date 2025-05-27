import { sdk } from "@lib/config"

export interface StorePost {
  id: string
  author_name: string
  title: string
  slug: string
  content: string
  category_id: string | null
  category: {
    created_at: string
    deleted_at: string | null
    description: string
    id: string
    name: string
    updated_at: string
  }
  status: "draft" | "private" | "published"
  created_at: string
  updated_at: string
  published_at: string
  image: string | null // URL of the post image
  extract: string | null // Extract of the post
}

export interface StorePostComment {
  id: string
  post_id: string
  post: { id: string }
  author_name: string
  content: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}



interface CommentsReponse {
  comment: StorePostComment[]
}

interface PostsResponse {
  posts: StorePost[]
}

export async function getPosts(): Promise<StorePost[]> {
  const data = await sdk.client.fetch<PostsResponse>("/store/posts")
  return data.posts
}

export async function getPostsBySlug(slug: string): Promise<StorePost[]> {
  const data = await sdk.client.fetch<PostsResponse>(`/store/posts/${slug}`)
  console.log("Posts by slug:", data.posts)
  return data.posts
}

export async function getPostComments(id: string): Promise<StorePostComment[]> {
  // Nota: cambiamos el tipo genérico para que sea directamente un array
  const data = await sdk.client.fetch<CommentsReponse>(
    `/store/comments/${id}`,
    {
      method: "GET",
    }
  )
  return data.comment
}

export async function createPostComment(
  id: string,
  comment: StorePostComment
): Promise<StorePostComment[]> {
  const data = await sdk.client.fetch<CommentsReponse>(
    `/store/comments/${id}`,
    {
      method: "POST",
      body: {
        author_name: comment.author_name,
        content: comment.content,
      },
    }
  )
  return data.comment
}
