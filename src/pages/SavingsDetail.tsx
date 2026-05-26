import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'
import { ArrowLeft, Plus, TrendingUp } from 'lucide-react'

export default function SavingsDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [goal, setGoal] = useState<any>(null)
  const [contributions, setContributions] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => { if (id) { loadGoal(); loadContributions() } }, [id])

  async function loadGoal() {
    const { data } = await supabase.from('savings_goals').select('*').eq('id', id).single()
    setGoal(data)
  }

  async function loadContributions() {
    const { data } = await supabase.from('savings_contributions').select('*').eq('goal_id', id).order('created_at', { ascending: false })
    setContributions(data || [])
  }

  async function addContribution() {
    if (!amount || !goal) return
    await supabase.from('savings_contributions').insert({
      goal_id: id,
      user_id: user!.id,
      amount: Number(amount),
      note: note || null,
    })
    await supabase.from('savings_goals').update({
      current_amount: goal.current_amount + Number(amount),
    }).eq('id', id)
    setShowAdd(false)
    setAmount('')
    setNote('')
    loadGoal()
    loadContributions()
  }

  if (!goal) return null

  const pct = Math.min(goal.current_amount / goal.target_amount * 100, 100)
  const remaining = goal.target_amount - goal.current_amount

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-orange-50/30 to-amber-50/50 pb-20">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm border border-orange-100/40 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} strokeWidth={1.5} className="text-gray-500" />
        </button>
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{goal.cover_emoji}</span>
          <h1 className="text-xl font-semibold tracking-tight text-gray-800">{goal.title}</h1>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Progress card */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-orange-100/40 text-center">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">当前总额</p>
          <p className="text-[40px] font-semibold tracking-tight text-gray-800">
            ¥{goal.current_amount.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            目标 ¥{goal.target_amount.toLocaleString()} · 还差 ¥{remaining.toLocaleString()}
          </p>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mt-5">
            <div className="h-full bg-gradient-to-r from-amber-300 to-orange-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-400">0</span>
            <span className="text-sm font-semibold text-orange-500">{Math.round(pct)}%</span>
            <span className="text-xs text-gray-400">{Math.round(pct) === 100 ? '🎉 完成!' : ''}</span>
          </div>
        </div>

        {/* Add button */}
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-400 to-rose-400 text-white font-semibold hover:from-orange-500 hover:to-rose-500 transition-all duration-300 shadow-sm shadow-orange-200/50 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Plus size={18} strokeWidth={1.5} />
          我存了一笔
        </button>

        {/* Contributions list */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
            <TrendingUp size={14} strokeWidth={1.5} />
            存款记录
          </h3>
          {contributions.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white rounded-3xl border border-dashed border-orange-100/60">
              <p className="text-sm">还没有存款记录</p>
            </div>
          )}
          <div className="space-y-2">
            {contributions.map(c => (
              <div key={c.id} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-orange-100/20">
                <div>
                  <p className="font-semibold text-green-500">+ ¥{c.amount.toLocaleString()}</p>
                  {c.note && <p className="text-xs text-gray-400 mt-0.5">{c.note}</p>}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(c.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-t-[28px] p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold tracking-tight text-gray-800 mb-5">记录存款</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">金额</label>
                <input
                  type="number" placeholder="¥ 0"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-300 text-xl font-semibold transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">备注（可选）</label>
                <input
                  type="text" placeholder="这周的零花钱"
                  value={note} onChange={e => setNote(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-300 text-[15px] transition-all"
                />
              </div>
              <button onClick={addContribution} disabled={!amount}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-400 to-rose-400 text-white font-semibold disabled:opacity-50 hover:from-orange-500 hover:to-rose-500 transition-all duration-300 shadow-sm active:scale-[0.98]">
                确认存入
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  )
}
