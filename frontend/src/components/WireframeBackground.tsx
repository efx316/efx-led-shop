export default function WireframeBackground() {
  const gridSize = 60 // Size of each grid cell in pixels
  const subGridSize = gridSize / 2 // Divide each square into 4 (30x30)

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
          {/* Main grid pattern - darker grey */}
          <pattern
            id="wireframe-grid-main"
            x="0"
            y="0"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M 0 0 L ${gridSize} 0 L ${gridSize} ${gridSize} L 0 ${gridSize} Z`}
              fill="none"
              stroke="#808080"
              strokeWidth="1"
            />
          </pattern>
          
          {/* Sub-grid pattern - lighter grey, divides each square into 4 */}
          <pattern
            id="wireframe-grid-sub"
            x="0"
            y="0"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            {/* Outer border */}
            <path
              d={`M 0 0 L ${gridSize} 0 L ${gridSize} ${gridSize} L 0 ${gridSize} Z`}
              fill="none"
              stroke="#808080"
              strokeWidth="1"
            />
            {/* Vertical divider */}
            <line
              x1={subGridSize}
              y1="0"
              x2={subGridSize}
              y2={gridSize}
              stroke="#6a6a6a"
              strokeWidth="0.5"
            />
            {/* Horizontal divider */}
            <line
              x1="0"
              y1={subGridSize}
              x2={gridSize}
              y2={subGridSize}
              stroke="#6a6a6a"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        {/* Main grid */}
        <rect width="100%" height="100%" fill="url(#wireframe-grid-main)" />
        {/* Sub-grid overlay */}
        <rect width="100%" height="100%" fill="url(#wireframe-grid-sub)" />
      </svg>
    </div>
  )
}
