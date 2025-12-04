import type { DefaultNodeTypes } from '@payloadcms/richtext-lexical'
import {
  JSXConvertersFunction,
  LinkJSXConverter
} from '@payloadcms/richtext-lexical/react'

import { internalDocToHref } from '@/components/RichText/converters/internalLink'
import { headingConverter } from '@/components/RichText/converters/headingConverter'

type NodeTypes = DefaultNodeTypes

export const jsxConverter: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  ...headingConverter,
  // Add custom blocks here when needed:
  // blocks: {
  //   myBlockSlug: ({ node }) => <MyBlockComponent {...node.fields} />,
  // },
})




