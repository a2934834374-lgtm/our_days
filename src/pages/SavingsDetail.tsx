import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'

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

  return (
    <div className="min-h-screen bg-cream pb-20">
      <div className="px-5 pt-8 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-xl">←</button>
        <h1 className="text-xl font-bold text-gray-800">{goal.cover_emoji} {goal.title}</h1>
      </div>

      <div className="px-5 space-y-5">
        {/* Progress card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm text-center">
          <p className="text-4xl font-bold text-warm">
            ¥{goal.current_amount.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">目标 ¥{goal.target_amount.toLocaleString()}</p>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-gradient-to-r from-amber to-warm rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{Math.round(pct)}% 完成</p>
        </div>

        {/* Add button */}
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3 rounded-2xl bg-warm text-white font-semibold hover:bg-orange-600 transition-colors"
        >
          + 我存了一笔
        </button>

        {/* Contributions list */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">存款记录</h3>
          {contributions.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">还没有存款记录</p>
          )}
          <div className="space-y-2">
            {contributions.map(c => (
              <div key={c.id} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-semibold text-green-500">+¥{c.amount.toLocaleString()}</p>
                  {c.note && <p className="text-xs text-gray-400">{c.note}</p>}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(c.created_at).toLocaleDateString('zh-CN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800 mb-4">记录存款</h2>
            <div className="space-y-3">
              <input
                type="number" placeholder="金额"
                value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-orange-200 outline-none focus:ring-2 focus:ring-warm/30 text-lg"
                autoFocus
              />
              <input
                type="text" placeholder="备注（可选）"
                value={note} onChange={e => setNote(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-orange-200 outline-none focus:ring-2 focus:ring-warm/30"
              />
              <button onClick={addContribution} disabled={!amount}
                className="w-full py-3 rounded-xl bg-warm text-white font-semibold disabled:opacity-50 hover:bg-orange-600 transition-colors">
                确认
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  )
}
