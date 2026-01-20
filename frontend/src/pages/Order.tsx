import LEDOrderFlow from '../components/LEDOrderFlow'

export default function Order() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2 text-white tracking-tight">Custom LED Order</h1>
      <p className="text-gray-400 mb-8 font-light">
        Follow the simple steps below to configure your custom LED strip
      </p>
      <LEDOrderFlow />
    </div>
  )
}

