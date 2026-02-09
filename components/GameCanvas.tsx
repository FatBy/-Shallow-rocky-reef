import React, { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { MAP_SIZE, TILE_HEIGHT, TILE_WIDTH } from '../constants';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skill } from '../types';

// Helper for isometric math with zoom
const isoToScreen = (x: number, y: number, zoom: number) => {
  return {
    x: (x - y) * (TILE_WIDTH * zoom / 2),
    y: (x + y) * (TILE_HEIGHT * zoom / 2),
  };
};

// Helper for screen to isometric grid conversion with zoom
const screenToIso = (screenX: number, screenY: number, zoom: number) => {
  const halfW = (TILE_WIDTH * zoom) / 2;
  const halfH = (TILE_HEIGHT * zoom) / 2;
  
  // Solve for x and y
  const x = (screenY / halfH + screenX / halfW) / 2;
  const y = (screenY / halfH - screenX / halfW) / 2;
  return { x, y };
};

interface SkillOverlayProps {
  skill: Skill;
  screenX: number;
  screenY: number;
  isActive: boolean;
  zoom: number;
}

// Skill Icon Overlay Component
const SkillOverlay: React.FC<SkillOverlayProps> = ({ skill, screenX, screenY, isActive, zoom }) => {
  const IconComponent = (Icons as any)[skill.iconName] || Icons.Box;
  const scale = zoom; // Scale icons slightly with zoom, but maybe clamp it so they don't get too huge/tiny

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: Math.max(0.8, scale), y: isActive ? -10 : 0 }}
      style={{
        position: 'absolute',
        left: screenX,
        top: screenY - (60 * zoom), // Adjust float height based on zoom
        transform: 'translate(-50%, -50%)',
        zIndex: 20, // Above canvas
      }}
      className="pointer-events-none flex flex-col items-center justify-center"
    >
      <div className={`p-2 rounded-lg shadow-lg border-2 ${isActive ? 'bg-blue-600 border-white text-white' : 'bg-gray-800 border-gray-600 text-gray-300'}`}>
        <IconComponent size={24} />
      </div>
      <span className={`mt-1 text-xs font-bold px-2 py-0.5 rounded bg-black/50 text-white backdrop-blur-sm whitespace-nowrap origin-top`}>
        {skill.name}
      </span>
      {isActive && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 px-3 py-1 bg-yellow-400 text-black text-xs font-bold rounded-full shadow-lg"
        >
          SPACE to Activate
        </motion.div>
      )}
    </motion.div>
  );
};

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    playerPos, 
    targetPos, 
    setPlayerPos, 
    setTargetPos, 
    skills,
    agentStatus,
    zoomLevel,
    setZoomLevel
  } = useGameStore();

  const [centerOffset, setCenterOffset] = useState({ x: 0, y: 0 });

  // Handle Window Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        setCenterOffset({
          x: containerRef.current.clientWidth / 2,
          y: containerRef.current.clientHeight / 4 // Start a bit higher up
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key)) {
         // e.preventDefault(); 
      }

      if (document.activeElement?.tagName === 'INPUT') return;

      let dx = 0;
      let dy = 0;

      if (e.key === 'w' || e.key === 'ArrowUp') { dx = -1; dy = -1; }
      if (e.key === 's' || e.key === 'ArrowDown') { dx = 1; dy = 1; }
      if (e.key === 'a' || e.key === 'ArrowLeft') { dx = -1; dy = 1; }
      if (e.key === 'd' || e.key === 'ArrowRight') { dx = 1; dy = -1; }

      if (dx !== 0 || dy !== 0) {
        const nextX = Math.round(targetPos.x + dx);
        const nextY = Math.round(targetPos.y + dy);

        if (nextX >= 0 && nextX < MAP_SIZE && nextY >= 0 && nextY < MAP_SIZE) {
          setTargetPos({ x: nextX, y: nextY });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetPos, setTargetPos]);

  // Click to Move Handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const adjustedX = x - centerOffset.x;
    // TILE_HEIGHT/2 also needs to be scaled by zoom when subtracting vertical offset? 
    // Yes, the visual center of the tile shifts with zoom.
    const adjustedY = y - centerOffset.y - (TILE_HEIGHT * zoomLevel / 2);
    
    const gridPos = screenToIso(adjustedX, adjustedY, zoomLevel);
    const targetX = Math.round(gridPos.x);
    const targetY = Math.round(gridPos.y);

    if (targetX >= 0 && targetX < MAP_SIZE && targetY >= 0 && targetY < MAP_SIZE) {
      setTargetPos({ x: targetX, y: targetY });
    }
  };

  // Zoom Handler
  const handleWheel = (e: React.WheelEvent) => {
    // Determine zoom direction
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel(zoomLevel + delta);
  };

  // Game Loop
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const lerpSpeed = 0.15;
      const newX = playerPos.x + (targetPos.x - playerPos.x) * lerpSpeed;
      const newY = playerPos.y + (targetPos.y - playerPos.y) * lerpSpeed;
      
      if (Math.abs(newX - targetPos.x) > 0.01 || Math.abs(newY - targetPos.y) > 0.01) {
        setPlayerPos({ x: newX, y: newY });
      }

      const offsetX = centerOffset.x;
      const offsetY = centerOffset.y;
      
      // Scaled Tile Dimensions
      const TW = TILE_WIDTH * zoomLevel;
      const TH = TILE_HEIGHT * zoomLevel;

      // Draw Grid
      for (let x = 0; x < MAP_SIZE; x++) {
        for (let y = 0; y < MAP_SIZE; y++) {
          const screen = isoToScreen(x, y, zoomLevel);
          const drawX = screen.x + offsetX;
          const drawY = screen.y + offsetY;

          ctx.beginPath();
          ctx.moveTo(drawX, drawY);
          ctx.lineTo(drawX + TW / 2, drawY + TH / 2);
          ctx.lineTo(drawX, drawY + TH);
          ctx.lineTo(drawX - TW / 2, drawY + TH / 2);
          ctx.closePath();

          ctx.fillStyle = (x + y) % 2 === 0 ? '#1f2937' : '#374151'; 
          ctx.fill();
          
          ctx.strokeStyle = '#4b5563';
          ctx.lineWidth = 0.5 * zoomLevel;
          ctx.stroke();

          if (x === Math.round(targetPos.x) && y === Math.round(targetPos.y)) {
             ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
             ctx.fill();
          }
        }
      }

      const renderList: any[] = [];
      skills.forEach(s => renderList.push({ type: 'skill', x: s.x, y: s.y, data: s }));
      renderList.push({ type: 'player', x: playerPos.x, y: playerPos.y, data: null });
      renderList.sort((a, b) => (a.x + a.y) - (b.x + b.y));

      renderList.forEach(item => {
        const screen = isoToScreen(item.x, item.y, zoomLevel);
        const drawX = screen.x + offsetX;
        const drawY = screen.y + offsetY;

        if (item.type === 'skill') {
          const height = 20 * zoomLevel; 
          
          // Top Face
          ctx.fillStyle = '#4f46e5'; 
          ctx.beginPath();
          ctx.moveTo(drawX, drawY - height);
          ctx.lineTo(drawX + TW / 2, drawY + TH / 2 - height);
          ctx.lineTo(drawX, drawY + TH - height);
          ctx.lineTo(drawX - TW / 2, drawY + TH / 2 - height);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#818cf8';
          ctx.lineWidth = 1 * zoomLevel;
          ctx.stroke();

          // Right Face
          ctx.fillStyle = '#3730a3'; 
          ctx.beginPath();
          ctx.moveTo(drawX + TW / 2, drawY + TH / 2 - height);
          ctx.lineTo(drawX + TW / 2, drawY + TH / 2);
          ctx.lineTo(drawX, drawY + TH);
          ctx.lineTo(drawX, drawY + TH - height);
          ctx.closePath();
          ctx.fill();

          // Left Face
          ctx.fillStyle = '#312e81'; 
          ctx.beginPath();
          ctx.moveTo(drawX - TW / 2, drawY + TH / 2 - height);
          ctx.lineTo(drawX - TW / 2, drawY + TH / 2);
          ctx.lineTo(drawX, drawY + TH);
          ctx.lineTo(drawX, drawY + TH - height);
          ctx.closePath();
          ctx.fill();

        } else if (item.type === 'player') {
          const pY = drawY - (10 * zoomLevel); 
          const radius = 8 * zoomLevel;
          const shadowRadiusX = 10 * zoomLevel;
          const shadowRadiusY = 5 * zoomLevel;
          
          // Shadow
          ctx.beginPath();
          ctx.ellipse(drawX, drawY + TH/2, shadowRadiusX, shadowRadiusY, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fill();

          // Body
          ctx.beginPath();
          ctx.arc(drawX, pY, radius, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          
          // Drone
          const time = Date.now() / 500;
          const orbitRadius = 20 * zoomLevel;
          const droneRadius = 5 * zoomLevel;
          
          const droneX = drawX + Math.cos(time) * orbitRadius;
          const droneY = pY - orbitRadius + Math.sin(time) * (5 * zoomLevel);
          
          ctx.beginPath();
          ctx.arc(droneX, droneY, droneRadius, 0, Math.PI * 2);
          
          if (agentStatus === 'idle') ctx.fillStyle = '#60a5fa'; 
          else if (agentStatus === 'processing') ctx.fillStyle = '#fbbf24'; 
          else if (agentStatus === 'error') ctx.fillStyle = '#ef4444'; 
          ctx.fill();
          
          if (agentStatus === 'processing') {
             ctx.strokeStyle = '#fbbf24';
             ctx.lineWidth = 2 * zoomLevel;
             ctx.beginPath();
             ctx.arc(droneX, droneY, droneRadius + 3 * zoomLevel, time * 2, time * 2 + Math.PI);
             ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [playerPos, targetPos, centerOffset, skills, agentStatus, zoomLevel]);

  const activeSkill = skills.find(s => 
    Math.abs(s.x - Math.round(playerPos.x)) < 0.5 && 
    Math.abs(s.y - Math.round(playerPos.y)) < 0.5
  );

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-900 overflow-hidden">
      <canvas 
        ref={canvasRef} 
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        className="block cursor-pointer outline-none" 
      />
      
      <div className="absolute inset-0 pointer-events-none">
        {skills.map(skill => {
            const screen = isoToScreen(skill.x, skill.y, zoomLevel);
            return (
                <SkillOverlay 
                    key={skill.id}
                    skill={skill}
                    screenX={screen.x + centerOffset.x}
                    screenY={screen.y + centerOffset.y}
                    isActive={activeSkill?.id === skill.id}
                    zoom={zoomLevel}
                />
            );
        })}
      </div>
      
      {/* Zoom Level Indicator */}
      <div className="absolute bottom-4 left-4 pointer-events-none text-white/30 text-xs font-mono">
        ZOOM: {Math.round(zoomLevel * 100)}%
      </div>
    </div>
  );
};
