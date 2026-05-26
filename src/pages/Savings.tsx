import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'

export default function Savings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [goals, setGoals] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [emoji, setEmoji] = useState('🐷')

  useEffect(() => { if (user) loadGoals() }, [user])

  async function loadGoals() {
    const { data } = await supabase.from('savings_goals').select('*').order('created_at', { ascending: false })
    setGoals(data || [])
  }

  async function createGoal() {
    if (!title.trim() || !target) return
    await supabase.from('savings_goals').insert({
      created_by: user!.id,
      title: title.trim(),
      target_amount: Number(target),
      current_amount: 0,
      cover_emoji: emoji,
    })
    setShowCreate(false)
    setTitle('')
    setTarget('')
    setEmoji('🐷')
    loadGoals()
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <div className="px-5 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-warm">攒钱计划 🐷</h1>
        <button onClick={() => setShowCreate(true)} className="bg-warm text-white px-4 py-2 rounded-full text-sm font-semibold">
          + 新建
        </button>
      </div>

      <div className="px-5 space-y-4">
        {goals.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🐷</div>
            <p>还没有攒钱目标</p>
            <p className="text-sm">创建第一个吧～</p>
          </div>
        )}

        {goals.map(goal => {
          const pct = Math.min(goal.current_amount / goal.target_amount * 100, 100)
          return (
            <div
              key={goal.id}
              onClick={() => navigate(`/savings/${goal.id}`)}
              className="bg-white rounded-3xl p-5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{goal.cover_emoji}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{goal.title}</h3>
                  <p className="text-xs text-gray-400">目标 ¥{goal.target_amount.toLocaleString()}</p>
                </div>
                <span className="text-lg font-bold text-warm">{Math.round(pct)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber to-warm rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800 mb-4">新建攒钱目标</h2>
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <span className="text-2xl">{emoji}</span>
                <div className="flex gap-1 flex-wrap">
                  {['🐷', '✈️', '🏠', '🚗', '💍', '🎓', '🎮', '📱'].map(e => (
                    <button key={e} onClick={() => setEmoji(e)} className={`text-xl p-1 rounded-lg ${emoji === e ? 'bg-orange-100' : ''}`}>{e}</button>
                  ))}
                </div>
              </div>
              <input
                type="text" placeholder="目标名称，如：三亚旅行"
                value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-orange-200 outline-none focus:ring-2 focus:ring-warm/30"
              />
              <input
                type="number" placeholder="目标金额"
                value={target} onChange={e => setTarget(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-orange-200 outline-none focus:ring-2 focus:ring-warm/30"
              />
              <button onClick={createGoal} disabled={!title.trim() || !target}
                className="w-full py-3 rounded-xl bg-warm text-white font-semibold disabled:opacity-50 hover:bg-orange-600 transition-colors">
                创建
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  )
}
