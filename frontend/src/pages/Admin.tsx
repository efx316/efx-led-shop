import { Link } from 'wouter'
import { useLightStudio } from '../contexts/LightStudioContext'

export default function Admin() {
  const { state } = useLightStudio()
  const { enabled } = state

  const adminSections = [
    {
      title: 'Categories',
      description: 'Manage product categories and sync from Square',
      href: '/admin/categories',
      icon: '📁',
    },
    {
      title: 'Products',
      description: 'Assign products to categories',
      href: '/admin/product-categories',
      icon: '🔗',
    },
    {
      title: 'Orders',
      description: 'Manage and approve customer orders',
      href: '/admin/orders',
      icon: '📦',
    },
    {
      title: 'Users',
      description: 'Manage user accounts and permissions',
      href: '/admin/users',
      icon: '👥',
    },
    {
      title: 'Points Shop',
      description: 'Manage merchandise and items in the points shop',
      href: '/admin/points-shop',
      icon: '🛍️',
    },
  ]

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-5xl font-bold mb-4 text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-[#a3a3a3] font-light text-lg">Manage your store and products</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className={`block bg-[#0a0a0a] border-2 border-[#262626] p-8 rounded-lg hover:border-[#525252] transition-all group ${enabled ? 'led-strip-glow' : ''}`}
          >
            <div className="text-5xl mb-4">{section.icon}</div>
            <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-[#e5e5e5] transition-colors">
              {section.title}
            </h2>
            <p className="text-[#a3a3a3] text-sm font-light">
              {section.description}
            </p>
            <div className="mt-4 text-[#737373] text-sm font-medium group-hover:text-[#a3a3a3] transition-colors">
              Go to {section.title} →
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
