import { useState, useEffect } from 'react'
import ReviewStep from './ReviewStep'
import AddStripsStep from './AddStripsStep'
import { useLightStudio } from '../contexts/LightStudioContext'

type Step = 'environment' | 'color' | 'type' | 'length' | 'tailwire' | 'addstrips' | 'review'

interface LEDStrip {
  length: number
  connectionType: 'tail' | 'link' // 'tail' for new segment, 'link' for connected
  connectionLength: number // tail wire length or linking wire length in meters
}

interface OrderConfig {
  environment: 'indoor' | 'outdoor' | 'weatherproof' | null
  colorType: 'single' | 'dual' | 'rgb' | 'rgbw' | null
  ledType: string | null
  length: number | null
  tailWireLength: number | null
  // Multiple strips
  strips: LEDStrip[]
  // Review step fields
  includeDriver: boolean
  includeProfile: boolean
  selectedProfile: string | null
  includeEndCaps: boolean
  notes: string
  projectName: string
  company: string
  customerName: string
  mobile: string
}

// Convert Kelvin to RGB color - using accurate values for LED color temperatures
function kelvinToRGB(kelvin: number): { r: number; g: number; b: number } {
  // Lookup table based on actual color gradient swatches
  // Colors match the visual appearance from the uploaded gradient images
  const colorMap: Record<number, { r: number; g: number; b: number }> = {
    2700: { r: 255, g: 200, b: 100 },  // Warm luminous yellow-orange (bright yellow/orange tones)
    3000: { r: 255, g: 230, b: 190 },  // Creamy beige/pale yellow-orange (soft warm tone)
    4000: { r: 255, g: 248, b: 240 },  // Creamy off-white/pale beige (neutral warm)
    5000: { r: 255, g: 252, b: 250 },  // Pure white/very light off-white (neutral)
    6000: { r: 245, g: 248, b: 255 },  // White with subtle cool blue-grey tint (cool white)
  }

  // If exact match, return it
  if (colorMap[kelvin]) {
    return colorMap[kelvin]
  }

  // Otherwise interpolate between nearest values
  const temps = Object.keys(colorMap).map(Number).sort((a, b) => a - b)
  let lower = temps[0]
  let upper = temps[temps.length - 1]

  for (let i = 0; i < temps.length - 1; i++) {
    if (kelvin >= temps[i] && kelvin <= temps[i + 1]) {
      lower = temps[i]
      upper = temps[i + 1]
      break
    }
  }

  const lowerColor = colorMap[lower]
  const upperColor = colorMap[upper]
  const ratio = (kelvin - lower) / (upper - lower)

  return {
    r: Math.round(lowerColor.r + (upperColor.r - lowerColor.r) * ratio),
    g: Math.round(lowerColor.g + (upperColor.g - lowerColor.g) * ratio),
    b: Math.round(lowerColor.b + (upperColor.b - lowerColor.b) * ratio),
  }
}

interface LEDOrderFlowProps {
  initialConfig?: Partial<OrderConfig>
  orderId?: number
  isEditing?: boolean
}

