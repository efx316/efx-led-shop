import { useState } from 'react'
import { useLightStudio } from '../contexts/LightStudioContext'
import LEDChainVisual from './LEDChainVisual'

interface LEDStrip {
  length: number
  connectionType: 'tail' | 'link'
  connectionLength: number
}

interface AddStripsStepProps {
  strips: LEDStrip[]
  setStrips: (strips: LEDStrip[]) => void
  onNext: () => void
  onBack: () => void
}

export default function AddStripsStep({
  strips,
  setStrips,
  onNext,
  onBack,
}: AddStripsStepProps) {
  const { state } = useLightStudio()
  const { enabled } = state
  const [newStripLength, setNewStripLength] = useState<number | null>(null)
  const [newConnectionType, setNewConnectionType] = useState<'tail' | 'link'>('link')
  const [newConnectionLength, setNewConnectionLength] = useState<number>(0.1) // Default 100mm for link

  const addStrip = () => {
    if (!newStripLength || newStripLength <= 0) return

    const newStrip: LEDStrip = {
      length: newStripLength,
      connectionType: newConnectionType,
      connectionLength: newConnectionLength,
    }

    setStrips([...strips, newStrip])
    setNewStripLength(null)
    setNewConnectionLength(newConnectionType === 'link' ? 0.1 : 1)
  }

  const removeStrip = (index: number) => {
    setStrips(strips.filter((_, i) => i !== index))
  }

  const formatStripChain = (): string => {
    if (strips.length === 0) return 'No strips added yet'
    
    return strips
      .map((strip, index) => {
        if (index === 0) {
          return `${strip.connectionLength}m tail → ${strip.length}m strip`
        } else {
          const connector = strip.connectionType === 'link'
            ? `${Math.round(strip.connectionLength * 1000)}mm link`
            : `${strip.connectionLength}m tail`
          return `${connector} → ${strip.length}m strip`
        }
      })
      .join(' → ')
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-white">Add Additional Strips</h2>
      <p className="text-[#a3a3a3] mb-6">
        You can add more LED strips to your order. Each additional strip can be connected with a linking wire or start a new segment with a tail wire.
      </p>

      {/* Current Strips Display */}
      {strips.length > 0 && (
        <div className={`bg-[#171717] border border-[#262626] rounded-lg p-6 mb-6 ${enabled ? 'led-strip-glow' : ''}`}>
          <h3 className="text-lg font-semibold mb-4 text-white">Current Strip Chain</h3>
          
          {/* Visual Representation */}
          <div className="mb-6 p-4 bg-[#0a0a0a] rounded-lg border border-[#262626] overflow-x-auto">
            <LEDChainVisual strips={strips} />
          </div>

          {/* Text Summary */}
          <p className="text-sm text-[#a3a3a3] font-mono mb-4 text-center">{formatStripChain()}</p>
          
          {/* Detailed List */}
          <div className="space-y-2">
            {strips.map((strip, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded border border-[#262626]"
              >
                <div className="flex-1">
                  <p className="text-white text-sm">
                    <strong>Strip #{index + 1}:</strong> {strip.length}m
                    {index === 0 ? (
                      <span className="text-[#a3a3a3] ml-2">(Tail: {strip.connectionLength}m)</span>
                    ) : (
                      <span className="text-[#a3a3a3] ml-2">
                        ({strip.connectionType === 'link' ? 'Link' : 'Tail'}: {strip.connectionType === 'link' ? `${Math.round(strip.connectionLength * 1000)}mm` : `${strip.connectionLength}m`})
                      </span>
                    )}
                  </p>
                </div>
                {index > 0 && (
                  <button
                    onClick={() => removeStrip(index)}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Strip Form */}
      <div className={`bg-[#171717] border border-[#262626] rounded-lg p-6 mb-6 ${enabled ? 'led-strip-glow' : ''}`}>
        <h3 className="text-lg font-semibold mb-4 text-white">Add Another Strip</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Strip Length (meters) *
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={newStripLength || ''}
              onChange={(e) => setNewStripLength(e.target.value ? parseFloat(e.target.value) : null)}
              className="w-full px-4 py-2 border border-[#404040] bg-[#0a0a0a] text-white rounded-lg focus:border-[#737373] focus:outline-none"
              placeholder="e.g., 2.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Connection Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="connectionType"
                  value="link"
                  checked={newConnectionType === 'link'}
                  onChange={() => {
                    setNewConnectionType('link')
                    setNewConnectionLength(0.1) // Default 100mm
                  }}
                  className="w-4 h-4 text-white border-[#525252] focus:ring-[#a3a3a3] bg-[#0a0a0a]"
                />
                <span className="text-white">Linking Wire (connects to previous strip)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="connectionType"
                  value="tail"
                  checked={newConnectionType === 'tail'}
                  onChange={() => {
                    setNewConnectionType('tail')
                    setNewConnectionLength(1) // Default 1m
                  }}
                  className="w-4 h-4 text-white border-[#525252] focus:ring-[#a3a3a3] bg-[#0a0a0a]"
                />
                <span className="text-white">Tail Wire (new segment)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              {newConnectionType === 'link' ? 'Linking Wire Length (millimeters)' : 'Tail Wire Length (meters)'} *
            </label>
            <input
              type="number"
              min={newConnectionType === 'link' ? 0.01 : 0.1}
              step={newConnectionType === 'link' ? 0.01 : 0.1}
              value={newConnectionLength}
              onChange={(e) => setNewConnectionLength(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-[#404040] bg-[#0a0a0a] text-white rounded-lg focus:border-[#737373] focus:outline-none"
              placeholder={newConnectionType === 'link' ? 'e.g., 0.1 (100mm)' : 'e.g., 1.0'}
            />
            {newConnectionType === 'link' && (
              <p className="text-xs text-[#a3a3a3] mt-1">
                {Math.round(newConnectionLength * 1000)}mm
              </p>
            )}
          </div>

          <button
            onClick={addStrip}
            disabled={!newStripLength || newStripLength <= 0 || newConnectionLength <= 0}
            className="w-full px-4 py-2 bg-[#262626] text-white rounded-lg hover:bg-[#404040] border border-[#404040] disabled:bg-[#171717] disabled:text-[#737373] disabled:cursor-not-allowed font-medium"
          >
            + Add Strip
          </button>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="px-6 py-2 border-2 border-[#404040] rounded-lg hover:bg-[#171717] text-white transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-[#f5f5f5] text-[#171717] rounded-lg hover:bg-[#e5e5e5] font-medium tracking-wide uppercase text-sm transition-colors"
        >
          Continue to Review
        </button>
      </div>
    </div>
  )
}
