import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = isSignUp ? await signUp(email, password) : await signIn(email, password)
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/70 shadow-sm border border-orange-100 mb-5 backdrop-blur">
            <span className="text-4xl">🏠</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-gray-800 mb-1">我们的日子</h1>
          <p className="text-sm text-orange-400 font-medium">属于两个人的小世界</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100/60">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">邮箱</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-300 text-[15px] transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">密码</label>
              <input
                type="password"
                placeholder="至少 6 位"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-300 text-[15px] transition-all"
                required
                minLength={6}
              />
            </div>
            {error && (
              <p className="text-red-400 text-xs text-center bg-red-50 rounded-xl py-2.5">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-400 to-rose-400 text-white font-semibold text-[15px] hover:from-orange-500 hover:to-rose-500 transition-all duration-300 disabled:opacity-50 shadow-sm shadow-orange-200/50 active:scale-[0.98]"
            >
              {loading ? '请稍候...' : isSignUp ? '创建账号' : '登录'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-50 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError('') }}
              className="text-sm text-orange-400 hover:text-orange-500 font-medium transition-colors"
            >
              {isSignUp ? '已有账号？去登录 →' : '还没有账号？去注册 →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
