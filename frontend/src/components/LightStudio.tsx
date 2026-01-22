import { useState, useEffect } from 'react'
import { useLightStudio, LightMode, LightEffect } from '../contexts/LightStudioContext'

export default function LightStudio() {
  const {
    state,
    updateMode,
    updateEffect,
    updateRed,
    updateGreen,
    updateBlue,
    updateColorTemperature,
    updateWhite,
    updateBrightness,
    toggleLight,
  } = useLightStudio()

  const { mode, effect, red, green, blue, colorTemperature, white, brightness, enabled } = state
  
  // Collapsed state - load from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ledControllerCollapsed')
      return saved === 'true'
    }
    return false
  })

  // Save collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ledControllerCollapsed', isCollapsed.toString())
    }
  }, [isCollapsed])

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Prevent page scrolling when touching blank space in the controller
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    // Allow touch events on interactive elements (inputs, buttons) to work normally
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('input') || target.closest('button')) {
      return
    }
    // Prevent scrolling on blank space in the controller
    e.stopPropagation()
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    // Allow touch events on interactive elements (inputs, buttons) to work normally
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('input') || target.closest('button')) {
      return
    }
    // Prevent scrolling when touching blank space in the controller
    e.preventDefault()
    e.stopPropagation()
  }

  const kelvinToLabel = (kelvin: number): string => {
    if (kelvin <= 3000) return 'Very Warm'
    if (kelvin <= 3500) return 'Warm White'
    if (kelvin <= 4100) return 'Neutral White'
    if (kelvin <= 5000) return 'Cool White'
    return 'Very Cool'
  }

  const getEffectLabel = (effect: LightEffect): string => {
    if (effect === 'shift') return 'RGB SCROLL'
    return effect.toUpperCase()
  }

  // Calculate current colour for preview
  const getCurrentColor = () => {
    if (!enabled) return 'rgb(0, 0, 0)'
    if (mode === 'rgb') {
      return `rgb(${red}, ${green}, ${blue})`
    } else if (mode === 'cct') {
      // Simplified - you could calculate actual CCT RGB here
      const temp = colorTemperature / 100
      let r = 255, g = 255, b = 255
      if (temp <= 66) {
        r = 255
        g = Math.max(0, Math.min(255, 99.4708025861 * Math.log(temp) - 161.1195681661))
        b = temp <= 19 ? 0 : Math.max(0, Math.min(255, 138.5177312231 * Math.log(temp - 10) - 305.0447927307))
      } else {
        r = Math.max(0, Math.min(255, 329.698727446 * Math.pow(temp - 60, -0.1332047592)))
        g = Math.max(0, Math.min(255, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)))
        b = 255
      }
      return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
    } else {
      return `rgb(${white}, ${white}, ${white})`
    }
  }

  // If collapsed, show minimized version
  if (isCollapsed) {
    return (
      <div className="fixed bottom-4 right-4 md:bottom-4 md:right-4 bg-[#171717] rounded-xl shadow-2xl p-3 z-50 border border-[#404040] led-controller transition-all hover:border-[#525252]" style={{ filter: 'none' }}>
        <button
          onClick={toggleCollapse}
          className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          aria-label="Show LED Controller"
        >
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" style={{ filter: 'none' }}></div>
          <span className="text-sm font-bold tracking-wide">LED Controller</span>
          <span className="text-xs text-gray-400">(Click to show)</span>
        </button>
      </div>
    )
  }

  return (
    <div 
      className="fixed bottom-4 right-4 bg-[#171717] rounded-xl shadow-2xl p-4 md:p-5 w-[calc(100vw-2rem)] max-w-96 z-50 border border-[#404040] led-controller transition-all" 
      style={{ filter: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* LED Controller Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#404040]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" style={{ filter: 'none' }}></div>
          <h3 className="text-base md:text-lg font-bold text-white tracking-wide">LED CONTROLLER</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCollapse}
            className="px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all bg-[#404040] text-gray-300 hover:bg-[#525252] hover:text-white border border-[#525252]"
            aria-label="Hide Controller"
          >
            Hide
          </button>
          <button
            onClick={toggleLight}
            className={`px-4 md:px-6 py-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
              enabled
                ? 'bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-500/50'
                : 'bg-[#404040] text-[#a3a3a3] hover:bg-[#525252]'
            }`}
            style={{ filter: 'none' }}
          >
            {enabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* LED Strip Preview */}
      <div className="mb-4 p-3 bg-[#0a0a0a] rounded-lg border border-[#262626]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500 font-mono">LED STRIP</span>
          <div className="flex-1 h-1 bg-[#262626] rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: '100%',
                background: enabled
                  ? `linear-gradient(to right, ${getCurrentColor()}, ${getCurrentColor()})`
                  : 'transparent',
                opacity: enabled ? brightness / 100 : 0,
                boxShadow: enabled ? `0 0 20px ${getCurrentColor()}` : 'none',
              }}
            />
          </div>
        </div>
        <div className="text-xs text-gray-400 font-mono">
          {enabled ? `RGB(${red}, ${green}, ${blue}) | ${brightness}%` : 'OFFLINE'}
        </div>
      </div>

      {enabled && (
        <div className="space-y-4">
          {/* Effect Selector */}
          <div className="pb-3 border-b border-gray-700">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 block">
              EFFECT
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['static', 'pulse', 'shift', 'breathe'] as LightEffect[]).map((e) => (
                <button
                  key={e}
                  onClick={() => updateEffect(e)}
                  className={`py-2 px-3 rounded-md text-xs font-bold uppercase transition-all ${
                    effect === e
                      ? 'bg-white text-black shadow-lg'
                      : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {getEffectLabel(e)}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-2 p-1 bg-gray-800 rounded-lg">
            {(['rgb', 'cct', 'white'] as LightMode[]).map((m) => (
              <button
                key={m}
                onClick={() => updateMode(m)}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-bold uppercase transition-all ${
                  mode === m
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* RGB Mode */}
          {mode === 'rgb' && (
            <div className="space-y-3">
              <div className="slider-container">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-red-500 uppercase tracking-wide" style={{ filter: 'none', color: '#ef4444' }}>RED</label>
                  <span className="text-xs text-gray-400 font-mono">{red}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={red}
                  onChange={(e) => updateRed(Number(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-black via-red-500 to-red-500 rounded-lg appearance-none cursor-pointer slider-red"
                />
              </div>
              <div className="slider-container">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-green-500 uppercase tracking-wide" style={{ filter: 'none', color: '#22c55e' }}>GREEN</label>
                  <span className="text-xs text-gray-400 font-mono">{green}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={green}
                  onChange={(e) => updateGreen(Number(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-black via-green-500 to-green-500 rounded-lg appearance-none cursor-pointer slider-green"
                />
              </div>
              <div className="slider-container">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-blue-500 uppercase tracking-wide" style={{ filter: 'none', color: '#3b82f6' }}>BLUE</label>
                  <span className="text-xs text-gray-400 font-mono">{blue}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={blue}
                  onChange={(e) => updateBlue(Number(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-black via-blue-500 to-blue-500 rounded-lg appearance-none cursor-pointer slider-blue"
                />
              </div>
            </div>
          )}

          {/* CCT Mode */}
          {mode === 'cct' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-yellow-400 uppercase tracking-wide">
                  COLOR TEMP: {kelvinToLabel(colorTemperature)} ({colorTemperature}K)
                </label>
              </div>
              <div className="relative slider-container">
                <input
                  type="range"
                  min="2700"
                  max="6500"
                  step="100"
                  value={colorTemperature}
                  onChange={(e) => updateColorTemperature(Number(e.target.value))}
                  className="w-full h-3 bg-gradient-to-r from-orange-500 via-yellow-300 to-blue-300 rounded-lg appearance-none cursor-pointer slider-cct"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>2700K</span>
                  <span>6500K</span>
                </div>
              </div>
            </div>
          )}

          {/* White Mode */}
          {mode === 'white' && (
            <div className="slider-container">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">WHITE</label>
                <span className="text-xs text-gray-400 font-mono">{white}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={white}
                onChange={(e) => updateWhite(Number(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-black via-gray-400 to-white rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {/* Brightness Slider */}
          <div className="pt-3 border-t border-gray-700 slider-container">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">BRIGHTNESS</label>
              <span className="text-xs text-gray-400 font-mono">{brightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={brightness}
              onChange={(e) => updateBrightness(Number(e.target.value))}
              className="w-full h-2 bg-gradient-to-r from-black via-gray-600 to-white rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  )
}

