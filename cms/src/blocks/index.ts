import type { Block } from 'payload'
import { BannerBlock } from './Banner'
import { TextBlock } from './Text'
import { ImageBlock } from './Image'
import { ImageTextBlock } from './ImageText'
import { ButtonBlock } from './Button'
import { RichTextBlock } from './RichText'
import { GalleryBlock } from './Gallery'
import { SliderBlock } from './Slider'
import { Grid } from './Grid'
import { HeadingBlock } from './Heading'
import { IconCardBlock } from './IconCard'
import { makeSection } from './Section'
import { InfoListBlock } from './InfoList'
import { IconListBlock } from './IconList'
import { HscrollBlock } from './Hscroll'
import { StackBlock } from './Stack'

export const sectionChildren: Block[] = [HeadingBlock, Grid, GalleryBlock, BannerBlock, SliderBlock, RichTextBlock, InfoListBlock, IconListBlock, HscrollBlock]

export const SectionBlock = makeSection(sectionChildren)

export const pageBlocks: Block[] = [
  SectionBlock,
  HeadingBlock,
  Grid,
  BannerBlock,
  TextBlock,
  ImageBlock,
  ImageTextBlock,
  ButtonBlock,
  RichTextBlock,
  GalleryBlock,
  SliderBlock,
  IconCardBlock,
  InfoListBlock,
  IconListBlock,
  HscrollBlock,
  StackBlock,
]
