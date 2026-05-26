export interface Profile {
  id: string
  user_id: string
  nickname: string
  avatar_url: string | null
  created_at: string
}

export interface UserRelation {
  id: string
  user_a: string
  user_b: string
  created_at: string
}

export type MoodType = 'happy' | 'love' | 'miss' | 'anxious' | 'angry' | 'sad' | 'excited' | 'tired'

export const MOOD_CONFIG: Record<MoodType, { emoji: string; label: string; color: string }> = {
  happy: { emoji: '😊', label: '开心', color: '#fbbf24' },
  love: { emoji: '🥰', label: '想ta', color: '#f472b6' },
  miss: { emoji: '💭', label: '想念', color: '#a78bfa' },
  anxious: { emoji: '😰', label: '焦虑', color: '#f87171' },
  angry: { emoji: '😤', label: '生气', color: '#fb923c' },
  sad: { emoji: '😢', label: '难过', color: '#60a5fa' },
  excited: { emoji: '🎉', label: '兴奋', color: '#34d399' },
  tired: { emoji: '😴', label: '疲惫', color: '#94a3b8' },
}

export interface Mood {
  id: string
  user_id: string
  mood_type: MoodType
  note: string | null
  created_at: string
}

export interface SavingsGoal {
  id: string
  created_by: string
  title: string
  target_amount: number
  current_amount: number
  cover_emoji: string
  created_at: string
}

export interface SavingsContribution {
  id: string
  goal_id: string
  user_id: string
  amount: number
  note: string | null
  created_at: string
}

export interface PlantWatering {
  id: string
  user_id: string
  watered_at: string
}

export interface Moment {
  id: string
  user_id: string
  content: string
  image_urls: string[]
  created_at: string
}

export interface MomentLike {
  id: string
  moment_id: string
  user_id: string
  created_at: string
}

export interface MomentComment {
  id: string
  moment_id: string
  user_id: string
  content: string
  created_at: string
}

export type PlantStage = 'seed' | 'sprout' | 'budding' | 'flowering' | 'blooming' | 'wilted'

export const PLANT_STAGES: Record<PlantStage, { emoji: string; label: string }> = {
  seed: { emoji: '🌰', label: '种子' },
  sprout: { emoji: '🌱', label: '发芽' },
  budding: { emoji: '🪴', label: '含苞' },
  flowering: { emoji: '🌸', label: '开花' },
  blooming: { emoji: '🌺', label: '盛放' },
  wilted: { emoji: '🥀', label: '蔫了' },
}
