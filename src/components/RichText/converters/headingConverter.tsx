import type { JSXConverters } from '@payloadcms/richtext-lexical/react'
import type { SerializedHeadingNode } from '@payloadcms/richtext-lexical'

/**
 * Generates a URL-friendly slug from text content
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/**
 * Extracts text content from React nodes
 */
function extractTextFromNodes(nodes: React.ReactNode[]): string {
  return nodes
    .map((node) => {
      if (typeof node === 'string') return node
      if (typeof node === 'number') return String(node)
      if (node && typeof node === 'object' && 'props' in node) {
        const props = node.props as { children?: React.ReactNode }
        if (props.children) {
          if (Array.isArray(props.children)) {
            return extractTextFromNodes(props.children)
          }
          return extractTextFromNodes([props.children])
        }
      }
      return ''
    })
    .join('')
}

export const headingConverter: JSXConverters<SerializedHeadingNode> = {
  heading: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })
    const textContent = extractTextFromNodes(children)
    const id = generateSlug(textContent)

    const Tag = node.tag

    // Add id for anchor linking on h2 and h3
    if (node.tag === 'h2' || node.tag === 'h3') {
      return <Tag id={id}>{children}</Tag>
    }

    return <Tag>{children}</Tag>
  }
}

