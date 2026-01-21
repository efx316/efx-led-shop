import { useState } from 'react'
import { useLocation } from 'wouter'
import { isAuthenticated, apiRequest } from '../lib/api'
import { useLightStudio } from '../contexts/LightStudioContext'
import LEDChainVisual from './LEDChainVisual'

interface LEDStrip {
  length: number
  connectionType: 'tail' | 'link'
  connectionLength: number
}

interface OrderConfig {
  environment: 'indoor' | 'outdoor' | 'weatherproof' | null
  colorType: 'single' | 'dual' | 'rgb' | 'rgbw' | null
  ledType: string | null
  length: number | null
  tailWireLength: number | null
  strips: LEDStrip[]
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

interface ReviewStepProps {
  config: OrderConfig
  setConfig: React.Dispatch<React.SetStateAction<OrderConfig>>
  onBack: () => void
  orderId?: number
  isEditing?: boolean
}

export default function ReviewStep({ config, setConfig, onBack, orderId, isEditing = false }: ReviewStepProps) {
  const { state } = useLightStudio()
  const { enabled } = state
  const [, setLocation] = useLocation()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate recommended driver (simplified - you'll want to call your API)
  const calculateDriver = () => {
    // Calculate total length from strips array or single length
    let totalLength = 0
    if (config.strips && config.strips.length > 0) {
      totalLength = config.strips.reduce((sum, strip) => sum + strip.length, 0)
    } else if (config.length) {
      totalLength = config.length
    }
    
    if (!totalLength) return null
    const wattsPerMeter = 14.4 // Example - adjust based on LED type
    const totalWatts = totalLength * wattsPerMeter
    const safetyMargin = 1.2
    const requiredWatts = totalWatts * safetyMargin
    
    // Find closest driver (simplified)
    if (requiredWatts <= 100) return '100W 12V Driver'
    if (requiredWatts <= 150) return '150W 12V Driver'
    if (requiredWatts <= 200) return '200W 12V Driver'
    return '300W 12V Driver'
  }

  const recommendedDriver = calculateDriver()

  // Calculate total length from strips
  const totalLength = config.strips && config.strips.length > 0
    ? config.strips.reduce((sum, strip) => sum + strip.length, 0)
    : config.length || 0

  const handleSubmit = async () => {
    if (!isAuthenticated()) {
      setError('Please log in to submit your order')
      setTimeout(() => {
        setLocation('/login?redirect=/order')
      }, 2000)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const orderData = {
        environment: config.environment,
        colorType: config.colorType,
        ledType: config.ledType,
        length: config.length,
        tailWireLength: config.tailWireLength,
        strips: config.strips && config.strips.length > 0 ? config.strips : undefined,
        includeDriver: config.includeDriver,
        includeProfile: config.includeProfile,
        selectedProfile: config.selectedProfile,
        includeEndCaps: config.includeEndCaps,
        notes: config.notes,
        projectName: config.projectName,
        company: config.company,
        customerName: config.customerName,
        mobile: config.mobile,
        recommendedDriver,
      }

      if (isEditing && orderId) {
        // Update existing order
        await apiRequest(`/api/orders/${orderId}`, {
          method: 'PUT',
          body: JSON.stringify(orderData),
        })
      } else {
        // Create new order
        await apiRequest('/api/orders', {
          method: 'POST',
          body: JSON.stringify(orderData),
        })
      }

      // Success - redirect to orders page
      setLocation('/orders')
    } catch (err: any) {
      console.error('Order submission error:', err)
      // Try to get more detailed error message
      const errorMessage = err?.error || err?.message || 'Failed to submit order'
      const errorDetails = err?.details ? ` Details: ${JSON.stringify(err.details)}` : ''
      setError(`${errorMessage}${errorDetails}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated()) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>
        <div className={`bg-[#0a0a0a] border-2 border-[#262626] p-6 mb-6 ${enabled ? 'led-strip-glow' : ''}`}>
          <p className="text-white font-medium mb-2">
            Login Required to Finalize Order
          </p>
          <p className="text-[#a3a3a3] text-sm mb-4">
            You can still browse and configure your custom LED order, but you must be logged in to submit it.
          </p>
          <button
            onClick={() => setLocation('/login?redirect=/order')}
            className="bg-[#f5f5f5] text-[#171717] px-6 py-2 rounded-lg hover:bg-[#e5e5e5] font-medium tracking-wide uppercase text-sm"
          >
            LOGIN TO SUBMIT
          </button>
        </div>
        <div className={`bg-[#0a0a0a] border-2 border-[#262626] p-6 ${enabled ? 'led-strip-glow' : ''}`}>
          <h3 className="text-lg font-semibold mb-4 text-white">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <p className="text-[#a3a3a3]"><strong className="text-white">Environment:</strong> {config.environment}</p>
            <p className="text-[#a3a3a3]"><strong className="text-white">Color Type:</strong> {config.colorType}</p>
            <p className="text-[#a3a3a3]"><strong className="text-white">LED Type:</strong> {config.ledType}</p>
            <p className="text-[#a3a3a3]"><strong className="text-white">Length:</strong> {config.length}m</p>
            <p className="text-[#a3a3a3]"><strong className="text-white">Tail Wire:</strong> {config.tailWireLength}m</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="mt-6 text-white hover:text-[#a3a3a3]"
        >
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-white">{isEditing ? 'Edit Your Order' : 'Review Your Order'}</h2>

      {/* Order Summary */}
      <div className={`bg-gray-950 border-2 border-gray-800 p-6 mb-6 ${enabled ? 'led-strip-glow' : ''}`}>
        <h3 className="text-lg font-semibold mb-4 text-white">Order Summary</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400"><strong className="text-white">Environment:</strong> {config.environment}</p>
            <p className="text-gray-400"><strong className="text-white">Color Type:</strong> {config.colorType}</p>
            <p className="text-gray-400"><strong className="text-white">LED Type:</strong> {config.ledType}</p>
          </div>
          <div>
            {config.strips && config.strips.length > 0 ? (
              <>
                <p className="text-gray-400"><strong className="text-white">Total Length:</strong> {totalLength.toFixed(2)}m</p>
                <p className="text-gray-400"><strong className="text-white">Number of Strips:</strong> {config.strips.length}</p>
              </>
            ) : (
              <>
                <p className="text-gray-400"><strong className="text-white">Length:</strong> {config.length}m</p>
                <p className="text-gray-400"><strong className="text-white">Tail Wire:</strong> {config.tailWireLength}m</p>
              </>
            )}
            {recommendedDriver && (
              <p className="text-gray-400"><strong className="text-white">Recommended Driver:</strong> {recommendedDriver}</p>
            )}
            {config.includeProfile && config.selectedProfile && (
              <p className="text-gray-400"><strong className="text-white">Profile:</strong> {config.selectedProfile}</p>
            )}
          </div>
        </div>

        {/* Strips Display */}
        {config.strips && config.strips.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#404040]">
            <h4 className="text-md font-semibold mb-4 text-white">LED Strip Chain</h4>
            
            {/* Visual Representation */}
            <div className="mb-4 p-4 bg-[#0a0a0a] rounded-lg border border-[#262626] overflow-x-auto">
              <LEDChainVisual strips={config.strips} />
            </div>

            {/* Text Summary */}
            <p className="text-xs text-[#a3a3a3] mb-4 font-mono text-center">
              {config.strips
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
                .join(' → ')}
            </p>

            {/* Detailed List */}
            <div className="space-y-2">
              {config.strips.map((strip, index) => (
                <div key={index} className="bg-[#0a0a0a] border border-[#262626] rounded p-3">
                  <p className="text-sm text-white">
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
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Additional Items */}
      <div className={`bg-gray-950 border-2 border-gray-800 p-6 mb-6 ${enabled ? 'led-strip-glow' : ''}`}>
        <h3 className="text-lg font-semibold mb-4 text-white">Additional Items</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeDriver}
              onChange={(e) => setConfig(prev => ({ ...prev, includeDriver: e.target.checked }))}
              className="w-5 h-5 text-white border-[#525252] rounded focus:ring-[#a3a3a3] bg-[#0a0a0a]"
            />
            <span className="text-white">
              <strong>Recommended Driver</strong> - {recommendedDriver || 'Driver recommendation'}
            </span>
          </label>
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeProfile}
                onChange={(e) => {
                  setConfig(prev => ({ 
                    ...prev, 
                    includeProfile: e.target.checked,
                    selectedProfile: e.target.checked ? prev.selectedProfile : null
                  }))
                }}
                className="w-5 h-5 text-white border-[#525252] rounded focus:ring-[#a3a3a3] bg-[#0a0a0a]"
              />
              <span className="text-white"><strong>Profile</strong> - LED extrusion/diffuser profile</span>
            </label>
            {config.includeProfile && (
              <div className="mt-3 ml-8">
                <label className="block text-sm font-medium mb-2 text-white">
                  Select Profile Type
                </label>
                <select
                  value={config.selectedProfile || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, selectedProfile: e.target.value || null }))}
                  className="w-full px-4 py-2 border border-[#404040] bg-[#0a0a0a] text-white rounded-lg focus:border-[#737373] focus:outline-none"
                >
                  <option value="">Select a profile...</option>
                  {[
                    { code: 'AP01', label: 'AP01 LED extrusion/diffuser' },
                    { code: 'AP01B', label: 'AP01B LED extrusion/diffuser' },
                    { code: 'AP01C', label: 'AP01C LED extrusion/diffuser' },
                    { code: 'AP01DV2', label: 'AP01DV2 LED extrusion/diffuser' },
                    { code: 'AP01E', label: 'AP01E LED extrusion/diffuser' },
                    { code: 'AP01L', label: 'AP01L LED extrusion BENDABLE' },
                    { code: 'AP01WHT', label: 'AP01WHT LED extrusion/diffuser WHITE ANOD' },
                    { code: 'AP04', label: 'AP04 LED extrusion/diffuser' },
                    { code: 'AP04A', label: 'AP04A LED extrusion/diffuser' },
                    { code: 'AP05', label: 'AP05 LED extrusion/diffuser' },
                    { code: 'AP6010', label: 'AP6010 Aluminium LED extrusion for drywall' },
                  ].map((profile) => (
                    <option key={profile.code} value={profile.code}>
                      {profile.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeEndCaps}
              onChange={(e) => setConfig(prev => ({ ...prev, includeEndCaps: e.target.checked }))}
              className="w-5 h-5 text-white border-[#525252] rounded focus:ring-[#a3a3a3] bg-[#0a0a0a]"
            />
            <span className="text-white"><strong>End Caps</strong> - Protective end caps for LED strip</span>
          </label>
        </div>
      </div>

      {/* Notes */}
      <div className={`bg-gray-950 border-2 border-gray-800 p-6 mb-6 ${enabled ? 'led-strip-glow' : ''}`}>
        <label className="block text-sm font-medium mb-2 text-white">
          Additional Notes
        </label>
        <textarea
          value={config.notes}
          onChange={(e) => setConfig(prev => ({ ...prev, notes: e.target.value }))}
          rows={4}
          className="w-full px-4 py-2 border border-gray-700 bg-gray-950 text-white rounded-lg focus:border-gray-500 focus:outline-none"
          placeholder="Enter any special requirements or notes..."
        />
      </div>

      {/* Customer Information */}
      <div className={`bg-gray-950 border-2 border-gray-800 p-6 mb-6 ${enabled ? 'led-strip-glow' : ''}`}>
        <h3 className="text-lg font-semibold mb-4 text-white">Customer Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Project Name *</label>
            <input
              type="text"
              value={config.projectName}
              onChange={(e) => setConfig(prev => ({ ...prev, projectName: e.target.value }))}
              className="w-full px-4 py-2 border border-[#404040] bg-[#0a0a0a] text-white rounded-lg focus:border-[#737373] focus:outline-none"
              placeholder="e.g., Kitchen Renovation"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Company</label>
            <input
              type="text"
              value={config.company}
              onChange={(e) => setConfig(prev => ({ ...prev, company: e.target.value }))}
              className="w-full px-4 py-2 border border-[#404040] bg-[#0a0a0a] text-white rounded-lg focus:border-[#737373] focus:outline-none"
              placeholder="Company name (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Customer Name *</label>
            <input
              type="text"
              value={config.customerName}
              onChange={(e) => setConfig(prev => ({ ...prev, customerName: e.target.value }))}
              className="w-full px-4 py-2 border border-[#404040] bg-[#0a0a0a] text-white rounded-lg focus:border-[#737373] focus:outline-none"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Mobile *</label>
            <input
              type="tel"
              value={config.mobile}
              onChange={(e) => setConfig(prev => ({ ...prev, mobile: e.target.value }))}
              className="w-full px-4 py-2 border border-[#404040] bg-[#0a0a0a] text-white rounded-lg focus:border-[#737373] focus:outline-none"
              placeholder="0400 000 000"
              required
            />
          </div>
        </div>
      </div>

      {error && (
        <div className={`bg-[#0a0a0a] border-2 border-[#404040] p-4 mb-6 ${enabled ? 'led-strip-glow' : ''}`}>
          <p className="text-[#a3a3a3]">{error}</p>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="px-6 py-2 border-2 border-[#404040] rounded-lg hover:bg-[#171717] text-white transition-colors"
          disabled={submitting}
        >
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !config.projectName || !config.customerName || !config.mobile || (config.includeProfile && !config.selectedProfile)}
          className="px-6 py-2 bg-[#f5f5f5] text-[#171717] rounded-lg hover:bg-[#e5e5e5] disabled:bg-[#262626] disabled:text-[#737373] disabled:cursor-not-allowed font-medium tracking-wide uppercase text-sm transition-colors"
        >
          {submitting ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update Order' : 'Submit Order')}
        </button>
      </div>
    </div>
  )
}
