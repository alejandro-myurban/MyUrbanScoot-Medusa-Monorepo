// src/components/layout/navbar/vinyl-nav-dropdown.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Los tipos ayudan a entender la estructura de datos
type CategoryChild = {
  id: string
  name: string
  handle: string
  category_children?: CategoryChild[] // Permite nietos recursivamente
}

type Category = {
  id: string
  name: string
  handle: string
  parent_category: any | null
  category_children?: CategoryChild[]
}

// Componente cliente que maneja la interactividad
export default function VinylNavDropdown({ 
  categories 
}: { 
  categories: Category[] 
}) {
  const [activeParent, setActiveParent] = useState<string | null>(null)
  const [activeChild, setActiveChild] = useState<string | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Filtramos solo las categorías padres (sin parent_category)
  const parentCategories = categories.filter(cat => !cat.parent_category)
  
  // Función para abrir el menú con un id específico
  const handleOpenMenu = (id: string) => {
    // Si hay un timeout pendiente para cerrar, lo cancelamos
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    
    // Establecemos la categoría padre activa
    setActiveParent(id)
    
    // Si hay una categoría padre activa, automáticamente activamos su primera categoría hija
    const parent = parentCategories.find(p => p.id === id)
    if (parent?.category_children && parent.category_children.length > 0) {
      setActiveChild(parent.category_children[0].id)
    }
  }
  
  // Función para cerrar el menú con un retraso
  const handleCloseMenu = () => {
    // Establecemos un timeout para cerrar el menú después de un retraso
    closeTimeoutRef.current = setTimeout(() => {
      setActiveParent(null)
      setActiveChild(null)
    }, 500) // 500ms de retraso antes de cerrar
  }
  
  // Cancelar cualquier timeout pendiente al desmontar el componente
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])
  
  // Detectar clicks fuera del menú para cerrarlo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveParent(null)
        setActiveChild(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  return (
    <nav className="relative" ref={menuRef}>
      <ul className="flex items-center gap-8">
        {parentCategories.map((parent) => (
          <li 
            key={parent.id}
            className="relative group"
            onMouseEnter={() => handleOpenMenu(parent.id)}
            onMouseLeave={handleCloseMenu}
          >
            <LocalizedClientLink
              href={`/categories/${parent.handle}`}
              className={clx(
                "block py-4 px-2 text-ui-fg-base hover:text-ui-fg-subtle transition-colors",
                activeParent === parent.id && "font-medium"
              )}
            >
              {parent.name}
              {parent.category_children && parent.category_children.length > 0 && (
                <svg 
                  className="w-3 h-3 ml-1 inline-block"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              )}
            </LocalizedClientLink>
            
            {/* Dropdown para categorías hijas */}
            {activeParent === parent.id && parent.category_children && parent.category_children.length > 0 && (
              <div 
                className="absolute left-0 mt-1 bg-white shadow-lg rounded-md border border-ui-border-base min-w-64 z-50"
                onMouseEnter={() => handleOpenMenu(parent.id)}
                onMouseLeave={handleCloseMenu}
              >
                {/* Área de "amortiguación" superior para mejorar la experiencia de hover */}
                <div className="h-2 absolute -top-2 left-0 right-0"></div>
                
                <ul className="py-3">
                  {parent.category_children.map((child) => (
                    <li 
                      key={child.id} 
                      className="relative"
                    >
                      <div 
                        className={clx(
                          "flex items-center justify-between transition-colors",
                          activeChild === child.id ? "bg-ui-bg-subtle" : "hover:bg-ui-bg-subtle"
                        )}
                        onMouseEnter={() => {
                          // Actualizamos el hijo activo y mantenemos el padre activo
                          handleOpenMenu(parent.id)
                          setActiveChild(child.id)
                        }}
                      >
                        <LocalizedClientLink
                          href={`/categories/${child.handle}`}
                          className="block px-6 py-3 flex-grow"
                          onClick={() => {
                            setActiveParent(null)
                            setActiveChild(null)
                          }}
                        >
                          {child.name}
                        </LocalizedClientLink>
                        
                        {/* Flecha para categorías nietas si existen */}
                        {child.category_children && child.category_children.length > 0 && (
                          <span className="mr-4 text-ui-fg-subtle">
                            <svg 
                              className="w-3 h-3"
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                          </span>
                        )}
                      </div>
                      
                      {/* Sub-dropdown para nietas (tercer nivel) - Ahora se muestra cuando activeChild coincide */}
                      {child.category_children && child.category_children.length > 0 && activeChild === child.id && (
                        <div 
                          className="absolute left-full top-0 bg-white shadow-lg rounded-md border border-ui-border-base min-w-56 -ml-1 z-50"
                          onMouseEnter={() => {
                            // Mantenemos ambos menús abiertos
                            handleOpenMenu(parent.id)
                            setActiveChild(child.id)
                          }}
                          onMouseLeave={handleCloseMenu}
                        >
                          {/* Área de "conexión" para facilitar el movimiento del ratón hacia los nietos */}
                          <div className="absolute -left-4 top-0 bottom-0 w-4"></div>
                          
                          <ul className="py-3">
                            {child.category_children.map((grandchild) => (
                              <li key={grandchild.id}>
                                <LocalizedClientLink
                                  href={`/categories/${grandchild.handle}`}
                                  className="block px-6 py-3 hover:bg-ui-bg-subtle transition-colors whitespace-nowrap"
                                  onClick={() => {
                                    setActiveParent(null)
                                    setActiveChild(null)
                                  }}
                                >
                                  {grandchild.name}
                                </LocalizedClientLink>
                              </li>
                            ))}
                            <li className="border-t border-ui-border-base mt-2 pt-2">
                              <LocalizedClientLink
                                href={`/categories/${child.handle}`}
                                className="block px-6 py-3 text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle transition-colors text-sm"
                                onClick={() => {
                                  setActiveParent(null)
                                  setActiveChild(null)
                                }}
                              >
                                Ver todo en {child.name}
                              </LocalizedClientLink>
                            </li>
                          </ul>
                        </div>
                      )}
                    </li>
                  ))}
                  
                  <li className="border-t border-ui-border-base mt-2 pt-2">
                    <LocalizedClientLink
                      href={`/categories/${parent.handle}`}
                      className="block px-6 py-3 text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle transition-colors text-sm"
                      onClick={() => {
                        setActiveParent(null)
                        setActiveChild(null)
                      }}
                    >
                      Ver todo en {parent.name}
                    </LocalizedClientLink>
                  </li>
                </ul>
              </div>
            )}
          </li>
        ))}
        
        {/* Opción "Ver todos" */}  
        <li>
          <LocalizedClientLink
            href="/categories/vinilos"
            className="block py-4 px-2 text-ui-fg-base hover:text-ui-fg-subtle transition-colors"
          >
            Ver todos
          </LocalizedClientLink>
        </li>
      </ul>
    </nav>
  )
}