export default function LEDOrderFlow({ initialConfig, orderId, isEditing = false }: LEDOrderFlowProps) {
  const { state } = useLightStudio()
  const { enabled } = state
  const [step, setStep] = useState<Step>('environment')
  const [config, setConfig] = useState<OrderConfig>({
    environment: initialConfig?.environment || null,
    colorType: initialConfig?.colorType || null,
    ledType: initialConfig?.ledType || null,
    length: initialConfig?.length || null,
    tailWireLength: initialConfig?.tailWireLength || null,
    strips: (initialConfig as any)?.strips || [],
    includeDriver: initialConfig?.includeDriver ?? true,
    includeProfile: initialConfig?.includeProfile ?? false,
    selectedProfile: initialConfig?.selectedProfile || null,
    includeEndCaps: initialConfig?.includeEndCaps ?? false,
    notes: initialConfig?.notes || '',
    projectName: initialConfig?.projectName || '',
    company: initialConfig?.company || '',
    customerName: initialConfig?.customerName || '',
    mobile: initialConfig?.mobile || '',
  })

  // If editing and we have initial config, jump to review step
  useEffect(() => {
    if (isEditing && initialConfig && initialConfig.environment) {
      setStep('review')
    }
  }, [isEditing, initialConfig])

  const handleEnvironmentSelect = (env: 'indoor' | 'outdoor' | 'weatherproof') => {
    setConfig(prev => ({ ...prev, environment: env }))
    setStep('color')
  }

  const handleColorSelect = (color: 'single' | 'dual' | 'rgb' | 'rgbw') => {
    setConfig(prev => ({ ...prev, colorType: color }))
    // RGB and RGBW skip the type step and go directly to length
    if (color === 'rgb' || color === 'rgbw') {
      setStep('length')
    } else {
      setStep('type')
    }
  }

  const handleTypeSelect = (type: string) => {
    setConfig(prev => ({ ...prev, ledType: type }))
    setStep('length')
  }

  const handleLengthSelect = (length: number) => {
    setConfig(prev => ({ ...prev, length }))
    setStep('tailwire')
  }

  const handleTailWireSelect = (tailLength: number) => {
    // Initialize strips array with the first strip if empty
    setConfig(prev => {
      const firstStrip = prev.strips.length === 0 && prev.length
        ? [{ length: prev.length, connectionType: 'tail' as const, connectionLength: tailLength }]
        : prev.strips
      return {
        ...prev,
        tailWireLength: tailLength,
        strips: firstStrip,
      }
    })
    setStep('addstrips')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { id: 'environment', label: '1. Environment' },
            { id: 'color', label: '2. Color' },
            { id: 'type', label: '3. Type' },
            { id: 'length', label: '4. Length' },
            { id: 'tailwire', label: '5. Tail Wire' },
            { id: 'addstrips', label: '6. Add Strips' },
            { id: 'review', label: '7. Review' },
          ].map((s, index) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step === s.id
                      ? 'bg-white text-black'
                      : ['environment', 'color', 'type', 'length', 'tailwire', 'addstrips', 'review'].indexOf(step) >
                        index
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {index + 1}
                </div>
                <span className="text-xs mt-2 text-center text-white">{s.label}</span>
              </div>
              {index < 6 && (
                <div
                    className={`h-1 flex-1 mx-2 ${
                    ['environment', 'color', 'type', 'length', 'tailwire', 'addstrips', 'review'].indexOf(step) > index
                      ? 'bg-gray-600'
                      : 'bg-gray-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className={`led-order-form bg-[#0a0a0a] border border-[#262626] p-8 min-h-[400px] ${enabled ? 'led-strip-glow' : ''}`}>
        {step === 'environment' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-white">Select Environment</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <button
                onClick={() => handleEnvironmentSelect('indoor')}
                className="p-8 border-2 border-[#262626] rounded-lg hover:border-[#525252] hover:bg-[#171717] transition-all text-left"
              >
                <div className="text-4xl mb-4">🏠</div>
                <h3 className="text-xl font-semibold mb-2 text-white">Indoor</h3>
                <p className="text-[#a3a3a3] text-sm">
                  For kitchen under-cabinet lighting, bathrooms, and interior applications
                </p>
              </button>
              <button
                onClick={() => handleEnvironmentSelect('outdoor')}
                className="p-8 border-2 border-[#262626] rounded-lg hover:border-[#525252] hover:bg-[#171717] transition-all text-left"
              >
                <div className="text-4xl mb-4">🌳</div>
                <h3 className="text-xl font-semibold mb-2 text-white">Outdoor (IP65)</h3>
                <p className="text-[#a3a3a3] text-sm">
                  Weather-resistant for outdoor use, splash proof
                </p>
              </button>
              <button
                onClick={() => handleEnvironmentSelect('weatherproof')}
                className="p-8 border-2 border-[#262626] rounded-lg hover:border-[#525252] hover:bg-[#171717] transition-all text-left"
              >
                <div className="text-4xl mb-4">🌊</div>
                <h3 className="text-xl font-semibold mb-2 text-white">Full Weatherproof (IP67)</h3>
                <p className="text-[#a3a3a3] text-sm">
                  Fully waterproof for submersion up to 1m, maximum protection
                </p>
              </button>
            </div>
          </div>
        )}

        {step === 'color' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-white">Select Color Type</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <button
                onClick={() => handleColorSelect('single')}
                className="p-8 border-2 border-[#262626] rounded-lg hover:border-[#525252] hover:bg-[#171717] transition-all text-left"
              >
                <div className="text-4xl mb-4">💡</div>
                <h3 className="text-xl font-semibold mb-2 text-white">Single Colour</h3>
                <p className="text-[#a3a3a3] text-sm">
                  One fixed white color temperature
                </p>
              </button>
              <button
                onClick={() => handleColorSelect('dual')}
                className="p-8 border-2 border-[#262626] rounded-lg hover:border-[#525252] hover:bg-[#171717] transition-all text-left"
              >
                <div className="text-4xl mb-4">🎛️</div>
                <h3 className="text-xl font-semibold mb-2 text-white">Dual Colour (CCT)</h3>
                <p className="text-[#a3a3a3] text-sm">
                  Warm white to cool white (adjustable)
                </p>
              </button>
              <button
                onClick={() => handleColorSelect('rgb')}
                className="p-8 border-2 border-[#262626] rounded-lg hover:border-[#525252] hover:bg-[#171717] transition-all text-left"
              >
                <div className="text-4xl mb-4">🌈</div>
                <h3 className="text-xl font-semibold mb-2 text-white">RGB</h3>
                <p className="text-[#a3a3a3] text-sm">
                  Full color changing capability
                </p>
              </button>
              <button
                onClick={() => handleColorSelect('rgbw')}
                className="p-8 border-2 border-[#262626] rounded-lg hover:border-[#525252] hover:bg-[#171717] transition-all text-left"
              >
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-xl font-semibold mb-2 text-white">RGBW</h3>
                <p className="text-[#a3a3a3] text-sm">
                  RGB colors plus dedicated white
                </p>
              </button>
            </div>
            <button
              onClick={() => setStep('environment')}
              className="mt-6 text-white hover:text-[#a3a3a3]"
            >
              ← Back
            </button>
          </div>
        )}

        {step === 'type' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-white">
              {config.colorType === 'single'
                ? 'Select White Temperature'
                : config.colorType === 'dual'
                  ? 'Select Dual Colour Type'
                  : 'Select LED Type'}
            </h2>
            {config.colorType === 'single' ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: 'Warm White 2700K', kelvin: 2700 },
                  { label: 'Warm White 3000K', kelvin: 3000 },
                  { label: 'Neutral White 4000K', kelvin: 4000 },
                  { label: 'Cool White 5000K', kelvin: 5000 },
                  { label: 'Cool White 6000K', kelvin: 6000 },
                ].map(({ label, kelvin }) => {
                  const color = kelvinToRGB(kelvin)
                  return (
                    <button
                      key={label}
                      onClick={() => handleTypeSelect(label)}
                      className={`p-6 border-2 border-[#262626] rounded-lg hover:border-[#525252] transition-all text-left flex items-center justify-between ${
                        config.ledType === label ? 'border-white bg-[#171717]' : 'border-[#262626]'
                      }`}
                    >
                      <h3 className="text-lg font-semibold text-white">{label}</h3>
                      <div
                        className="w-8 h-8 rounded-full border-2 border-[#d4d4d4] flex-shrink-0"
                        style={{
                          backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                        }}
                      />
                    </button>
                  )
                })}
              </div>
            ) : config.colorType === 'dual' ? (
              <div className="grid md:grid-cols-2 gap-4">
                {['Tunable White (2700K–6500K)'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    className={`p-6 border-2 border-[#262626] rounded-lg hover:border-[#525252] transition-all text-left ${
                      config.ledType === type ? 'border-white bg-[#171717]' : 'border-[#262626]'
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-white">{type}</h3>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {['Standard Density', 'High Density', 'Ultra High Density'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    className={`p-6 border-2 border-[#262626] rounded-lg hover:border-[#525252] transition-all text-left ${
                      config.ledType === type ? 'border-white bg-[#171717]' : 'border-[#262626]'
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-white">{type}</h3>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setStep('color')}
              className="mt-6 text-white hover:text-[#a3a3a3]"
            >
              ← Back
            </button>
          </div>
        )}

        {step === 'length' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-white">Enter Length (meters)</h2>
            <div className="max-w-md">
              <input
                type="number"
                min="0.5"
                max="100"
                step="0.5"
                placeholder="e.g., 5.0"
                value={config.length || ''}
                className="w-full px-4 py-3 text-2xl border-2 border-[#404040] rounded-lg focus:border-[#737373] focus:outline-none bg-[#0a0a0a] text-white"
                onChange={(e) => {
                  const val = e.target.value ? parseFloat(e.target.value) : null
                  setConfig(prev => ({ ...prev, length: val }))
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && config.length && config.length > 0) {
                    handleLengthSelect(config.length)
                  }
                }}
              />
              <p className="text-gray-400 mt-4">
                Enter the total length you need. We can cut to any length.
              </p>
              {config.length && config.length > 0 && (
                <button
                  onClick={() => handleLengthSelect(config.length!)}
                  className="mt-4 w-full bg-[#f5f5f5] text-[#171717] py-3 rounded-lg hover:bg-[#e5e5e5] font-medium tracking-wide uppercase text-sm"
                >
                  Continue
                </button>
              )}
            </div>
            <button
              onClick={() => setStep('type')}
              className="mt-6 text-white hover:text-[#a3a3a3]"
            >
              ← Back
            </button>
          </div>
        )}

        {step === 'tailwire' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-white">Tail Wire Length (meters)</h2>
            <div className="max-w-md">
              <input
                type="number"
                min="0"
                max="20"
                step="0.1"
                placeholder="e.g., 2.0"
                value={config.tailWireLength !== null ? config.tailWireLength : ''}
                className="w-full px-4 py-3 text-2xl border-2 border-gray-700 bg-gray-950 text-white rounded-lg focus:border-gray-500 focus:outline-none"
                onChange={(e) => {
                  const val = e.target.value ? parseFloat(e.target.value) : null
                  setConfig(prev => ({ ...prev, tailWireLength: val }))
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && config.tailWireLength !== null && config.tailWireLength >= 0) {
                    handleTailWireSelect(config.tailWireLength)
                  }
                }}
              />
              <p className="text-gray-400 mt-4">
                Length of wire needed to connect to your power supply. Enter 0 if not needed.
              </p>
              {config.tailWireLength !== null && config.tailWireLength >= 0 && (
                <button
                  onClick={() => handleTailWireSelect(config.tailWireLength!)}
                  className="mt-4 w-full bg-[#f5f5f5] text-[#171717] py-3 rounded-lg hover:bg-[#e5e5e5] font-medium tracking-wide uppercase text-sm"
                >
                  Continue
                </button>
              )}
            </div>
            <button
              onClick={() => setStep('length')}
              className="mt-6 text-white hover:text-[#a3a3a3]"
            >
              ← Back
            </button>
          </div>
        )}

        {step === 'addstrips' && (
          <AddStripsStep
            strips={config.strips}
            setStrips={(strips) => setConfig(prev => ({ ...prev, strips }))}
            onNext={() => setStep('review')}
            onBack={() => setStep('tailwire')}
          />
        )}

        {step === 'review' && (
          <ReviewStep
            config={config}
            setConfig={setConfig}
            onBack={() => setStep('addstrips')}
            orderId={orderId}
            isEditing={isEditing}
          />
        )}
      </div>
    </div>
  )
}

