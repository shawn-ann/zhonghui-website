import type { Block } from 'payload'
import { TextBlock } from './Text'
import { ImageBlock } from './Image'
import { ImageTextBlock } from './ImageText'
import { ButtonBlock } from './Button'
import { HeadingBlock } from './Heading'
import { IconCardBlock } from './IconCard'
import { StackBlock } from './Stack'
import { StepsBlock } from './Steps'

/** 网格 / 行内格子允许放置的普通内容组件。 */
export const gridContent: Block[] = [
  HeadingBlock,
  TextBlock,
  ImageBlock,
  ImageTextBlock,
  ButtonBlock,
  IconCardBlock,
  StackBlock,
  StepsBlock,
]
