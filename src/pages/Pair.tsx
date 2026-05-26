import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Pair() {
  const { user, setPartnerId } = useAuth()
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [inviteCode, setInviteCode] = useState('')
  const [myCode, setMyCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function createInvite() {
    if (!user) return
    setLoading(true)
    // generate random 8-char code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const randomBytes = crypto.getRandomValues(new Uint8Array(8))
    const code = Array.from(randomBytes, b => chars[b % chars.length]).join('')
    const { error: err } = await supabase.from('invite_codes').insert({
      code,
      created_by: user.id,
    })
    if (err) {
      // might already exist, try to fetch
      const { data } = await supabase.from('invite_codes').select('code').eq('created_by', user.id).single()
      if (data) setMyCode(data.code)
    } else {
      setMyCode(code)
    }
    setLoading(false)
  }

  async function joinWithCode() {
    if (!user || !inviteCode.trim()) return
    setLoading(true)
    setError('')

    const code = inviteCode.trim().toUpperCase()

    // find the invite
    const { data: invite, error: inviteErr } = await supabase
      .from('invite_codes')
      .select('created_by')
      .eq('code', code)
      .maybeSingle()

    if (inviteErr || !invite) {
      setError('邀请码不存在，检查一下是不是输错了～')
      setLoading(false)
      return
    }

    if (invite.created_by === user.id) {
      setError('这是你自己的邀请码哦～')
      setLoading(false)
      return
    }

    // create relation
    const { error: relErr } = await supabase.from('user_relations').insert({
      user_a: invite.created_by,
      user_b: user.id,
    })

    if (relErr) {
      setError('绑定失败，可能你们已经绑定过了')
    } else {
      // clean up invite code
      await supabase.from('invite_codes').delete().eq('code', code)
      setPartnerId(invite.created_by)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-pink-light to-cream">
      <div className="text-5xl mb-4">💑</div>
      <h1 className="text-2xl font-bold text-warm mb-1">绑定另一半</h1>
      <p className="text-gray-400 text-sm mb-8">两个人绑定后才能看到彼此的内容</p>

      {mode === 'choose' && (
        <div className="space-y-4 w-full max-w-sm">
          <button
            onClick={() => { setMode('create'); createInvite() }}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-warm text-white font-semibold text-lg hover:bg-orange-600 transition-colors"
          >
            创建邀请码
          </button>
          <button
            onClick={() => setMode('join')}
            className="w-full py-4 rounded-2xl bg-white text-warm font-semibold text-lg border-2 border-warm hover:bg-orange-50 transition-colors"
          >
            输入邀请码
          </button>
        </div>
      )}

      {mode === 'create' && myCode && (
        <div className="text-center">
          <p className="text-gray-500 mb-2">把下面这个码发给ta</p>
          <div className="text-4xl font-bold tracking-[0.3em] text-warm bg-white rounded-2xl px-8 py-4 border-2 border-dashed border-warm select-all">
            {myCode}
          </div>
          <p className="text-gray-400 text-xs mt-4">等对方输入这个码之后，自动完成绑定</p>
        </div>
      )}

      {mode === 'join' && (
        <div className="w-full max-w-sm space-y-4">
          <input
            type="text"
            placeholder="输入邀请码"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-orange-200 bg-white outline-none focus:ring-2 focus:ring-warm/30 text-center text-xl tracking-widest uppercase"
            maxLength={10}
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            onClick={joinWithCode}
            disabled={loading || !inviteCode.trim()}
            className="w-full py-3 rounded-2xl bg-warm text-white font-semibold text-base hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {loading ? '绑定中...' : '绑定'}
          </button>
        </div>
      )}
    </div>
  )
}
