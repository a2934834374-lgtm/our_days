import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'

export default function Settings() {
  const { user, signOut } = useAuth()
  const [nickname, setNickname] = useState('')
  const [saved, setSaved] = useState(false)

  async function updateNickname() {
    if (!nickname.trim() || !user) return
    const { data: existing } = await supabase.from('profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (existing) {
      await supabase.from('profiles').update({ nickname: nickname.trim() }).eq('user_id', user.id)
    } else {
      await supabase.from('profiles').insert({ user_id: user.id, nickname: nickname.trim() })
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-warm">设置 ⚙️</h1>
      </div>

      <div className="px-5 space-y-4">
        {/* Nickname */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">设置昵称</h3>
          <div className="flex gap-2">
            <input
              type="text" placeholder="你的昵称"
              value={nickname} onChange={e => setNickname(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl border border-orange-200 outline-none focus:ring-2 focus:ring-warm/30"
            />
            <button
              onClick={updateNickname}
              className="px-4 py-2 rounded-xl bg-warm text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              {saved ? '已保存 ✅' : '保存'}
            </button>
          </div>
        </div>

        {/* User info */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">账号信息</h3>
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full py-4 rounded-2xl bg-white text-red-400 font-semibold border border-red-200 hover:bg-red-50 transition-colors"
        >
          退出登录
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
