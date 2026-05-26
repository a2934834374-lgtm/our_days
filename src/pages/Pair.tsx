import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Heart, Copy, ArrowRight } from 'lucide-react'

export default function Pair() {
  const { user, setPartnerId } = useAuth()
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [inviteCode, setInviteCode] = useState('')
  const [myCode, setMyCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function createInvite() {
    if (!user) return
    setLoading(true)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const randomBytes = crypto.getRandomValues(new Uint8Array(8))
    const code = Array.from(randomBytes, b => chars[b % chars.length]).join('')
    const { error: err } = await supabase.from('invite_codes').insert({
      code,
      created_by: user.id,
    })
    if (err) {
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

    const { error: relErr } = await supabase.from('user_relations').insert({
      user_a: invite.created_by,
      user_b: user.id,
    })

    if (relErr) {
      setError('绑定失败，可能你们已经绑定过了')
    } else {
      await supabase.from('invite_codes').delete().eq('code', code)
      setPartnerId(invite.created_by)
    }
    setLoading(false)
  }

  function copyCode() {
    navigator.clipboard.writeText(myCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      <div className="w-full max-w-sm text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/70 shadow-sm border border-orange-100 mb-6 backdrop-blur">
          <Heart size={36} className="text-rose-400" strokeWidth={1.5} fill="#fecdd3" />
        </div>

        <h1 className="text-[26px] font-semibold tracking-tight text-gray-800 mb-1">绑定另一半</h1>
        <p className="text-sm text-orange-400 font-medium mb-8">绑定后才能看到彼此的动态和心情</p>

        {mode === 'choose' && (
          <div className="space-y-3 w-full">
            <button
              onClick={() => { setMode('create'); createInvite() }}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-400 to-rose-400 text-white font-semibold text-[15px] hover:from-orange-500 hover:to-rose-500 transition-all duration-300 shadow-sm shadow-orange-200/50 active:scale-[0.98]"
            >
              创建邀请码
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-4 rounded-2xl bg-white text-gray-700 font-semibold text-[15px] border border-orange-200/60 hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-300 active:scale-[0.98]"
            >
              输入邀请码
            </button>
          </div>
        )}

        {mode === 'create' && myCode && (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">把邀请码分享给 ta</p>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100/40 mb-4">
              <div className="text-[40px] font-bold tracking-[0.15em] text-gray-800 select-all font-mono">
                {myCode}
              </div>
              <button
                onClick={copyCode}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-orange-400 hover:text-orange-500 transition-colors"
              >
                <Copy size={12} strokeWidth={1.5} />
                {copied ? '已复制 ✓' : '点击复制'}
              </button>
            </div>
            <p className="text-xs text-gray-400">对方输入这个码后自动完成绑定</p>
            <button
              onClick={() => setMode('choose')}
              className="mt-4 text-sm text-gray-400 hover:text-gray-500 transition-colors"
            >
              ← 返回
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="w-full space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100/40">
              <label className="block text-xs font-medium text-gray-400 mb-3">输入 ta 的邀请码</label>
              <input
                type="text"
                placeholder="8 位邀请码"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-4 rounded-xl border border-gray-100 bg-gray-50/50 outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-300 text-center text-xl tracking-[0.2em] font-mono uppercase transition-all"
                maxLength={8}
              />
            </div>
            {error && (
              <p className="text-red-400 text-xs text-center bg-red-50 rounded-xl py-2.5">{error}</p>
            )}
            <button
              onClick={joinWithCode}
              disabled={loading || inviteCode.trim().length < 8}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-400 to-rose-400 text-white font-semibold text-[15px] hover:from-orange-500 hover:to-rose-500 transition-all duration-300 disabled:opacity-50 shadow-sm shadow-orange-200/50 active:scale-[0.98] inline-flex items-center justify-center gap-2"
            >
              {loading ? '绑定中...' : '确认绑定'}
              <ArrowRight size={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => { setMode('choose'); setError('') }}
              className="block mx-auto text-sm text-gray-400 hover:text-gray-500 transition-colors"
            >
              ← 返回
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
