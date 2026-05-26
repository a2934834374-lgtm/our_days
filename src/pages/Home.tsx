import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { MOOD_CONFIG, PLANT_STAGES } from '../types'
import type { Mood, PlantStage } from '../types'
import BottomNav from '../components/BottomNav'
import { Heart, Droplets, Sparkles, Camera, PiggyBank } from 'lucide-react'

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

    const todayWaterings = waterings.filter(w => w.watered_at.slice(0, 10) === today)
    setIWateredToday(todayWaterings.some(w => w.user_id === user!.id))
    setPartnerWateredToday(todayWaterings.some(w => w.user_id === partnerId))

    const dates = [...new Set(waterings.map(w => w.watered_at.slice(0, 10)))].sort().reverse()
    const lastWateredDate = dates[0]
    const daysSinceLastWater = Math.floor((new Date(today).getTime() - new Date(lastWateredDate).getTime()) / 86400000)

    if (daysSinceLastWater >= 2) {
      setPlantStage('wilted')
      setStreakDays(0)
      return
    }

    let streak = 0
    const d = new Date(today)
    if (dates[0] !== today) d.setDate(d.getDate() - 1)
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
  const bothWatered = iWateredToday && partnerWateredToday

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-orange-50/30 to-amber-50/50 pb-20">
      {/* Header */}
      <div className="px-5 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-800">我们的日子</h1>
          <p className="text-xs text-orange-400 mt-0.5">今天也要开心呀</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm border border-orange-100/60">
          <Sparkles size={14} className="text-orange-400" strokeWidth={1.5} />
          <span className="text-xs font-medium text-gray-500">
            连续 {streakDays} 天
          </span>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Mood Card */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-orange-100/40">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-5">今日心情</p>
          <div className="flex items-center gap-6">
            {/* My mood */}
            <div className="flex-1 text-center">
              {myMood ? (
                <button onClick={() => setShowMoodPicker(!showMoodPicker)} className="flex flex-col items-center mx-auto group relative">
                  <span className="text-4xl group-hover:scale-110 transition-transform">{MOOD_CONFIG[myMood.mood_type]?.emoji}</span>
                  <span className="text-xs font-medium text-gray-600 mt-1">{MOOD_CONFIG[myMood.mood_type]?.label}</span>
                  <span className="text-[9px] text-gray-300 absolute -bottom-3 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap">点击更换</span>
                </button>
              ) : (
                <button onClick={() => setShowMoodPicker(!showMoodPicker)} className="flex flex-col items-center mx-auto group">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors border border-dashed border-gray-200 group-hover:border-orange-200">
                    <span className="text-2xl opacity-30 group-hover:opacity-60">?</span>
                  </div>
                  <span className="text-xs text-gray-400 mt-1.5">点击记录心情</span>
                </button>
              )}
              <p className="text-[10px] text-gray-400 mt-2 font-medium">我</p>
            </div>

            <Heart size={22} className="text-rose-300 shrink-0" strokeWidth={1.5} fill="#fecdd3" />

            {/* Partner mood */}
            <div className="flex-1 text-center">
              {partnerMood ? (
                <div className="flex flex-col items-center">
                  <span className="text-4xl">{MOOD_CONFIG[partnerMood.mood_type]?.emoji}</span>
                  <span className="text-xs font-medium text-gray-600 mt-1">{MOOD_CONFIG[partnerMood.mood_type]?.label}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center border border-dashed border-gray-200">
                    <span className="text-2xl opacity-20">?</span>
                  </div>
                  <span className="text-xs text-gray-400 mt-1.5">ta还没记录</span>
                </div>
              )}
              <p className="text-[10px] text-gray-400 mt-2 font-medium">ta</p>
            </div>
          </div>

          {/* Mood picker */}
          {showMoodPicker && (
            <div className="flex gap-1 justify-center mt-6 pt-5 border-t border-orange-50 flex-wrap">
              {Object.entries(MOOD_CONFIG).map(([key, { emoji, label }]) => (
                <button key={key} onClick={() => setMood(key)}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-2xl hover:bg-orange-50 transition-colors active:scale-90 min-w-[52px]"
                  title={label}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-[9px] text-gray-400 font-medium">{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Plant Card */}
        <div className="bg-white rounded-[28px] p-7 shadow-sm border border-orange-100/40 text-center relative overflow-hidden">
          {showHearts && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl heart-float pointer-events-none">💧</div>
          )}
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-4">我们的花</p>
          <div className={`text-7xl mb-4 transition-all duration-500 ${plantStage !== 'wilted' ? 'plant-wiggle drop-shadow-sm' : 'opacity-50 grayscale'}`}>
            {stage.emoji}
          </div>
          <p className="text-[17px] font-semibold tracking-tight text-gray-800">{stage.label}</p>
          <p className="text-sm text-gray-400 mt-1.5">
            {plantStage === 'wilted'
              ? '花花快渴死了，快去浇水吧 😢'
              : bothWatered
                ? '今天你们都已浇水，花花很开心 ✨'
                : streakDays > 0
                  ? `已连续浇水 ${streakDays} 天 🔥`
                  : '今天还没浇水哦'}
          </p>
          {/* Watering status */}
          <div className="flex justify-center gap-8 mt-3 mb-1">
            <span className={`text-sm font-medium flex items-center gap-1.5 ${iWateredToday ? 'text-green-500' : 'text-gray-400'}`}>
              <Droplets size={14} strokeWidth={1.5} /> {iWateredToday ? '我浇过了' : '我还没浇'}
            </span>
            <span className={`text-sm font-medium flex items-center gap-1.5 ${partnerWateredToday ? 'text-green-500' : 'text-gray-400'}`}>
              <Droplets size={14} strokeWidth={1.5} /> {partnerWateredToday ? 'ta浇过了' : 'ta还没浇'}
            </span>
          </div>
          <button
            onClick={waterPlant}
            disabled={iWateredToday}
            className={`mt-5 px-8 py-3 rounded-full text-[15px] font-semibold transition-all duration-300 ${
              iWateredToday
                ? 'bg-gray-100 text-gray-400 cursor-default'
                : 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm shadow-blue-200/50 hover:shadow-md active:scale-95'
            }`}
          >
            {iWateredToday ? '今天已浇水 ✓' : '💧 给花浇水'}
          </button>
        </div>

        {/* Savings */}
        {savingsGoal && (
          <div
            onClick={() => navigate(`/savings/${savingsGoal.id}`)}
            className="bg-white rounded-[24px] p-5 shadow-sm border border-orange-100/40 active:scale-[0.98] transition-transform cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-xl">
                  {savingsGoal.emoji}
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-800 block">{savingsGoal.title}</span>
                  <span className="text-[11px] text-gray-400">{Math.round(progress)}% 完成</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-800 tracking-tight">¥{savingsGoal.current.toLocaleString()}</span>
                <span className="text-[11px] text-gray-400 block">/ ¥{savingsGoal.target.toLocaleString()}</span>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-300 to-orange-400 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {!savingsGoal && (
          <button
            onClick={() => navigate('/savings')}
            className="w-full bg-white rounded-[24px] p-5 shadow-sm border border-dashed border-orange-200/80 text-center hover:border-orange-300 transition-all group"
          >
            <PiggyBank size={24} className="mx-auto mb-2 text-orange-300 group-hover:text-orange-400 transition-colors" strokeWidth={1.5} />
            <span className="text-sm text-gray-400 group-hover:text-gray-500 font-medium">创建一个攒钱目标吧</span>
          </button>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/moments')}
            className="bg-white rounded-[20px] p-5 shadow-sm border border-orange-100/40 hover:border-orange-200/60 transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <Camera size={20} className="text-rose-400" strokeWidth={1.5} />
            </div>
            <div className="text-[13px] font-semibold text-gray-700">我们的动态</div>
            <div className="text-[11px] text-gray-400 mt-0.5">记录美好时刻</div>
          </button>
          <button
            onClick={() => navigate('/savings')}
            className="bg-white rounded-[20px] p-5 shadow-sm border border-orange-100/40 hover:border-orange-200/60 transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <PiggyBank size={20} className="text-amber-400" strokeWidth={1.5} />
            </div>
            <div className="text-[13px] font-semibold text-gray-700">攒钱计划</div>
            <div className="text-[11px] text-gray-400 mt-0.5">为目标努力</div>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
