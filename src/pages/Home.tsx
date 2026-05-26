import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { MOOD_CONFIG, PLANT_STAGES } from '../types'
import type { Mood, PlantStage } from '../types'
import BottomNav from '../components/BottomNav'

export default function Home() {
  const { user, partnerId } = useAuth()
  const navigate = useNavigate()
  const [myMood, setMyMood] = useState<Mood | null>(null)
  const [partnerMood, setPartnerMood] = useState<Mood | null>(null)
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [plantStage, setPlantStage] = useState<PlantStage>('seed')
  const [streakDays, setStreakDays] = useState(0)
  const [iWateredToday, setIWateredToday] = useState(false)
  const [partnerWateredToday, setPartnerWateredToday] = useState(false)
  const [savingsGoal, setSavingsGoal] = useState<{ id: string; title: string; current: number; target: number; emoji: string } | null>(null)
  const [showHearts, setShowHearts] = useState(false)

  useEffect(() => {
    if (!user) return
    loadAll()
  }, [user, partnerId])

  async function loadAll() {
    await Promise.all([loadTodayMood(), loadPlantStatus(), loadSavingsOverview()])
  }

  async function loadTodayMood() {
    const today = new Date().toISOString().slice(0, 10)
    const { data: my } = await supabase.from('moods').select('*').eq('user_id', user!.id).gte('created_at', today).maybeSingle()
    setMyMood(my)
    if (partnerId) {
      const { data: p } = await supabase.from('moods').select('*').eq('user_id', partnerId).gte('created_at', today).maybeSingle()
      setPartnerMood(p)
    }
  }

  async function loadPlantStatus() {
    const today = new Date().toISOString().slice(0, 10)
    const { data: waterings } = await supabase
      .from('plant_waterings')
      .select('user_id, watered_at')
      .order('watered_at', { ascending: false })
      .limit(60)

    if (!waterings || waterings.length === 0) {
      setPlantStage('seed')
      setIWateredToday(false)
      setPartnerWateredToday(false)
      return
    }

    // check who watered today
    const todayWaterings = waterings.filter(w => w.watered_at.slice(0, 10) === today)
    setIWateredToday(todayWaterings.some(w => w.user_id === user!.id))
    setPartnerWateredToday(todayWaterings.some(w => w.user_id === partnerId))

    // deduplicate dates for streak calculation
    const dates = [...new Set(waterings.map(w => w.watered_at.slice(0, 10)))].sort().reverse()

    // check if no watering for 2+ days → wilted
    const lastWateredDate = dates[0]
    const daysSinceLastWater = Math.floor((new Date(today).getTime() - new Date(lastWateredDate).getTime()) / 86400000)

    if (daysSinceLastWater >= 2) {
      setPlantStage('wilted')
      setStreakDays(0)
      return
    }

    // count consecutive days from today backwards
    let streak = 0
    const d = new Date(today)
    // start from yesterday if not watered today
    if (dates[0] !== today) {
      d.setDate(d.getDate() - 1)
    }
    for (const dateStr of dates) {
      const expected = d.toISOString().slice(0, 10)
      if (dateStr === expected) {
        streak++
        d.setDate(d.getDate() - 1)
      } else if (dateStr < expected) {
        break
      }
    }
    setStreakDays(streak)

    if (streak === 0 || streak === 1) setPlantStage('seed')
    else if (streak < 3) setPlantStage('sprout')
    else if (streak < 7) setPlantStage('budding')
    else if (streak < 14) setPlantStage('flowering')
    else setPlantStage('blooming')
  }

  async function loadSavingsOverview() {
    const { data } = await supabase.from('savings_goals').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (data) {
      setSavingsGoal({
        id: data.id,
        title: data.title,
        current: data.current_amount,
        target: data.target_amount,
        emoji: data.cover_emoji,
      })
    }
  }

  async function waterPlant() {
    if (iWateredToday) return
    await supabase.from('plant_waterings').insert({ user_id: user!.id, watered_at: new Date().toISOString() })
    setIWateredToday(true)
    setShowHearts(true)
    setTimeout(() => setShowHearts(false), 1500)
    loadPlantStatus()
  }

  async function setMood(moodType: string) {
    setShowMoodPicker(false)
    const { error } = await supabase.from('moods').insert({
      user_id: user!.id,
      mood_type: moodType,
      note: null,
    })
    if (!error) {
      setMyMood({ id: '', user_id: user!.id, mood_type: moodType as any, note: null, created_at: new Date().toISOString() })
    }
  }

  const stage = PLANT_STAGES[plantStage]
  const progress = savingsGoal ? Math.min(savingsGoal.current / savingsGoal.target * 100, 100) : 0

  return (
    <div className="min-h-screen bg-cream pb-20">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-warm">我们的日子 🏠</h1>
      </div>

      <div className="px-5 space-y-5">
        {/* Mood Bar */}
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-3">今日心情</p>
          <div className="flex items-center gap-4">
            {/* My mood */}
            <div className="flex-1 text-center">
              {myMood ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl">{MOOD_CONFIG[myMood.mood_type]?.emoji}</span>
                  <span className="text-xs text-gray-500">{MOOD_CONFIG[myMood.mood_type]?.label}</span>
                </div>
              ) : (
                <button onClick={() => setShowMoodPicker(!showMoodPicker)} className="text-3xl opacity-40 hover:opacity-80 transition-opacity">❓</button>
              )}
              <p className="text-xs text-gray-400 mt-1">我</p>
            </div>
            <div className="text-gray-300">♥</div>
            {/* Partner mood */}
            <div className="flex-1 text-center">
              {partnerMood ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl">{MOOD_CONFIG[partnerMood.mood_type]?.emoji}</span>
                  <span className="text-xs text-gray-500">{MOOD_CONFIG[partnerMood.mood_type]?.label}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl opacity-30">❓</span>
                  <span className="text-xs text-gray-400">未设置</span>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">ta</p>
            </div>
          </div>
          {/* Mood picker popup */}
          {showMoodPicker && (
            <div className="flex gap-2 justify-center mt-3 pt-3 border-t border-gray-100 flex-wrap">
              {Object.entries(MOOD_CONFIG).map(([key, { emoji, label }]) => (
                <button key={key} onClick={() => setMood(key)} className="text-2xl p-1.5 hover:scale-125 transition-transform active:scale-90" title={label}>
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Plant */}
        <div className="bg-white rounded-3xl p-6 shadow-sm text-center relative overflow-hidden">
          {showHearts && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl heart-float pointer-events-none">💧</div>
          )}
          <p className="text-xs text-gray-400 mb-2">我们的花</p>
          <div className={`text-7xl mb-3 ${plantStage !== 'wilted' ? 'plant-wiggle' : 'opacity-60'}`}>
            {stage.emoji}
          </div>
          <p className="text-sm font-semibold text-gray-700">{stage.label}</p>
          <p className="text-xs text-gray-400 mt-1">
            {plantStage === 'wilted'
              ? '花花快渴死了，快浇水吧 😢'
              : streakDays > 0
                ? `连续浇水 ${streakDays} 天 🔥`
                : '今天还没浇水哦～'}
          </p>
          {/* Watering status */}
          <div className="flex justify-center gap-4 mt-1 text-xs text-gray-400">
            <span>{iWateredToday ? '✅ 我浇过了' : '我还没浇'}</span>
            <span>{partnerWateredToday ? '✅ ta浇过了' : 'ta还没浇'}</span>
          </div>
          <button
            onClick={waterPlant}
            disabled={iWateredToday}
            className={`mt-3 px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              iWateredToday
                ? 'bg-gray-100 text-gray-400'
                : 'bg-blue-100 text-blue-500 hover:bg-blue-200 active:scale-95'
            }`}
          >
            {iWateredToday ? '今天已浇水 ✅' : '💧 浇水'}
          </button>
        </div>

        {/* Savings */}
        {savingsGoal && (
          <div
            onClick={() => navigate(`/savings/${savingsGoal.id}`)}
            className="bg-white rounded-3xl p-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">{savingsGoal.emoji} {savingsGoal.title}</span>
              <span className="text-xs text-gray-400">
                ¥{savingsGoal.current.toLocaleString()} / ¥{savingsGoal.target.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber to-warm rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-right mt-1 text-gray-400">{Math.round(progress)}%</p>
          </div>
        )}

        {!savingsGoal && (
          <button
            onClick={() => navigate('/savings')}
            className="w-full bg-white rounded-3xl p-4 shadow-sm text-center text-gray-400 text-sm hover:text-warm transition-colors"
          >
            + 创建一个攒钱目标吧
          </button>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/moments')}
            className="bg-white rounded-2xl p-4 text-center shadow-sm hover:shadow transition-shadow"
          >
            <div className="text-2xl mb-1">📸</div>
            <div className="text-xs text-gray-500">我们的动态</div>
          </button>
          <button
            onClick={() => navigate('/savings')}
            className="bg-white rounded-2xl p-4 text-center shadow-sm hover:shadow transition-shadow"
          >
            <div className="text-2xl mb-1">🐷</div>
            <div className="text-xs text-gray-500">攒钱计划</div>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
