'use client'

import { RichText as RichTextConverter } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { jsxConverter } from '@/components/RichText/converters'
import { cn } from '@/lib/utils'

type Props = {
  data: SerializedEditorState | null | undefined
} & React.HTMLAttributes<HTMLDivElement>

export function RichText(props: Props) {
  const { data, className, ...rest } = props

  if (!data) {
    return null
  }

  return (
    <RichTextConverter
      {...rest}
      data={data}
      className={cn('rich-text', className)}
      converters={jsxConverter}
    />
  )
}

