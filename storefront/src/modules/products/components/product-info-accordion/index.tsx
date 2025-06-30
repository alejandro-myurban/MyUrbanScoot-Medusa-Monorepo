'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

interface AccordionItem {
  id: string
  title: string
  content: React.ReactNode
  defaultOpen?: boolean
}

interface AccordionProps {
  items: AccordionItem[]
  allowMultiple?: boolean
  className?: string
}

const Accordion = ({ items, allowMultiple = false, className = '' }: AccordionProps) => {
  const [openItems, setOpenItems] = useState<Set<string>>(
    new Set(items.filter(item => item.defaultOpen).map(item => item.id))
  )

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => {
      const newOpenItems = new Set(prev)
      
      if (newOpenItems.has(itemId)) {
        newOpenItems.delete(itemId)
      } else {
        if (!allowMultiple) {
          newOpenItems.clear()
        }
        newOpenItems.add(itemId)
      }
      
      return newOpenItems
    })
  }

  return (
    <div className={`w-full ${className}`}>
      {items.map((item, index) => {
        const isOpen = openItems.has(item.id)
        const isLast = index === items.length - 1
        
        return (
          <div 
            key={item.id}
            className={`border-gray-200 ${isLast ? 'border-b-0' : ''}`}
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between py-3 px-0 text-left hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-opacity-50 rounded-sm"
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${item.id}`}
            >
              <span className="text-sm text-gray-500 font-semibold pr-4">
                {item.title}
              </span>
              {isOpen ? (
                <Minus className="w-4 h-4 text-gray-500 flex-shrink-0" />
              ) : (
                <Plus className="w-4 h-4 text-gray-500 flex-shrink-0" />
              )}
            </button>
            
            <div
              id={`accordion-content-${item.id}`}
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="pb-4 text-sm text-gray-500">
                {item.content}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Accordion