import { useRef, useState, useEffect } from 'react';
import { ReactSVGPanZoom, Value, Tool, Mode } from 'react-svg-pan-zoom';
import suburbsSvg from '../assets/suburbs.svg?url';

function Suburb() {
  const Viewer = useRef(null);
  const [tool, setTool] = useState<Tool>("auto");
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [value, setValue] = useState<Value>({
    version: 2,
    mode: "pan" as Mode,
    focus: false,
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0,
    viewerWidth: 1500,
    viewerHeight: 1500,
    SVGWidth: 1500,
    SVGHeight: 1500,
    startX: null,
    startY: null,
    endX: null,
    endY: null,
    miniatureOpen: false
  });

  useEffect(() => {
    const updateDimensions = () => {
      const isMobile = window.innerWidth < 768;
      setDimensions({
        width: isMobile ? Math.min(window.innerWidth - 32, 800) : 800,
        height: isMobile ? Math.min(window.innerHeight - 200, 600) : 600,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    minHeight: '100vh',
    padding: '1rem',
    boxSizing: 'border-box',
  };

  return (
    <div style={containerStyle}>
      <ReactSVGPanZoom
        width={dimensions.width}
        height={dimensions.height}
        ref={Viewer}
        tool={tool}
        detectAutoPan={false}
        value={value}
        onChangeValue={setValue}
        onChangeTool={setTool}
      >
        <svg width={dimensions.width} height={dimensions.height}>
          <image href={suburbsSvg} width="1000" height="1000" />
        </svg>
      </ReactSVGPanZoom>
    </div>
  );
}

export default Suburb;
