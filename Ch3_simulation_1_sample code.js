import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Info, Activity, MousePointer2 } from 'lucide-react';

/**
 * Newton's 3rd Law Interactive Simulation
 * * 시나리오 1: 망치와 못 (접촉력) - 충격량과 반작용
 * 시나리오 2: 지구와 달 (비접촉력) - 만유인력과 거리/질량 관계
 */

const NewtonLab = () => {
  const [activeTab, setActiveTab] = useState('hammer'); // 'hammer' | 'orbit'
  const [showInfo, setShowInfo] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800">
      {/* --- Header --- */}
      <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <Activity className="text-blue-400" />
          <h1 className="text-xl font-bold tracking-tight">Newton's 3rd Law Lab</h1>
        </div>
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('hammer')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'hammer' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Example 1: Contact Force
          </button>
          <button
            onClick={() => setActiveTab('orbit')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'orbit' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Example 2: Non-contact Force
          </button>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'hammer' ? <HammerSimulation /> : <OrbitSimulation />}
      </main>

      {/* --- Global Info Box (Floating) --- */}
      <div className={`fixed bottom-6 right-6 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 transition-all duration-300 transform ${showInfo ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-blue-50 rounded-t-xl">
          <h3 className="font-bold text-blue-900 flex items-center gap-2">
            <Info size={18} />
            Key Concept
          </h3>
          <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="p-4 text-sm text-slate-600 leading-relaxed">
          <p className="mb-2"><strong>Newton's Third Law:</strong> For every action, there is an equal and opposite reaction.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Forces always come in pairs.</li>
            <li>Two forces are equal in magnitude.</li>
            <li>Two forces act in opposite directions.</li>
          </ul>
        </div>
      </div>
      
      {!showInfo && (
        <button 
          onClick={() => setShowInfo(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <Info size={24} />
        </button>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* SCENARIO 1: HAMMER                           */
/* -------------------------------------------------------------------------- */

const HammerSimulation = () => {
  // State
  const [mass, setMass] = useState(5);    // 1-10 kg
  const [velocity, setVelocity] = useState(5); // 1-10 m/s
  const [isStriking, setIsStriking] = useState(false);
  const [impactData, setImpactData] = useState({ force: 0, active: false });
  
  // Refs for animation
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const stateRef = useRef({ 
    hammerY: 100, 
    nailY: 300, 
    phase: 'idle', // idle, down, contact, up
    progress: 0 
  });

  // Constants
  const GROUND_Y = 350;
  const NAIL_HEAD_Y_INITIAL = 300;
  
  // Physics Calculation
  // F = ma (impulse approximation for visualization)
  const calculateForce = () => Math.round(mass * velocity * 20); 

  const handleStrike = () => {
    if (isStriking) return;
    setIsStriking(true);
    stateRef.current.phase = 'down';
    setImpactData({ force: 0, active: false });
  };

  const reset = () => {
    setIsStriking(false);
    stateRef.current = { hammerY: 100, nailY: NAIL_HEAD_Y_INITIAL, phase: 'idle', progress: 0 };
    setImpactData({ force: 0, active: false });
  };

  // Animation Loop
  const draw = useCallback((ctx) => {
    const { width, height } = ctx.canvas;
    const state = stateRef.current;
    
    // Clear
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Ground
    ctx.fillStyle = '#8B4513'; // SaddleBrown
    ctx.fillRect(0, GROUND_Y, width, height - GROUND_Y);
    ctx.fillStyle = '#A0522D'; // Sienna pattern
    for(let i=0; i<width; i+=40) ctx.fillRect(i, GROUND_Y, 20, height-GROUND_Y);

    // 2. Draw Nail
    const nailX = width / 2;
    const nailHeight = 60;
    const currentNailY = state.nailY; 
    
    ctx.beginPath();
    ctx.fillStyle = '#94a3b8'; // Slate 400
    // Nail body
    ctx.fillRect(nailX - 5, currentNailY, 10, nailHeight);
    // Nail head
    ctx.fillStyle = '#64748b'; // Slate 500
    ctx.fillRect(nailX - 12, currentNailY, 24, 8);
    
    // 3. Draw Hammer
    // Hammer position interpolation
    let hammerY = state.hammerY;
    const targetY = currentNailY - 40; // Just above nail head

    if (state.phase === 'down') {
      // Accelerate down
      const speed = velocity * 2; 
      state.hammerY += speed;
      if (state.hammerY >= targetY) {
        state.hammerY = targetY;
        state.phase = 'contact';
        state.impactTimer = 0;
        
        // Trigger Impact Visuals
        const forceVal = calculateForce();
        setImpactData({ force: forceVal, active: true });
        
        // Drive nail in slightly based on force (max 30px)
        const depth = Math.min(30, forceVal / 50); 
        state.targetNailY = Math.min(GROUND_Y - 10, state.nailY + depth);
      }
    } else if (state.phase === 'contact') {
      // Hold for a moment to show arrows
      state.impactTimer++;
      
      // Animate nail going down
      if (state.nailY < state.targetNailY) {
          state.nailY += 2;
          state.hammerY += 2; // Hammer follows nail
      }

      if (state.impactTimer > 40) { // Hold frames
        state.phase = 'up';
        setImpactData(prev => ({ ...prev, active: false })); // Hide arrows
      }
    } else if (state.phase === 'up') {
      state.hammerY -= 5;
      if (state.hammerY <= 100) {
        state.hammerY = 100;
        state.phase = 'idle';
        setIsStriking(false);
      }
    }

    hammerY = state.hammerY;

    // Draw Hammer Head
    ctx.fillStyle = '#475569'; // Slate 600
    ctx.fillRect(nailX - 30, hammerY, 60, 40);
    // Draw Hammer Handle
    ctx.fillStyle = '#d97706'; // Amber 600
    ctx.fillRect(nailX - 5, hammerY - 80, 10, 80);

    // 4. Draw Forces (Only on Contact)
    if (state.phase === 'contact') {
      const forceMag = calculateForce();
      const arrowLength = Math.min(120, forceMag / 10); // Scale for visual

      // F_H (Hammer on Nail) - Downward Red
      drawArrow(ctx, nailX + 40, currentNailY, nailX + 40, currentNailY + arrowLength, '#ef4444', `F_H`);
      
      // F_N (Nail on Hammer) - Upward Blue
      drawArrow(ctx, nailX - 40, currentNailY, nailX - 40, currentNailY - arrowLength, '#3b82f6', `F_N`);
    }

  }, [mass, velocity]);

  // Helper: Draw Arrow
  const drawArrow = (ctx, fromX, fromY, toX, toY, color, label) => {
    const headlen = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 4;
    
    // Line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.fill();

    // Label
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(label, toX + 15, (fromY + toY) / 2);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const render = () => {
      draw(ctx);
      animationRef.current = requestAnimationFrame(render);
    };
    render();
    
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw]);

  return (
    <div className="flex w-full h-full">
      {/* Controls */}
      <div className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 shadow-sm z-10 overflow-y-auto">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Controls</h2>
          <p className="text-xs text-slate-500 mb-6">Adjust mass and velocity to observe force pairs.</p>
          
          <div className="space-y-6">
            <ControlSlider 
              label="Hammer Mass (kg)" 
              value={mass} 
              setValue={setMass} 
              min={1} max={10} 
              disabled={isStriking}
            />
            <ControlSlider 
              label="Swing Speed (m/s)" 
              value={velocity} 
              setValue={setVelocity} 
              min={1} max={10} 
              disabled={isStriking}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          <button
            onClick={handleStrike}
            disabled={isStriking}
            className={`flex-1 py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              isStriking 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
            }`}
          >
            <Play size={18} fill="currentColor" />
            STRIKE
          </button>
          <button
            onClick={reset}
            disabled={isStriking}
            className="p-3 rounded-lg border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
            title="Reset"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative bg-slate-100 flex flex-col">
        {/* Data Dashboard Overlay */}
        <div className="absolute top-6 left-6 flex gap-4">
          <DataCard 
            title="Force on Nail (Action)" 
            value={impactData.active ? `${impactData.force} N` : '--'} 
            color="text-red-600"
            sub="F_H"
          />
          <div className="flex items-center text-slate-400 font-bold text-xl">=</div>
          <DataCard 
            title="Force on Hammer (Reaction)" 
            value={impactData.active ? `${impactData.force} N` : '--'} 
            color="text-blue-600"
            sub="F_N"
          />
        </div>

        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600} 
          className="w-full h-full object-cover cursor-crosshair"
        />
        
        {/* Instructions Overlay */}
        {!isStriking && impactData.force === 0 && (
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full text-slate-600 text-sm font-medium shadow-sm animate-pulse border border-slate-200">
            Click "STRIKE" to begin experiment
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* SCENARIO 2: ORBIT                            */
/* -------------------------------------------------------------------------- */

const OrbitSimulation = () => {
  // State
  const [earthMass, setEarthMass] = useState(5); // 1-10 (x10^24 kg equivalent)
  const [moonMass, setMoonMass] = useState(2);   // 1-10 (x10^22 kg equivalent)
  const [distance, setDistance] = useState(200); // px
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Animation Loop (Rotation only, positions are static relative to center/orbit)
  const angleRef = useRef(0);

  const calculateGravity = () => {
    // F = G * m1 * m2 / r^2
    // Simplified for visualization
    const G = 2000; 
    return Math.round((G * earthMass * moonMass) / (distance * 0.5));
  };

  const draw = useCallback((ctx) => {
    const { width, height } = ctx.canvas;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);
    
    // Update angle for orbital motion effect
    angleRef.current += 0.005 + (100/distance) * 0.005; // Faster when closer

    // Positions
    // Earth stays in center
    const earthRadius = 20 + earthMass * 4;
    
    // Moon orbits
    const moonX = centerX + Math.cos(angleRef.current) * distance;
    const moonY = centerY + Math.sin(angleRef.current) * distance;
    const moonRadius = 10 + moonMass * 2;

    // 1. Draw Orbit Path
    ctx.beginPath();
    ctx.strokeStyle = '#e2e8f0'; // Slate 200
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.arc(centerX, centerY, distance, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Draw Connection Line (Field)
    ctx.beginPath();
    ctx.strokeStyle = '#cbd5e1'; // Slate 300
    ctx.lineWidth = 1;
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(moonX, moonY);
    ctx.stroke();

    // 3. Draw Forces
    const forceMag = calculateGravity();
    const arrowLength = Math.min(distance - earthRadius - moonRadius, forceMag / 5);

    // F_E (Earth pulls Moon) - Action on Moon
    const angleToEarth = Math.atan2(centerY - moonY, centerX - moonX);
    drawArrow(
      ctx, 
      moonX, moonY, 
      moonX + Math.cos(angleToEarth) * arrowLength, 
      moonY + Math.sin(angleToEarth) * arrowLength, 
      '#ef4444', 
      'F_E'
    );

    // F_M (Moon pulls Earth) - Reaction on Earth
    const angleToMoon = Math.atan2(moonY - centerY, moonX - centerX);
    drawArrow(
      ctx, 
      centerX, centerY, 
      centerX + Math.cos(angleToMoon) * arrowLength, 
      centerY + Math.sin(angleToMoon) * arrowLength, 
      '#3b82f6', 
      'F_M'
    );

    // 4. Draw Earth
    ctx.beginPath();
    ctx.fillStyle = '#3b82f6'; // Blue 500
    ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
    ctx.fill();
    // Earth glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(59, 130, 246, 0.5)";
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 5. Draw Moon
    ctx.beginPath();
    ctx.fillStyle = '#94a3b8'; // Slate 400
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();

  }, [earthMass, moonMass, distance]);

  // Helper: Draw Arrow (Duplicated for independence)
  const drawArrow = (ctx, fromX, fromY, toX, toY, color, label) => {
    const headlen = 12;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 5;
    
    // Line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.fill();

    // Label Background
    ctx.font = "bold 14px sans-serif";
    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = "white";
    // ctx.fillRect(toX + 10, (fromY + toY)/2 - 10, textWidth + 10, 20);
    
    ctx.fillStyle = color;
    ctx.fillText(label, toX + (Math.cos(angle)*20), toY + (Math.sin(angle)*20));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const render = () => {
      draw(ctx);
      animationRef.current = requestAnimationFrame(render);
    };
    render();
    
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw]);

  return (
    <div className="flex w-full h-full">
      {/* Controls */}
      <div className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 shadow-sm z-10 overflow-y-auto">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Gravity Controls</h2>
          <p className="text-xs text-slate-500 mb-6">Change mass and distance to see how gravity changes symmetrically.</p>
          
          <div className="space-y-8">
            <ControlSlider 
              label="Earth Mass (M1)" 
              value={earthMass} 
              setValue={setEarthMass} 
              min={1} max={10} 
            />
            <ControlSlider 
              label="Moon Mass (M2)" 
              value={moonMass} 
              setValue={setMoonMass} 
              min={1} max={10} 
            />
            <ControlSlider 
              label="Distance (r)" 
              value={distance} 
              setValue={setDistance} 
              min={120} max={350} 
            />
          </div>
        </div>
        
        <div className="mt-auto bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Discovery</h4>
          <p className="text-xs text-blue-700 leading-tight">
            Notice that even if the Earth is much bigger, the arrow pulling the Earth is 
            <strong> exactly the same length</strong> as the arrow pulling the Moon.
          </p>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative bg-slate-900 flex flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950"></div>
        
        {/* Stars background effect */}
        <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '50px 50px'}}></div>

        {/* Data Dashboard */}
        <div className="absolute top-6 left-6 flex gap-4 z-10">
          <DataCard 
            title="Force on Moon (F_E)" 
            value={`${calculateGravity()} G`} 
            color="text-red-500"
            bgColor="bg-slate-800/80"
            textColor="text-white"
            sub="Action"
          />
          <div className="flex items-center text-slate-400 font-bold text-xl">=</div>
          <DataCard 
            title="Force on Earth (F_M)" 
            value={`${calculateGravity()} G`} 
            color="text-blue-500"
            bgColor="bg-slate-800/80"
            textColor="text-white"
            sub="Reaction"
          />
        </div>

        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600} 
          className="w-full h-full object-cover z-0"
        />
        
        {/* Instructions Overlay */}
        <div className="absolute bottom-10 right-10 flex gap-2 pointer-events-none">
           <div className="bg-slate-800/80 backdrop-blur text-white text-xs px-3 py-1 rounded border border-slate-700">
             Formula: F ∝ (m1 × m2) / r²
           </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* SHARED COMPONENTS                            */
/* -------------------------------------------------------------------------- */

const ControlSlider = ({ label, value, setValue, min, max, disabled }) => (
  <div className={`space-y-3 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
    <div className="flex justify-between items-center">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{value}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      value={value} 
      onChange={(e) => setValue(Number(e.target.value))}
      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
    />
    <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
      <span>Low</span>
      <span>High</span>
    </div>
  </div>
);

const DataCard = ({ title, value, color, sub, bgColor = "bg-white/90", textColor = "text-slate-800" }) => (
  <div className={`${bgColor} backdrop-blur-md px-5 py-3 rounded-xl border border-slate-200/50 shadow-lg min-w-[160px]`}>
    <div className={`text-[10px] uppercase font-bold tracking-wider mb-1 opacity-70 ${textColor}`}>{title}</div>
    <div className={`text-2xl font-mono font-bold ${color} flex items-baseline gap-2`}>
      {value}
      {sub && <span className="text-xs text-slate-400 font-normal">({sub})</span>}
    </div>
  </div>
);

export default NewtonLab;