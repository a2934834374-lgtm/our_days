import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'
import type { Moment } from '../types'
import { Plus, Camera } from 'lucide-react'

export default function Moments() {
  const { user, partnerId } = useAuth()
  const [moments, setMoments] = useState<(Moment & { nickname?: string })[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (user) loadMoments() }, [user])

  async function loadMoments() {
    const ids = [user!.id, partnerId].filter(Boolean) as string[]
    const { data } = await supabase
      .from('moments')
      .select('*')
      .in('user_id', ids)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(m => m.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nickname')
        .in('user_id', userIds)

      const nickMap: Record<string, string> = {}
      profiles?.forEach(p => { nickMap[p.user_id] = p.nickname })

      setMoments(data.map(m => ({
        ...m,
        nickname: nickMap[m.user_id] || (m.user_id === user!.id ? '我' : 'ta'),
      })))
    } else {
      setMoments([])
    }
  }

  async function createMoment() {
    if (!content.trim()) return
    setLoading(true)
    await supabase.from('moments').insert({
      user_id: user!.id,
      content: content.trim(),
      image_urls: [],
    })
    setContent('')
    setShowCreate(false)
    setLoading(false)
    loadMoments()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-orange-50/30 to-amber-50/50 pb-20">
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-800">我们的动态</h1>
          <p className="text-xs text-orange-400 mt-0.5">记录每一个瞬间</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="w-11 h-11 rounded-2xl bg-gradient-to-r from-orange-400 to-rose-400 text-white shadow-sm shadow-orange-200/50 flex items-center justify-center hover:from-orange-500 hover:to-rose-500 transition-all active:scale-95"
        >
          <Plus size={22} strokeWidth={2} />
        </button>
      </div>

      <div className="px-5 space-y-5">
        {moments.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4 border border-dashed border-rose-200">
              <Camera size={28} className="text-rose-300" strokeWidth={1.5} />
            </div>
            <p className="text-gray-500 font-medium">还没有动态</p>
            <p className="text-sm text-gray-400 mt-1">点击右上角发第一条吧</p>
          </div>
        )}

        {moments.map(m => (
          <div key={m.id} className="bg-white rounded-[24px] p-6 shadow-sm border border-orange-100/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-rose-400 flex items-center justify-center text-white text-sm font-semibold shadow-sm shrink-0">
                {(m.nickname || '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-sm font-semibold text-gray-700">{m.nickname || '我'}</span>
                <p className="text-[11px] text-gray-400 font-medium">
                  {new Date(m.created_at).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed text-[15px]">{m.content}</p>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-t-[28px] p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold tracking-tight text-gray-800 mb-5">发一条动态</h2>
            <textarea
              placeholder="今天想说什么..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-300 text-[15px] resize-none transition-all"
              rows={4}
              autoFocus
            />
            <button
              onClick={createMoment}
              disabled={loading || !content.trim()}
              className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-orange-400 to-rose-400 text-white font-semibold disabled:opacity-50 hover:from-orange-500 hover:to-rose-500 transition-all duration-300 shadow-sm active:scale-[0.98]"
            >
              {loading ? '发送中...' : '发布'}
            </button>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  )
}
