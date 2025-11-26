import type { SerializedLinkNode } from '@payloadcms/richtext-lexical'

export const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }): string => {
  const { value, relationTo } = linkNode.fields.doc!

  // Handle primitive values (string or number)
  if (typeof value === 'string' || typeof value === 'number') {
    if (relationTo === 'properties') {
      return `/properties/${value}`
    } else if (relationTo === 'bookings') {
      return `/bookings/${value}`
    }
    return `/${value}`
  }

  // value is an object - extract slug if available
  const slug = 'slug' in value ? value.slug : null
  const id = value.id

  // Handle different collection types
  if (relationTo === 'properties') {
    return `/properties/${id}`
  } else if (relationTo === 'bookings') {
    return `/bookings/${id}`
  } else if (slug) {
    // Default: use slug if available
    return `/${slug}`
  } else {
    // Fallback: use id
    return `/${id}`
  }
}

