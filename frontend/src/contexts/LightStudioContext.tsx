import { createContext, useContext, useState, useEffect, useLayoutEffect, ReactNode } from 'react'

export type LightMode = 'rgb' | 'cct' | 'white'
export type LightEffect = 'static' | 'pulse' | 'shift' | 'breathe'

interface LightStudioState {
  mode: LightMode
  effect: LightEffect
  // RGB mode
  red: number // 0-255
  green: number // 0-255
  blue: number // 0-255
  // CCT mode
  colorTemperature: number // 2700K (warm) to 6500K (cool)
  // White mode
  white: number // 0-255
  brightness: number // 0-100
  enabled: boolean
}

interface LightStudioContextType {
  state: LightStudioState
  updateMode: (mode: LightMode) => void
  updateEffect: (effect: LightEffect) => void
  updateRed: (red: number) => void
  updateGreen: (green: number) => void
  updateBlue: (blue: number) => void
  updateColorTemperature: (kelvin: number) => void
  updateWhite: (white: number) => void
  updateBrightness: (brightness: number) => void
  toggleLight: () => void
  updateRGB: (red: number, green: number, blue: number) => void
}

const LightStudioContext = createContext<LightStudioContextType | undefined>(undefined)

export function useLightStudio() {
  const context = useContext(LightStudioContext)
  if (!context) {
    throw new Error('useLightStudio must be used within LightStudioProvider')
  }
  return context
}

// Helper function to convert Kelvin to RGB
const kelvinToRGB = (kelvin: number): { r: number; g: number; b: number } => {
  const temp = kelvin / 100
  
  let r: number, g: number, b: number

  if (temp <= 66) {
    r = 255
    g = temp
    g = 99.4708025861 * Math.log(g) - 161.1195681661
    if (temp <= 19) {
      b = 0
    } else {
      b = temp - 10
      b = 138.5177312231 * Math.log(b) - 305.0447927307
    }
  } else {
    r = temp - 60
    r = 329.698727446 * Math.pow(r, -0.1332047592)
    g = temp - 60
    g = 288.1221695283 * Math.pow(g, -0.0755148492)
    b = 255
  }

  return {
    r: Math.max(0, Math.min(255, Math.round(r))),
    g: Math.max(0, Math.min(255, Math.round(g))),
    b: Math.max(0, Math.min(255, Math.round(b))),
  }
}

// Apply theme function
const applyLightTheme = (lightState: LightStudioState) => {
  const root = document.documentElement
  const body = document.body
  
  if (!lightState.enabled) {
    root.style.setProperty('--led-r', '255')
    root.style.setProperty('--led-g', '255')
    root.style.setProperty('--led-b', '255')
    root.style.setProperty('--led-brightness', '1')
    root.style.setProperty('--led-color', 'rgb(255, 255, 255)')
    root.style.setProperty('--glow-small', '0')
    root.style.setProperty('--glow-medium', '0')
    root.style.setProperty('--glow-large', '0')
    root.style.setProperty('--glow-inset', '0')
    body.classList.remove('light-studio-enabled')
    // Remove all effect classes
    body.classList.remove('led-effect-static', 'led-effect-pulse', 'led-effect-shift', 'led-effect-breathe')
    return
  }

  // Calculate RGB based on mode
  let r: number, g: number, b: number

  if (lightState.mode === 'rgb') {
    r = lightState.red
    g = lightState.green
    b = lightState.blue
  } else if (lightState.mode === 'cct') {
    const rgb = kelvinToRGB(lightState.colorTemperature)
    r = rgb.r
    g = rgb.g
    b = rgb.b
  } else {
    // White mode
    r = lightState.white
    g = lightState.white
    b = lightState.white
  }
  
  // Apply brightness
  const brightness = lightState.brightness / 100
  
  // Calculate glow sizes based on brightness (store as unitless numbers for CSS calc)
  const glowSmall = 20 * brightness
  const glowMedium = 40 * brightness
  const glowLarge = 60 * brightness
  const glowInset = 15 * brightness
  
  // Set RGB values as separate variables for CSS compatibility
  root.style.setProperty('--led-r', r.toString())
  root.style.setProperty('--led-g', g.toString())
  root.style.setProperty('--led-b', b.toString())
  root.style.setProperty('--led-brightness', brightness.toString())
  root.style.setProperty('--led-color', `rgb(${r}, ${g}, ${b})`)
  // Store as unitless numbers so CSS calc() can multiply them
  root.style.setProperty('--glow-small', glowSmall.toString())
  root.style.setProperty('--glow-medium', glowMedium.toString())
  root.style.setProperty('--glow-large', glowLarge.toString())
  root.style.setProperty('--glow-inset', glowInset.toString())
  
  // Initialize shift hue for synchronization
  if (lightState.effect === 'shift') {
    root.style.setProperty('--shift-hue', '0deg')
  }
  
  body.classList.add('light-studio-enabled')
  
  // Remove all effect classes first
  body.classList.remove('led-effect-static', 'led-effect-pulse', 'led-effect-shift', 'led-effect-breathe')
  // Add current effect class
  body.classList.add(`led-effect-${lightState.effect}`)
}

