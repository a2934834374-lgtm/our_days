import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Camera, PiggyBank, Settings } from 'lucide-react'

const TABS = [
  { path: '/', label: '首页', Icon: Home },
  { path: '/moments', label: '动态', Icon: Camera },
  { path: '/savings', label: '攒钱', Icon: PiggyBank },
  { path: '/settings', label: '设置', Icon: Settings },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-3 left-0 right-0 z-40 px-4">
      <div className="max-w-lg mx-auto bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-orange-100/60 px-2 py-1.5">
        <div className="flex justify-around">
          {TABS.map(({ path, label, Icon }) => {
            const active = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] ${
                  active
                    ? 'text-orange-500'
                    : 'text-gray-400 hover:text-gray-500'
                }`}
              >
                {active && (
                  <div className="absolute top-0 w-8 h-0.5 bg-orange-400 rounded-full -mt-0.5" />
                )}
                <Icon size={22} strokeWidth={active ? 2 : 1.5} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
