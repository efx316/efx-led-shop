import { useLightStudio } from '../contexts/LightStudioContext'

interface LEDStrip {
  length: number
  connectionType: 'tail' | 'link'
  connectionLength: number
}

interface LEDChainVisualProps {
  strips: LEDStrip[]
  className?: string
}

export default function LEDChainVisual({ strips, className = '' }: LEDChainVisualProps) {
  const { state } = useLightStudio()
  const { enabled } = state

  if (strips.length === 0) {
    return (
      <div className={`text-center py-8 text-[#a3a3a3] ${className}`}>
        No strips added yet
      </div>
    )
  }

  // Group strips into segments (each segment starts with a tail wire)
  const segments: LEDStrip[][] = []
  let currentSegment: LEDStrip[] = []

  strips.forEach((strip, index) => {
    if (index === 0 || strip.connectionType === 'tail') {
      // Start a new segment
      if (currentSegment.length > 0) {
        segments.push(currentSegment)
      }
      currentSegment = [strip]
    } else {
      // Continue current segment
      currentSegment.push(strip)
    }
  })
  if (currentSegment.length > 0) {
    segments.push(currentSegment)
  }

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {segments.map((segment, segmentIndex) => {
        // Calculate the starting index for this segment in the original strips array
        let stripIndex = 0
        for (let i = 0; i < segmentIndex; i++) {
          stripIndex += segments[i].length
        }

        return (
          <div key={segmentIndex} className="flex flex-col gap-2">
            {/* Segment Label */}
            <div className="text-xs text-[#737373] font-medium mb-1">
              Chain {segmentIndex + 1}
            </div>
            
            {/* Segment Visual */}
            <div className="flex items-center flex-wrap gap-3">
              {segment.map((strip, segmentStripIndex) => {
                const globalIndex = stripIndex + segmentStripIndex
                const stripWidth = Math.max(80, strip.length * 40)
                const wireWidth = strip.connectionType === 'link'
                  ? Math.max(30, strip.connectionLength * 300)
                  : Math.max(50, strip.connectionLength * 40)

                return (
                  <div key={globalIndex} className="flex flex-col items-center gap-3">
                    {/* Labels Row */}
                    <div className="flex items-center gap-3">
                      {/* Wire Label */}
                      {segmentStripIndex === 0 ? (
                        <div className="text-[10px] text-[#a3a3a3] text-center whitespace-nowrap" style={{ width: `${wireWidth}px`, minWidth: '30px' }}>
                          Tail Wire
                          <br />
                          {strip.connectionLength}m
                        </div>
                      ) : (
                        <div className="text-[10px] text-[#a3a3a3] text-center whitespace-nowrap" style={{ width: `${wireWidth}px`, minWidth: strip.connectionType === 'link' ? '20px' : '30px' }}>
                          {strip.connectionType === 'link' ? 'Link Wire' : 'Tail Wire'}
                          <br />
                          {strip.connectionType === 'link' ? `${Math.round(strip.connectionLength * 1000)}mm` : `${strip.connectionLength}m`}
                        </div>
                      )}
                      
                      {/* Strip Label */}
                      <div className="text-[10px] text-[#a3a3a3] text-center whitespace-nowrap" style={{ width: `${stripWidth}px`, minWidth: '60px' }}>
                        Strip #{globalIndex + 1}
                        <br />
                        {strip.length}m
                      </div>
                    </div>

                    {/* Visual Elements Row - Centered */}
                    <div className="flex gap-3 relative">
                      {/* Connection Wire (Tail or Link) - positioned to align with strip center */}
                      <div style={{ display: 'flex', alignItems: 'center', height: '20px' }}>
                        {segmentStripIndex === 0 ? (
                          <div
                            className="bg-gradient-to-r from-yellow-600 to-yellow-500 border border-yellow-400 rounded-sm"
                            style={{
                              width: `${wireWidth}px`,
                              height: '4px',
                              minWidth: '30px',
                            }}
                          />
                        ) : (
                          <div
                            className={`bg-gradient-to-r border rounded-sm ${
                              strip.connectionType === 'link'
                                ? 'from-blue-600 to-blue-500 border-blue-400'
                                : 'from-yellow-600 to-yellow-500 border-yellow-400'
                            }`}
                            style={{
                              width: `${wireWidth}px`,
                              height: '4px',
                              minWidth: strip.connectionType === 'link' ? '20px' : '30px',
                            }}
                          />
                        )}
                      </div>

                      {/* LED Strip Container */}
                      <div className="flex flex-col items-center">
                        {/* Strip Rectangle - this is what we align the wire with (20px height) */}
                        <div
                          className={`rounded-sm border-2 ${
                            enabled
                              ? 'bg-gradient-to-r from-green-500 via-green-400 to-green-500 border-green-300 shadow-lg shadow-green-500/50'
                              : 'bg-gradient-to-r from-green-600 to-green-500 border-green-400'
                          }`}
                          style={{
                            width: `${stripWidth}px`,
                            height: '20px',
                            minWidth: '60px',
                          }}
                        />
                        {/* Add LED dots pattern for realism - positioned below */}
                        <div
                          className="flex items-center justify-center gap-1 mt-1"
                          style={{ width: `${stripWidth}px`, minWidth: '60px' }}
                        >
                          {Array.from({ length: Math.min(Math.floor(strip.length), 10) }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 h-1 rounded-full ${
                                enabled ? 'bg-green-300' : 'bg-green-400'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
