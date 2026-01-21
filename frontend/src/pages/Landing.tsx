import { Link } from 'wouter'
import { useLightStudio } from '../contexts/LightStudioContext'
import WireframeBackground from '../components/WireframeBackground'

export default function Landing() {
  const { state } = useLightStudio()
  const { enabled } = state

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-[#0a0a0a] pt-20 pb-32 overflow-hidden">
        {/* Wireframe background */}
        <WireframeBackground />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Headline */}
            <h1 className="text-8xl md:text-9xl font-bold mb-8 tracking-tighter text-white leading-none">
              <span className={enabled ? 'led-text-glow' : ''}>
                EFX
              </span>
              <span className="block text-6xl md:text-7xl font-light text-[#737373] mt-2 tracking-wider">
                LED Shop
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-2xl md:text-3xl text-[#d4d4d4] mb-6 font-light tracking-wide max-w-3xl mx-auto leading-relaxed">
              Custom LED strips and accessories
              <span className="block text-xl md:text-2xl text-[#a3a3a3] mt-2">
                for electrical contractors
              </span>
            </p>
            
            {/* Description */}
            <p className="text-base text-[#737373] mb-12 font-light max-w-2xl mx-auto leading-relaxed">
              Professional-grade LED solutions tailored to your project needs. 
              Cut to any length, smart driver matching, and expert support.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <Link href="/order">
                <button className={`w-full sm:w-auto bg-[#f5f5f5] text-[#171717] px-10 py-4 text-sm font-medium tracking-wide hover:bg-[#e5e5e5] transition-all uppercase ${enabled ? 'led-strip-glow' : ''}`}>
                  Start Custom Order
                </button>
              </Link>
              <Link href="/products">
                <button className="w-full sm:w-auto bg-transparent text-[#f5f5f5] px-10 py-4 text-sm font-medium tracking-wide hover:bg-[#171717] border-2 border-[#404040] hover:border-[#525252] transition-all uppercase">
                  Browse Products
                </button>
              </Link>
            </div>
            
            {/* Stats or Trust Indicators */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12 border-t border-[#262626]">
              <div>
                <div className="text-3xl font-bold text-white mb-1">100%</div>
                <div className="text-xs text-[#737373] uppercase tracking-wider">Custom</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">Same Day</div>
                <div className="text-xs text-[#737373] uppercase tracking-wider">Available</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">Pick Up</div>
                <div className="text-xs text-[#737373] uppercase tracking-wider">Only</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-32 bg-[#171717]">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className={`border border-[#262626] p-12 md:p-16 ${enabled ? 'led-strip-glow' : ''}`}>
              <div className="mb-8">
                <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white tracking-tight">
                  About Us
                </h2>
                <div className="w-24 h-1 bg-[#404040]"></div>
              </div>
              
              <div className="space-y-6 text-[#d4d4d4] leading-relaxed">
                <p className="text-lg font-light">
                  EFX LED Shop was founded by electrical contractors who understand the challenges of sourcing quality LED solutions for commercial and residential projects.
                </p>
                <p className="text-base text-[#a3a3a3] font-light">
                  We've built a platform that eliminates the guesswork from LED strip selection. Our intelligent system matches your project requirements with the perfect driver, ensuring optimal performance and efficiency.
                </p>
                <p className="text-base text-[#a3a3a3] font-light">
                  Every order is custom-cut to your exact specifications. No minimum orders, no waste. Just professional-grade LED solutions delivered when you need them.
                </p>
              </div>
              
              <div className="mt-12 pt-12 border-t border-[#262626]">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Our Mission</h3>
                    <p className="text-[#a3a3a3] text-sm font-light leading-relaxed">
                      To provide electrical contractors with the tools and support they need to deliver exceptional lighting installations, every time.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Our Values</h3>
                    <p className="text-[#a3a3a3] text-sm font-light leading-relaxed">
                      Quality, precision, and reliability. We stand behind every product and every recommendation we make.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-[#0a0a0a]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-white tracking-tight">Why Choose EFX</h2>
            <p className="text-[#737373] font-light max-w-2xl mx-auto">
              Everything you need for professional LED installations
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className={`border border-[#262626] p-8 hover:border-[#404040] transition-colors ${enabled ? 'led-strip-glow' : ''}`}>
              <div className="text-4xl mb-6 font-light text-[#737373]">01</div>
              <h3 className="text-2xl font-semibold mb-4 text-white">Custom Lengths</h3>
              <p className="text-[#a3a3a3] text-sm font-light leading-relaxed">
                Cut to any length you need. No minimum orders, perfect for any project size. We handle everything from small residential jobs to large commercial installations.
              </p>
            </div>
            <div className={`border border-[#262626] p-8 hover:border-[#404040] transition-colors ${enabled ? 'led-strip-glow' : ''}`}>
              <div className="text-4xl mb-6 font-light text-[#737373]">02</div>
              <h3 className="text-2xl font-semibold mb-4 text-white">Smart Driver Matching</h3>
              <p className="text-[#a3a3a3] text-sm font-light leading-relaxed">
                Automatic driver recommendations based on your LED configuration and power requirements. Our system ensures optimal performance and efficiency.
              </p>
            </div>
            <div className={`border border-[#262626] p-8 hover:border-[#404040] transition-colors ${enabled ? 'led-strip-glow' : ''}`}>
              <div className="text-4xl mb-6 font-light text-[#737373]">03</div>
              <h3 className="text-2xl font-semibold mb-4 text-white">Expert Support</h3>
              <p className="text-[#a3a3a3] text-sm font-light leading-relaxed">
                Built by contractors, for contractors. We understand your workflow and are here to help with technical questions and project planning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Preview Section */}
      <section className="py-32 bg-[#171717]">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-6 text-white tracking-tight">Our Products</h2>
            <p className="text-[#a3a3a3] font-light mb-12 text-lg max-w-2xl mx-auto">
              Browse our comprehensive range of LED solutions, from indoor applications to full weatherproof outdoor installations.
            </p>
            <Link href="/products">
              <button className={`bg-[#f5f5f5] text-[#171717] px-12 py-4 text-sm font-medium tracking-wide hover:bg-[#e5e5e5] transition-all uppercase ${enabled ? 'led-strip-glow' : ''}`}>
                View All Products
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-[#0a0a0a] relative overflow-hidden">
        {/* Subtle background accent */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(45deg, transparent 30%, white 30%, white 50%, transparent 50%, transparent 80%, white 80%, white 100%)',
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-6xl font-bold mb-8 text-white tracking-tight">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-[#a3a3a3] mb-12 font-light max-w-2xl mx-auto leading-relaxed">
              Create your custom LED order in minutes. Our streamlined process makes it easy to get exactly what you need for your project.
            </p>
            <Link href="/order">
              <button className={`bg-[#f5f5f5] text-[#171717] px-16 py-5 text-sm font-medium tracking-wide hover:bg-[#e5e5e5] transition-all uppercase ${enabled ? 'led-strip-glow' : ''}`}>
                Create Custom Order
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

