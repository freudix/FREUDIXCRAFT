import React, { useRef, useEffect } from 'react';
import { VoxelEngine } from './core/VoxelEngine';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<VoxelEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize the voxel engine
    engineRef.current = new VoxelEngine(canvasRef.current);

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ margin: 0, padding: 0, overflow: 'hidden', background: '#000' }}>
      <canvas 
        ref={canvasRef}
        style={{ 
          display: 'block',
          margin: 0,
          padding: 0,
          width: '100vw',
          height: '100vh'
        }}
      />
      
      {/* Loading overlay */}
      <div 
        id="loading-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: "'Courier New', monospace",
          zIndex: 2000,
          animation: 'fadeOut 2s ease-in-out 3s forwards'
        }}
      >
        <div style={{ 
          fontSize: '48px', 
          fontWeight: 'bold', 
          marginBottom: '20px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          🌍 FreudixCraft
        </div>
        
        <div style={{ 
          fontSize: '18px', 
          marginBottom: '30px',
          opacity: 0.8
        }}>
          Voxel Sandbox Survival Game
        </div>
        
        <div style={{ 
          width: '200px', 
          height: '4px', 
          background: 'rgba(255,255,255,0.3)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '20px'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #4CAF50, #81C784)',
            borderRadius: '2px',
            animation: 'loading 3s ease-in-out forwards'
          }} />
        </div>
        
        <div style={{ 
          fontSize: '14px', 
          opacity: 0.6,
          textAlign: 'center'
        }}>
          Click to start • WASD to move • Mouse to look<br/>
          Left click: Break • Right click: Place • Scroll: Change block
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; display: none; }
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #000;
          cursor: none;
        }
        
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}

export default App;