interface LightStudioProviderProps {
  children: ReactNode
}

export function LightStudioProvider({ children }: LightStudioProviderProps) {
  const [state, setState] = useState<LightStudioState>(() => {
    // Load from localStorage on initial mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lightStudio')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse lightStudio from localStorage', e)
        }
      }
    }
    return {
      mode: 'rgb',
      effect: 'static',
      red: 255,
      green: 255,
      blue: 255,
      colorTemperature: 4000,
      white: 255,
      brightness: 100,
      enabled: false,
    }
  })

  // Apply theme immediately on mount and whenever state changes
  useLayoutEffect(() => {
    applyLightTheme(state)
  }, [state])

  // Save to localStorage after state changes (separate from theme application)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lightStudio', JSON.stringify(state))
    }
  }, [state])

  // Synchronize shift effect animation across all elements
  useEffect(() => {
    if (!state.enabled || state.effect !== 'shift') {
      document.documentElement.style.setProperty('--shift-hue', '0deg')
      return
    }

    let animationFrame: number
    let startTime: number | null = null
    const duration = 3000 // 3 seconds

    const animate = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp
      }

      const elapsed = timestamp - startTime
      const progress = (elapsed % duration) / duration
      const hue = progress * 360

      document.documentElement.style.setProperty('--shift-hue', `${hue}deg`)
      animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [state.enabled, state.effect])

  const updateMode = (mode: LightMode) => {
    setState(prev => ({ ...prev, mode }))
  }

  const updateRGB = (red: number, green: number, blue: number) => {
    setState(prev => ({ ...prev, red, green, blue }))
  }

  const updateRed = (red: number) => {
    setState(prev => ({ ...prev, red }))
  }

  const updateGreen = (green: number) => {
    setState(prev => ({ ...prev, green }))
  }

  const updateBlue = (blue: number) => {
    setState(prev => ({ ...prev, blue }))
  }

  const updateColorTemperature = (kelvin: number) => {
    setState(prev => ({ ...prev, colorTemperature: kelvin }))
  }

  const updateWhite = (white: number) => {
    setState(prev => ({ ...prev, white }))
  }

  const updateBrightness = (brightness: number) => {
    setState(prev => ({ ...prev, brightness }))
  }

  const toggleLight = () => {
    setState(prev => ({ ...prev, enabled: !prev.enabled }))
  }

  const updateEffect = (effect: LightEffect) => {
    setState(prev => ({ ...prev, effect }))
  }

  const value: LightStudioContextType = {
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
    updateRGB,
  }

  return (
    <LightStudioContext.Provider value={value}>
      {children}
    </LightStudioContext.Provider>
  )
}
