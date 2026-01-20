import { Link } from 'wouter'
import UserMenu from './UserMenu'
import { useLightStudio } from '../contexts/LightStudioContext'

export default function Header() {
  const { state } = useLightStudio()
  const { enabled } = state
  
  return (
    <header className="bg-[#0a0a0a] border-b border-[#262626] sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center space-x-3">
            <div className={`text-3xl font-bold tracking-tight text-white ${enabled ? 'led-text-glow' : ''}`}>EFX</div>
            <div className="text-sm text-[#737373] font-light">LED Shop</div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-[#d4d4d4] hover:text-white font-medium text-sm tracking-wide transition-colors">
              Products
            </Link>
            <Link href="/order" className="text-gray-300 hover:text-white font-medium text-sm tracking-wide transition-colors">
              Order
            </Link>
            <Link href="/orders" className="text-gray-300 hover:text-white font-medium text-sm tracking-wide transition-colors">
              My Orders
            </Link>
            <Link href="/points-shop" className="text-gray-300 hover:text-white font-medium text-sm tracking-wide transition-colors">
              Points Shop
            </Link>
            <Link href="/leaderboard" className="text-gray-300 hover:text-white font-medium text-sm tracking-wide transition-colors">
              Leaderboard
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  )
}

