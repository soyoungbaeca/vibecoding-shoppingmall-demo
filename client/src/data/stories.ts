import douxMood from '@/assets/fragrance/doux-mood.jpg'
import fleurMood from '@/assets/fragrance/fleur-mood.jpg'
import youMood from '@/assets/fragrance/you-mood.jpg'

export type StorySlide = {
  id: string
  headline: string
  body: string
  image: string
  imageAlt: string
  overlay: string
}

export const STORY_SLIDES: StorySlide[] = [
  {
    id: 'love-at-first-sniff',
    headline:
      'Our favorite scents that will grow with you no matter where you are in your personal evolution.',
    body: "My now-boyfriend borrowed my sweatshirt thinking it was my roommate's. Weeks later we met at a party — first thing he said: 'You smell familiar.' It was love at first sniff.",
    image: youMood,
    imageAlt: '가방 속 향수와 소지품 라이프스타일 컷',
    overlay: 'you smell good.',
  },
  {
    id: 'morning-ritual',
    headline: 'A single spritz can turn an ordinary morning into something you remember all day.',
    body: 'I keep Lumière You on my desk. Before video calls, before coffee runs — it is the smallest ritual that makes me feel like myself again.',
    image: douxMood,
    imageAlt: '부드러운 조명의 포트레이트',
    overlay: 'your scent, your story.',
  },
  {
    id: 'layer-by-layer',
    headline: 'Layer soft florals over warm skin scents and watch the mood shift with the light.',
    body: 'Fleur on my wrists, Doux on my collarbone. Friends always ask what I am wearing. I tell them it is not one perfume — it is a combination only I wear.',
    image: fleurMood,
    imageAlt: '라벤더 톤 무드 이미지',
    overlay: 'smell like you.',
  },
]
