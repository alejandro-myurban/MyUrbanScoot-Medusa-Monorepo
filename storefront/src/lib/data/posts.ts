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

interface PostsResponse {
  posts: StorePost[]
}

export async function getPosts(): Promise<StorePost[]> {
  const data = await sdk.client.fetch<PostsResponse>("/store/posts")
  return data.posts
}

export async function getPostsBySlug(slug: string): Promise<StorePost[]> {
  const data = await sdk.client.fetch<PostsResponse>(`/store/posts/${slug}`)
  return data.posts
}
