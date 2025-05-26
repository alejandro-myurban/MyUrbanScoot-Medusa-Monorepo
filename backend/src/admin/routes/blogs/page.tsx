import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Label,
  Select,
  FocusModal,
  Heading,
  toast,
} from "@medusajs/ui";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { PencilSquare } from "@medusajs/icons";
import { useQuery } from "@tanstack/react-query";
import { sdk } from "../../lib/sdk";
import RichTextEditor from "../../components/rich-text-editor";

export const config = defineRouteConfig({
  label: "Blog",
  icon: PencilSquare,
});

export interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author_name: string;
  category_id?: string;
  status: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  extract?: string;
  image?: string; // URL de la imagen del post
}

const BlogPage = () => {
  // Estados para los modales
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // Estados para el formulario de categoría
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  // Estados para el formulario de post
  const [userName, setUserName] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postSlug, setPostSlug] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postCategory, setPostCategory] = useState("none");
  const [postStatus, setPostStatus] = useState("draft");
  const [postImage, setPostImage] = useState<string | File>("");
  const [postExtract, setPostExtract] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishedDate, setPublishedDate] = useState(() => {
    // default to today in YYYY-MM-DD format
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Estados para edición
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Query para obtener categorías
  const { data: categories, refetch: refetchCategories } = useQuery({
    queryFn: async () => {
      const result: CategoriesResponse = await sdk.client.fetch(
        "/admin/blog-category",
        {
          method: "GET",
        }
      );
      console.log("EL FETCH", result);
      return result.categories || [];
    },
    queryKey: ["blog", "categories"],
  });

  const { data: posts = [], refetch: refetchPosts } = useQuery({
    queryKey: ["blog", "posts"],
    queryFn: async () => {
      const result = await sdk.client.fetch<{ post: Post[] }>(
        "/admin/blog-post",
        {
          method: "GET",
        }
      );
      return result.post || [];
    },
  });

  useEffect(() => {
    fetch("/admin/get-admin-user", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setUserName(data.user.first_name);
      });
  }, []);

  console.log("FECHA", publishedDate)
  // Función para generar slug automáticamente
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  // Función para resetear el formulario de post
  const resetPostForm = () => {
    setPostTitle("");
    setPostSlug("");
    setPostContent("");
    setPostCategory("none");
    setPostStatus("draft");
    setEditingPost(null);
    setIsEditing(false);
    setPostImage("");
    setPostExtract("");
    setPublishedDate(new Date().toISOString().split("T")[0]);
  };

  // Función para abrir modal de edición
  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setIsEditing(true);
    setPostTitle(post.title);
    setPostSlug(post.slug);
    setPostContent(post.content);
    setPostCategory(post.category_id || "none");
    setPostStatus(post.status);
    setPostImage(post.image || "");
    setPostExtract(post.extract || "");
    setIsPostModalOpen(true);
    setPublishedDate(post.published_at.split("T")[0]);
  };

  // Función para abrir modal de creación
  const handleCreateNewPost = () => {
    resetPostForm();
    setIsPostModalOpen(true);
  };

  // Handlers para crear categoría
  const handleCreateCategory = async () => {
    if (!categoryName.trim()) {
      toast.error("El nombre de la categoría es obligatorio");
      return;
    }

    try {
      await sdk.client.fetch("/admin/blog-category", {
        method: "POST",
        body: {
          name: categoryName,
          description: categoryDescription,
        },
      });

      toast.success("Categoría creada correctamente");
      refetchCategories();

      // Resetear formulario
      setCategoryName("");
      setCategorySlug("");
      setCategoryDescription("");
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al crear la categoría");
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Mostrar preview inmediato del archivo seleccionado
    setPostImage(file);

    // Subir el archivo al servidor
    const formData = new FormData();
    formData.append("files", file);

    try {
      const res = await fetch("/admin/uploads", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      // Una vez subido, reemplazar con la URL del servidor
      setPostImage(data.files[0].url);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir la imagen");
      setPostImage(""); // Limpiar en caso de error
    }
  };

  // Handlers para crear/actualizar post
  const handleSavePost = async () => {
    if (!postTitle.trim()) {
      toast.error("El título del post es obligatorio");
      return;
    }

    if (!postContent.trim()) {
      toast.error("El contenido del post es obligatorio");
      return;
    }

    setSaving(true);

    try {
      const postData = {
        author_name: userName,
        title: postTitle,
        slug: postSlug || generateSlug(postTitle),
        content: postContent,
        category_id: postCategory === "none" ? null : postCategory || null,
        status: postStatus,
        image: postImage || null,
        extract: postExtract || null,
        published_at: new Date(publishedDate).toISOString(),
      };

      if (isEditing && editingPost) {
        // Actualizar post existente
        await sdk.client.fetch(`/admin/blog-post/${editingPost.id}`, {
          method: "PUT",
          body: postData,
        });
        toast.success("Post actualizado correctamente");
      } else {
        // Crear nuevo post
        await sdk.client.fetch("/admin/blog-post", {
          method: "POST",
          body: postData,
        });
        toast.success("Post creado correctamente");
      }

      setSaving(false);
      refetchPosts();
      resetPostForm();
      setIsPostModalOpen(false);
    } catch (error) {
      console.error(error);
      setSaving(false);
      toast.error(
        isEditing ? "Error al actualizar el post" : "Error al crear el post"
      );
    }
  };

  // Función para eliminar post
  const handleDeletePost = async (postId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este post?")) {
      return;
    }

    try {
      await sdk.client.fetch(`/admin/blog-post/${postId}`, {
        method: "DELETE",
      });
      toast.success("Post eliminado correctamente");
      refetchPosts();
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar el post");
    }
  };

  return (
    <>
      {/* Modal para añadir categoría */}
      <FocusModal
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
      >
        <FocusModal.Content className="max-w-[600px] m-auto">
          <FocusModal.Header>
            <Heading className="text-lg font-semibold">
              Añadir Categoría
            </Heading>
          </FocusModal.Header>
          <FocusModal.Body className="p-6 space-y-4">
            <div>
              <Label htmlFor="category-name">Nombre de la categoría</Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  if (!categorySlug) {
                    setCategorySlug(generateSlug(e.target.value));
                  }
                }}
                placeholder="Nombre de la categoría"
              />
            </div>

            <div>
              <Label htmlFor="category-slug">Slug (URL)</Label>
              <Input
                id="category-slug"
                value={categorySlug}
                onChange={(e) => setCategorySlug(generateSlug(e.target.value))}
                placeholder="slug-de-la-categoria"
              />
            </div>

            <div>
              <Label htmlFor="category-description">Descripción</Label>
              <Input
                id="category-description"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="Descripción de la categoría"
              />
            </div>
          </FocusModal.Body>
          <FocusModal.Footer>
            <Button
              variant="secondary"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateCategory}>Crear Categoría</Button>
          </FocusModal.Footer>
        </FocusModal.Content>
      </FocusModal>

      {/* Modal para crear/editar post */}
      <FocusModal
        open={isPostModalOpen}
        onOpenChange={(open) => {
          setIsPostModalOpen(open);
          if (!open) {
            resetPostForm();
          }
        }}
      >
        <FocusModal.Content className="max-w-[1200px] max-h-[90vh] m-auto overflow-y-auto">
          <FocusModal.Header>
            <Heading className="text-lg font-semibold">
              {isEditing ? "Editar Post" : "Crear Post"}
            </Heading>
          </FocusModal.Header>
          <FocusModal.Body className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="post-title">Título del post</Label>
                <Input
                  id="post-title"
                  value={postTitle}
                  onChange={(e) => {
                    setPostTitle(e.target.value);
                    if (!postSlug || !isEditing) {
                      setPostSlug(generateSlug(e.target.value));
                    }
                  }}
                  placeholder="Título del post"
                />
              </div>
              <div>
                <Label htmlFor="post-slug">Slug (URL)</Label>
                <Input
                  id="post-slug"
                  value={postSlug}
                  onChange={(e) => setPostSlug(generateSlug(e.target.value))}
                  placeholder="slug-del-post"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="post-excerpt">Extracto</Label>
              <Input
                id="post-excerpt"
                value={postExtract}
                onChange={(e) => setPostExtract(e.target.value)}
                placeholder="Breve descripción del post"
              />
            </div>

            <div>
              <Label htmlFor="published-date">Fecha de Publicación</Label>
              <Input
                type="date"
                id="published-date"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="post-category">Categoría</Label>
                <Select value={postCategory} onValueChange={setPostCategory}>
                  <Select.Trigger>
                    <Select.Value placeholder="Seleccionar categoría" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="none">Sin categoría</Select.Item>
                    {categories?.map((category: any) => (
                      <Select.Item key={category.id} value={category.id}>
                        {category.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>

              <div>
                <Label htmlFor="post-status">Estado</Label>
                <Select value={postStatus} onValueChange={setPostStatus}>
                  <Select.Trigger>
                    <Select.Value placeholder="Estado del post" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="draft">Borrador</Select.Item>
                    <Select.Item value="published">Publicado</Select.Item>
                    <Select.Item value="private">Archivado</Select.Item>
                  </Select.Content>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="post-image">Imagen</Label>

              {/* Vista previa de la imagen actual */}
              {postImage && (
                <div className="mb-3">
                  <img
                    src={
                      typeof postImage === "string"
                        ? postImage
                        : URL.createObjectURL(postImage)
                    }
                    alt="Vista previa"
                    className="h-20 w-20 object-cover rounded-lg border border-ui-border-base"
                  />
                  <Button
                    variant="secondary"
                    size="small"
                    className="mt-2"
                    onClick={() => setPostImage("")}
                  >
                    Quitar imagen
                  </Button>
                </div>
              )}

              {/* Input para seleccionar nueva imagen */}
              <Input
                type="file"
                id="post-image"
                accept="image/*"
                onChange={handleImageChange}
              />

              {!postImage && (
                <p className="text-xs text-ui-fg-subtle mt-1">
                  Selecciona una imagen para el post
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="post-content">Contenido</Label>
              <div className="border border-gray-300 rounded-md min-h-[200px] p-4">
                <RichTextEditor
                  value={postContent}
                  onChange={setPostContent}
                  onSave={handleSavePost}
                  saveLoading={saving}
                />
              </div>
            </div>
          </FocusModal.Body>
          <FocusModal.Footer>
            <div className="flex justify-between w-full">
              <div>
                {isEditing && editingPost && (
                  <Button
                    variant="danger"
                    onClick={() => handleDeletePost(editingPost.id)}
                  >
                    Eliminar Post
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsPostModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSavePost} disabled={saving}>
                  {saving
                    ? "Guardando..."
                    : isEditing
                    ? "Actualizar Post"
                    : "Crear Post"}
                </Button>
              </div>
            </div>
          </FocusModal.Footer>
        </FocusModal.Content>
      </FocusModal>

      {/* Página principal */}
      <div className="p-8 max-w-[1280px] mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Heading className="text-2xl font-bold">Gestión de Blog</Heading>
          </div>

          <p className="text-ui-fg-subtle">
            Administra las categorías y posts de tu blog desde aquí.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 border border-ui-border-base rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Categorías</h3>
            <p className="text-ui-fg-subtle mb-4">
              Gestiona las categorías de tu blog
            </p>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setIsCategoryModalOpen(true)}
            >
              Añadir Nueva Categoría
            </Button>
          </div>

          <div className="p-6 border border-ui-border-base rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Posts</h3>
            <p className="text-ui-fg-subtle mb-4">
              Crea y gestiona los posts de tu blog
            </p>
            <Button size="small" onClick={handleCreateNewPost}>
              Crear Nuevo Post
            </Button>
          </div>
        </div>

        {/* Lista de posts */}
        {posts.length > 0 && (
          <div className="space-y-4">
            <Heading className="text-xl font-semibold">
              Posts Existentes
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post: Post) => (
                <div
                  key={post.id}
                  className="p-4 border border-ui-border-base rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleEditPost(post)}
                >
                  {post.image && (
                    <img
                      src={post.image}
                      alt={post.title}
                      className="mb-2 h-32 w-full object-cover rounded-lg"
                    />
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm leading-tight">
                      {post.title}
                    </h4>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        post.status === "published"
                          ? "bg-green-100 text-green-800"
                          : post.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {post.status === "published"
                        ? "Publicado"
                        : post.status === "draft"
                        ? "Borrador"
                        : "Archivado"}
                    </span>
                  </div>
                  <p className="text-sm text-ui-fg-subtle mb-2">
                    Por: {post.author_name}
                  </p>
                  <p className="text-xs text-ui-fg-muted">
                    {new Date(post.published_at).toLocaleDateString("es-ES")}
                  </p>
                  {post.excerpt && (
                    <p className="text-xs text-ui-fg-subtle mt-2 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BlogPage;
