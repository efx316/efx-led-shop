import { formatLength } from '../utils/profileCalculator'
import { DRIVER_SPECS } from '../utils/powerCalculator'

interface StripChainComponent {
  type: 'tail' | 'strip' | 'link'
  length: number
  quantity?: number
  powerWatts?: number
}

interface JobSheetProps {
  orderId: number
  date: string
  customerName: string
  company?: string
  contact: string
  projectName?: string
  poNumber?: string
  environment: 'indoor' | 'outdoor' | 'weatherproof'
  stripChain: StripChainComponent[]
  driver?: {
    model: string
    specification: string
    quantity: number
  }
  profile?: {
    type: string
    requiredLength: number
    cutLengths?: Array<{ length: number; quantity: number }>
    baseMeters: number
    cuttingFee: number
    totalCuttingFees: number
    offcuts?: Array<{ length: number }>
  }
  specialInstructions?: string
}

export default function JobSheet({
  orderId,
  date,
  customerName,
  company,
  contact,
  projectName,
  poNumber,
  environment,
  stripChain,
  driver,
  profile,
  specialInstructions,
}: JobSheetProps) {
  const getStrips = () => {
    return stripChain.filter((comp) => comp.type === 'strip')
  }

  const getLinks = () => {
    return stripChain.filter((comp) => comp.type === 'link')
  }

  const getTail = () => {
    return stripChain.find((comp) => comp.type === 'tail')
  }

  const getTotalPower = (): number => {
    return getStrips().reduce((sum, strip) => sum + (strip.powerWatts || 0), 0)
  }

  const strips = getStrips()
  const links = getLinks()
  const tail = getTail()
  const totalPower = getTotalPower()

  return (
    <div className="job-sheet print-container">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          .no-print {
            display: none !important;
          }
          .job-sheet {
            padding: 0;
          }
        }
        .job-sheet {
          max-width: 210mm;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Courier New', monospace;
          background: white;
          color: black;
        }
        .job-sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          border-bottom: 2px solid black;
          padding-bottom: 10px;
        }
        .company-info h1 {
          font-size: 18px;
          margin: 0 0 5px 0;
          font-weight: bold;
        }
        .company-info h2 {
          font-size: 14px;
          margin: 0;
          font-weight: normal;
        }
        .order-info {
          text-align: right;
          font-size: 12px;
        }
        .order-info p {
          margin: 2px 0;
        }
        .client-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
          padding: 10px;
          border: 1px solid black;
        }
        .client-info p {
          margin: 5px 0;
          font-size: 12px;
        }
        .client-info strong {
          font-weight: bold;
        }
        .area-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .area-header {
          background: #f0f0f0;
          padding: 8px;
          font-weight: bold;
          border: 1px solid black;
          margin-bottom: 10px;
        }
        .area-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .area-details {
          border: 1px solid black;
          padding: 10px;
        }
        .area-details h4 {
          margin: 0 0 10px 0;
          font-size: 12px;
          font-weight: bold;
          border-bottom: 1px solid black;
          padding-bottom: 5px;
        }
        .area-details p {
          margin: 5px 0;
          font-size: 11px;
        }
        .bill-of-materials {
          border: 1px solid black;
          padding: 10px;
          background: #f9f9f9;
        }
        .bill-of-materials h4 {
          margin: 0 0 10px 0;
          font-size: 12px;
          font-weight: bold;
          border-bottom: 1px solid black;
          padding-bottom: 5px;
        }
        .bill-of-materials p {
          margin: 5px 0;
          font-size: 11px;
        }
        .special-instructions {
          margin-top: 30px;
          padding: 10px;
          border: 1px solid black;
          background: #ffffcc;
        }
        .special-instructions h4 {
          margin: 0 0 5px 0;
          font-size: 12px;
          font-weight: bold;
        }
        .special-instructions p {
          margin: 0;
          font-size: 11px;
        }
        .checkbox {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 1px solid black;
          margin-right: 5px;
          vertical-align: middle;
        }
      `}</style>

      {/* Header */}
      <div className="job-sheet-header">
        <div className="company-info">
          <h1>Electronic FX Pty Ltd</h1>
          <h2>PROJECT SHEET DETAILING ITEMS TO BE SUPPLIED TO CUSTOMER</h2>
        </div>
        <div className="order-info">
          <p><strong>Order #:</strong> {orderId}</p>
          <p><strong>Date:</strong> {date}</p>
          <p><strong>PAGE 1 OF 1</strong></p>
          <p>
            <span className="checkbox"></span> INDOOR
            <span className="checkbox" style={{ marginLeft: '10px' }}></span> OUTDOOR
            {environment === 'indoor' && <span style={{ marginLeft: '5px' }}>✓</span>}
            {environment === 'outdoor' && <span style={{ marginLeft: '30px' }}>✓</span>}
            {environment === 'weatherproof' && <span style={{ marginLeft: '30px' }}>✓</span>}
          </p>
        </div>
      </div>

      {/* Client Information */}
      <div className="client-info">
        <div>
          <p><strong>CLIENT:</strong> {company || customerName}</p>
          <p><strong>CONTACT:</strong> {contact}</p>
        </div>
        <div>
          <p><strong>PROJECT:</strong> {projectName || 'N/A'}</p>
          <p><strong>P.O. Number:</strong> {poNumber || 'N/A'}</p>
        </div>
      </div>

      {/* Single Area (one order = one driver setup) */}
      <div className="area-section">
        <div className="area-header">
          AREA: LABEL 1
        </div>
        
        <div className="area-content">
          {/* Area Details */}
          <div className="area-details">
            {driver && (
              <>
                <h4>LED DRIVER</h4>
                <p>
                  <span className="checkbox"></span> 
                  qty × {driver.quantity} - {driver.specification}
                </p>
                {tail && <p>Tail: {formatLength(tail.length)}</p>}
                {totalPower > 0 && <p>Measured Amps: {totalPower.toFixed(1)}W</p>}
              </>
            )}

            <h4>LED STRIPS</h4>
            {strips.map((strip, stripIndex) => (
              <p key={stripIndex}>
                <span className="checkbox"></span>
                LED STRIP #{stripIndex + 1} - LED Length: {formatLength(strip.length)} × {strip.quantity || 1}
                {strip.powerWatts && ` (${strip.powerWatts.toFixed(1)}W)`}
              </p>
            ))}

            {links.length > 0 && (
              <>
                <h4>LINKING WIRES</h4>
                {links.map((link, linkIndex) => (
                  <p key={linkIndex}>
                    <span className="checkbox"></span>
                    Link #{linkIndex + 1}: {formatLength(link.length, 'millimeters')}
                  </p>
                ))}
              </>
            )}

            {profile ? (
              <>
                <h4>PROFILE USED</h4>
                <p>
                  <span className="checkbox"></span>
                  {profile.type} - Profile Length: {formatLength(profile.requiredLength)}
                  {profile.cutLengths && profile.cutLengths.length > 0 && (
                    ` × ${profile.cutLengths.reduce((sum, cut) => sum + cut.quantity, 0)}`
                  )}
                </p>
                <p>Base Meters: {profile.baseMeters} × 1m lengths</p>
                {profile.totalCuttingFees > 0 && (
                  <p>Cutting Fees: ${profile.totalCuttingFees.toFixed(2)}</p>
                )}
              </>
            ) : (
              <>
                <h4>NO PROFILE</h4>
                <p><span className="checkbox"></span> NO PROFILE REQUIRED</p>
              </>
            )}
          </div>

          {/* Bill of Materials */}
          <div className="bill-of-materials">
            <h4>Bill Of Materials</h4>
            {strips.length > 0 && (
              <p>
                LED: {strips.reduce((sum, s) => sum + s.length * (s.quantity || 1), 0).toFixed(2)}mtr. 
                Calculated pwr = {totalPower.toFixed(1)}Watts
              </p>
            )}
            {profile ? (
              <>
                <p>
                  PROFILE USED: {profile.type} 
                  {profile.cutLengths && profile.cutLengths.map((cut, i) => (
                    <span key={i}>
                      {' '}***{formatLength(cut.length)} length*** qty × {cut.quantity}
                    </span>
                  ))}
                </p>
                <p>Base Meters: {profile.baseMeters} × 1m lengths</p>
                {profile.offcuts && profile.offcuts.length > 0 && (
                  <p>Offcuts: {profile.offcuts.map(o => formatLength(o.length)).join(', ')}</p>
                )}
              </>
            ) : (
              <p>***NO PROFILE REQUIRED***</p>
            )}
            <p>NO EXTRAS!</p>
          </div>
        </div>
      </div>

      {/* Special Instructions */}
      {specialInstructions && (
        <div className="special-instructions">
          <h4>Special Instructions:</h4>
          <p>{specialInstructions}</p>
        </div>
      )}

      {/* Standard Warning */}
      <div className="special-instructions" style={{ marginTop: '10px', background: '#fff0f0' }}>
        <p>
          <strong>***BLACK WIRE IS NEGATIVE TO POWER SUPPLY***</strong>
        </p>
      </div>
    </div>
  )
}
