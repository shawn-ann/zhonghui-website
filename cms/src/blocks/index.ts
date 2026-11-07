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
import { GridRowBlock } from './GridRow'
import { GridCellBlock } from './GridCell'
import { gridContent } from './gridContent'
import { HeadingBlock } from './Heading'
import { IconCardBlock } from './IconCard'
import { makeSection } from './Section'
import { InfoListBlock } from './InfoList'
import { EntriesBlock } from './Entries'
import { StepsBlock } from './Steps'
import { IconListBlock } from './IconList'
import { HscrollBlock } from './Hscroll'
import { StackBlock } from './Stack'

export const sectionChildren: Block[] = [HeadingBlock, TextBlock, Grid, GalleryBlock, BannerBlock, SliderBlock, RichTextBlock, InfoListBlock, EntriesBlock, StepsBlock, IconListBlock, HscrollBlock, StackBlock]

export const SectionBlock = makeSection(sectionChildren)

export { GridRowBlock, GridCellBlock, gridContent }

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
  EntriesBlock,
  StepsBlock,
  IconListBlock,
  HscrollBlock,
  StackBlock,
]
