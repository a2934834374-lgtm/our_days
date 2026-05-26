import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path: '/', label: '首页', emoji: '🏠' },
  { path: '/moments', label: '动态', emoji: '📸' },
  { path: '/savings', label: '攒钱', emoji: '🐷' },
  { path: '/settings', label: '设置', emoji: '⚙️' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur border-t border-orange-100 z-40">
      <div className="flex justify-around py-2 max-w-lg mx-auto">
        {TABS.map(({ path, label, emoji }) => {
          const active = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                active ? 'text-warm' : 'text-gray-400'
              }`}
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
