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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-pink-light to-cream">
      <div className="text-6xl mb-4">🏠</div>
      <h1 className="text-3xl font-bold text-warm mb-2">我们的日子</h1>
      <p className="text-gray-500 mb-8 text-sm">属于两个人的小世界</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-orange-200 bg-white outline-none focus:ring-2 focus:ring-warm/30 text-base"
          required
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-orange-200 bg-white outline-none focus:ring-2 focus:ring-warm/30 text-base"
          required
          minLength={6}
        />
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-warm text-white font-semibold text-base hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : isSignUp ? '注册' : '登录'}
        </button>
      </form>

      <button
        onClick={() => { setIsSignUp(!isSignUp); setError('') }}
        className="mt-4 text-warm text-sm underline underline-offset-2"
      >
        {isSignUp ? '已有账号？去登录' : '没有账号？去注册'}
      </button>
    </div>
  )
}
