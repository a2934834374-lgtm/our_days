import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'
import type { Moment } from '../types'

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
      // fetch profiles separately for display names
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
    <div className="min-h-screen bg-cream pb-20">
      <div className="px-5 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-warm">我们的动态 📸</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-warm text-white w-10 h-10 rounded-full text-xl font-bold shadow-lg hover:bg-orange-600 transition-colors"
        >
          +
        </button>
      </div>

      <div className="px-5 space-y-4">
        {moments.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📸</div>
            <p>还没有动态</p>
            <p className="text-sm">发一条吧～</p>
          </div>
        )}

        {moments.map(m => (
          <div key={m.id} className="bg-white rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink to-warm flex items-center justify-center text-white text-xs font-semibold">
                {(m.nickname || '?')[0]}
              </div>
              <span className="text-sm font-semibold text-gray-700">{m.nickname || '我'}</span>
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(m.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-gray-700 leading-relaxed">{m.content}</p>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800 mb-4">发一条动态</h2>
            <textarea
              placeholder="今天想说什么..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-orange-200 outline-none focus:ring-2 focus:ring-warm/30 text-base resize-none"
              rows={4}
              autoFocus
            />
            <button
              onClick={createMoment}
              disabled={loading || !content.trim()}
              className="w-full mt-3 py-3 rounded-xl bg-warm text-white font-semibold disabled:opacity-50 hover:bg-orange-600 transition-colors"
            >
              {loading ? '发送中...' : '发送'}
            </button>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  )
}
