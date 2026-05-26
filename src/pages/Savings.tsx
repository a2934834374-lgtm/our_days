import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { Plus, PiggyBank } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-orange-50/30 to-amber-50/50 pb-20">
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-800">攒钱计划</h1>
          <p className="text-xs text-orange-400 mt-0.5">为目标存下的每一笔</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-orange-400 to-rose-400 text-white px-4 py-2 rounded-full text-sm font-semibold hover:from-orange-500 hover:to-rose-500 transition-all shadow-sm active:scale-95"
        >
          <Plus size={16} strokeWidth={1.5} />
          新建
        </button>
      </div>

      <div className="px-5 space-y-3.5">
        {goals.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4 border border-dashed border-amber-200">
              <PiggyBank size={28} className="text-amber-300" strokeWidth={1.5} />
            </div>
            <p className="text-gray-500 font-medium">还没有攒钱目标</p>
            <p className="text-sm text-gray-400 mt-1">点击右上角创建第一个吧</p>
          </div>
        )}

        {goals.map(goal => {
          const pct = Math.min(goal.current_amount / goal.target_amount * 100, 100)
          return (
            <div
              key={goal.id}
              onClick={() => navigate(`/savings/${goal.id}`)}
              className="bg-white rounded-[24px] p-5 shadow-sm border border-orange-100/40 active:scale-[0.98] transition-transform cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl shrink-0">
                  {goal.cover_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{goal.title}</h3>
                  <p className="text-xs text-gray-400">目标 ¥{goal.target_amount.toLocaleString()}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl font-semibold tracking-tight text-orange-500">{Math.round(pct)}%</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-300 to-orange-400 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[11px] text-gray-400">已存 ¥{goal.current_amount.toLocaleString()}</span>
                <span className="text-[11px] text-gray-400">还差 ¥{(goal.target_amount - goal.current_amount).toLocaleString()}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-t-[28px] p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold tracking-tight text-gray-800 mb-5">新建攒钱目标</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">图标</label>
                <div className="flex gap-2 flex-wrap">
                  {['🐷', '✈️', '🏠', '🚗', '💍', '🎓', '🎮', '📱', '🏖️', '💻'].map(e => (
                    <button key={e} onClick={() => setEmoji(e)}
                      className={`text-2xl p-2 rounded-xl transition-all ${emoji === e ? 'bg-orange-100 scale-110' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >{e}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">名称</label>
                <input
                  type="text" placeholder="如：三亚旅行基金"
                  value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-300 text-[15px] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">目标金额</label>
                <input
                  type="number" placeholder="¥ 5,000"
                  value={target} onChange={e => setTarget(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-300 text-[15px] transition-all"
                />
              </div>
              <button onClick={createGoal} disabled={!title.trim() || !target}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-400 to-rose-400 text-white font-semibold disabled:opacity-50 hover:from-orange-500 hover:to-rose-500 transition-all duration-300 shadow-sm active:scale-[0.98]">
                创建目标
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
