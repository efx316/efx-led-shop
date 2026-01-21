import { useLightStudio } from '../contexts/LightStudioContext'
import { useEffect, useState } from 'react'

export default function WireframeBackground() {
  const { state } = useLightStudio()
  const { enabled, effect, mode, red, green, blue, colorTemperature, white, brightness } = state
  const [ledRgb, setLedRgb] = useState({ r: 255, g: 255, b: 255 })
  
  // Helper function to convert Kelvin to RGB (same as in LightStudioContext)
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
  
  // Calculate LED color based on mode
  useEffect(() => {
    if (!enabled) {
      setLedRgb({ r: 255, g: 255, b: 255 })
      return
    }
    
    let r: number, g: number, b: number
    
    if (mode === 'rgb') {
      r = red
      g = green
      b = blue
    } else if (mode === 'cct') {
      const rgb = kelvinToRGB(colorTemperature)
      r = rgb.r
      g = rgb.g
      b = rgb.b
    } else {
      // White mode
      r = white
      g = white
      b = white
    }
    
    setLedRgb({ r, g, b })
  }, [enabled, mode, red, green, blue, colorTemperature, white])

  // Define which squares should be illuminated (using grid coordinates)
  // This creates an interesting pattern that looks like LED strips
  const illuminatedSquares = [
    // Top left cluster
    { row: 2, col: 3 },
    { row: 2, col: 4 },
    { row: 3, col: 3 },
    { row: 3, col: 4 },
    
    // Center pattern
    { row: 5, col: 9 },
    { row: 6, col: 8 },
    { row: 6, col: 9 },
    { row: 7, col: 8 },
    
    // Right side pattern (moved 10 squares to the right)
    { row: 4, col: 24 },
    { row: 4, col: 25 },
    { row: 5, col: 24 },
    { row: 5, col: 25 },
    
    // Bottom pattern
    { row: 9, col: 6 },
    { row: 10, col: 6 },
    { row: 10, col: 7 },
    { row: 11, col: 6 },
    
    // Scattered accents (moved 10 squares to the right)
    { row: 1, col: 10 },
    { row: 8, col: 2 },
    { row: 12, col: 22 },
    { row: 3, col: 22 },
    { row: 1, col: 29 },
  ]

  const gridSize = 60 // Size of each grid cell in pixels
  const gridCols = 20 // Number of columns
  const gridRows = 15 // Number of rows

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Wireframe grid background */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          opacity: 0.15,
        }}
      >
        <defs>
          {/* Grid pattern */}
          <pattern
            id="wireframe-grid"
            x="0"
            y="0"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M 0 0 L ${gridSize} 0 L ${gridSize} ${gridSize} L 0 ${gridSize} Z`}
              fill="none"
              stroke="#737373"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wireframe-grid)" />
      </svg>

      {/* Illuminated squares */}
      <div className="absolute inset-0">
        {illuminatedSquares.map((square, index) => {
          const x = square.col * gridSize
          const y = square.row * gridSize
          const brightnessValue = brightness / 100
          const opacity = enabled ? 0.15 * brightnessValue : 0
          
          return (
            <div
              key={`${square.row}-${square.col}`}
              className={`absolute transition-all duration-500 ${
                enabled ? 'wireframe-square-lit' : 'wireframe-square-off'
              } wireframe-square-${effect}`}
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${gridSize}px`,
                height: `${gridSize}px`,
                transitionDelay: `${index * 50}ms`,
                borderColor: enabled ? `rgb(${ledRgb.r}, ${ledRgb.g}, ${ledRgb.b})` : 'transparent',
                backgroundColor: enabled ? `rgba(${ledRgb.r}, ${ledRgb.g}, ${ledRgb.b}, ${opacity})` : 'transparent',
                boxShadow: enabled 
                  ? `0 0 ${8 * brightnessValue}px rgb(${ledRgb.r}, ${ledRgb.g}, ${ledRgb.b}), 0 0 ${16 * brightnessValue}px rgb(${ledRgb.r}, ${ledRgb.g}, ${ledRgb.b}), inset 0 0 ${4 * brightnessValue}px rgb(${ledRgb.r}, ${ledRgb.g}, ${ledRgb.b})`
                  : 'none',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
