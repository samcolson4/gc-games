import { useRef, useState, useEffect } from 'react';
import { ReactSVGPanZoom, Value, Tool, Mode } from 'react-svg-pan-zoom';
import suburbsSvg from '../assets/suburbs.svg?url';
import { colors } from '../styles/tokens';
import { editorialStyles } from '../styles/editorialStyles';

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
      const containerWidth = Math.min(window.innerWidth - 80, 1100);
      setDimensions({
        width: isMobile ? Math.min(window.innerWidth - 32, 800) : containerWidth,
        height: isMobile ? Math.min(window.innerHeight - 200, 600) : 600,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div style={{ ...editorialStyles.pageContainer, paddingBottom: 80 }}>
      <div style={editorialStyles.eyebrow}>Reference</div>
      <h2 style={editorialStyles.gameTitle}>Suburb</h2>
      <p style={editorialStyles.dek}>
        A pan-and-zoom reference map of the suburbs — drag to move, scroll to zoom.
      </p>
      <div
        style={{
          marginTop: 28,
          border: `1px solid ${colors.ink}`,
          width: '100%',
          overflow: 'hidden',
        }}
      >
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
    </div>
  );
}

export default Suburb;
