import youBottle from '@/assets/fragrance/you-bottle.svg'
import soieBottle from '@/assets/fragrance/soie-bottle.svg'
import douxBottle from '@/assets/fragrance/doux-bottle.svg'
import fleurBottle from '@/assets/fragrance/fleur-bottle.svg'
import youMood from '@/assets/fragrance/you-mood.jpg'
import soieMood from '@/assets/fragrance/soie-mood.jpg'
import douxMood from '@/assets/fragrance/doux-mood.jpg'
import fleurMood from '@/assets/fragrance/fleur-mood.jpg'
import type { ProductVariant } from '@/types/productVariant.ts'

export type FragranceBadge =
  | { kind: 'tag'; label: string }
  | { kind: 'ribbon'; year: string; label: string }

export type FragranceProduct = {
  id: string
  name: string
  subtitle: string
  variants: ProductVariant[]
  moodImage: string
  bottleAlt: string
  moodAlt: string
  badge?: FragranceBadge
}

type SizeVariantInput = {
  id: string
  sku: string
  label: string
  price: number
}

// 용량별 가격·SKU·병 이미지
function sizeVariants(
  bottleImage: string,
  items: SizeVariantInput[],
  defaultLabel: string
): ProductVariant[] {
  return items.map(({ id, sku, label, price }) => ({
    id,
    sku,
    label,
    price,
    stock: 0,
    bottleImage,
    isDefault: label === defaultLabel,
  }))
}

export const FRAGRANCE_PRODUCTS: FragranceProduct[] = [
  {
    id: 'you',
    name: 'Lumière You',
    subtitle: 'Eau de parfum',
    variants: sizeVariants(youBottle, [
      { id: 'you-8', sku: 'LM-YOU-EDP-8', label: '8 ml', price: 22_000 },
      { id: 'you-50', sku: 'LM-YOU-EDP-50', label: '50 ml', price: 148_000 },
      { id: 'you-100', sku: 'LM-YOU-EDP-100', label: '100 ml', price: 230_000 },
    ], '50 ml'),
    moodImage: youMood,
    bottleAlt: 'Lumière You — 핑크 그라데이션 향수병',
    moodAlt: '따뜻한 피부 톤의 무드 포트레이',
    badge: { kind: 'tag', label: 'BEST SELLER' },
  },
  {
    id: 'soie',
    name: 'Lumière Soie',
    subtitle: 'Eau de parfum',
    variants: sizeVariants(soieBottle, [
      { id: 'soie-8', sku: 'LM-SOIE-EDP-8', label: '8 ml', price: 24_000 },
      { id: 'soie-50', sku: 'LM-SOIE-EDP-50', label: '50 ml', price: 158_000 },
      { id: 'soie-100', sku: 'LM-SOIE-EDP-100', label: '100 ml', price: 245_000 },
    ], '50 ml'),
    moodImage: soieMood,
    bottleAlt: 'Lumière Soie — 딥 블루 향수병',
    moodAlt: '시크한 실크 무드 포트레이',
    badge: { kind: 'ribbon', year: '2026', label: 'MOST POPULAR' },
  },
  {
    id: 'doux',
    name: 'Lumière Doux',
    subtitle: 'Eau de parfum',
    variants: sizeVariants(douxBottle, [
      { id: 'doux-8', sku: 'LM-DOUX-EDP-8', label: '8 ml', price: 22_000 },
      { id: 'doux-50', sku: 'LM-DOUX-EDP-50', label: '50 ml', price: 148_000 },
      { id: 'doux-100', sku: 'LM-DOUX-EDP-100', label: '100 ml', price: 230_000 },
    ], '50 ml'),
    moodImage: douxMood,
    bottleAlt: 'Lumière Doux — 크림 화이트 향수병',
    moodAlt: '부드러운 골든 라이트 무드',
  },
  {
    id: 'fleur',
    name: 'Lumière Fleur',
    subtitle: 'Eau de parfum',
    variants: sizeVariants(fleurBottle, [
      { id: 'fleur-8', sku: 'LM-FLEUR-EDP-8', label: '8 ml', price: 22_000 },
      { id: 'fleur-50', sku: 'LM-FLEUR-EDP-50', label: '50 ml', price: 148_000 },
      { id: 'fleur-100', sku: 'LM-FLEUR-EDP-100', label: '100 ml', price: 230_000 },
    ], '50 ml'),
    moodImage: fleurMood,
    bottleAlt: 'Lumière Fleur — 라벤더 향수병',
    moodAlt: '플로럴 라벤더 무드',
  },
]
