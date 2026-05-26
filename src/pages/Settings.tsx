import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'
import { User, LogOut, Check } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-orange-50/30 to-amber-50/50 pb-20">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-800">设置</h1>
        <p className="text-xs text-orange-400 mt-0.5">账号与偏好</p>
      </div>

      <div className="px-5 space-y-4">
        {/* Profile section */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-orange-100/40">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-300 to-rose-400 flex items-center justify-center text-white text-lg font-semibold shadow-sm">
              <User size={22} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{nickname || user?.email?.split('@')[0] || '用户'}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">昵称</label>
            <div className="flex gap-2">
              <input
                type="text" placeholder="你的昵称"
                value={nickname} onChange={e => setNickname(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-300 text-[15px] transition-all"
              />
              <button
                onClick={updateNickname}
                disabled={!nickname.trim()}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                  saved
                    ? 'bg-green-50 text-green-500 border border-green-200'
                    : 'bg-gradient-to-r from-orange-400 to-rose-400 text-white hover:from-orange-500 hover:to-rose-500 shadow-sm active:scale-95'
                }`}
              >
                {saved ? <><Check size={14} strokeWidth={2} /> 已保存</> : '保存'}
              </button>
            </div>
          </div>
        </div>

        {/* Version info */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-orange-100/40">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">关于</h3>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-500">版本</span>
            <span className="text-sm text-gray-400 font-medium">v1.0.0</span>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-gray-50">
            <span className="text-sm text-gray-500">我们的日子</span>
            <span className="text-sm text-gray-400">两个人的小世界</span>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full py-4 rounded-2xl bg-white text-red-400 font-semibold border border-red-200/60 hover:bg-red-50 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
        >
          <LogOut size={18} strokeWidth={1.5} />
          退出登录
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
