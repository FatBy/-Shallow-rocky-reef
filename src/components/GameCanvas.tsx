import React, { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { MAP_SIZE, TILE_HEIGHT, TILE_WIDTH } from '../constants';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import { Skill, ThemeColor, HouseId } from '../types';

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

// Color Palettes for Isometric Cubes (Top, Left, Right faces)
const THEME_COLORS: Record<ThemeColor, { top: string, left: string, right: string, tailwind: string }> = {
  cyan: { top: '#22d3ee', left: '#0891b2', right: '#06b6d4', tailwind: 'bg-cyan-500 border-cyan-400 text-white shadow-cyan-500/50' },   // Tech
  amber: { top: '#fbbf24', left: '#b45309', right: '#f59e0b', tailwind: 'bg-amber-500 border-amber-400 text-black shadow-amber-500/50' }, // Retro
  emerald: { top: '#34d399', left: '#059669', right: '#10b981', tailwind: 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/50' }, // Status
  purple: { top: '#e879f9', left: '#9333ea', right: '#d946ef', tailwind: 'bg-purple-500 border-purple-400 text-white shadow-purple-500/50' }, // Magic
  blue: { top: '#60a5fa', left: '#2563eb', right: '#3b82f6', tailwind: 'bg-blue-500 border-blue-400 text-white shadow-blue-500/50' } // Default
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
  const scale = zoom; 
  const theme = THEME_COLORS[skill.theme] || THEME_COLORS.blue;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: Math.max(0.8, scale), y: isActive ? -15 : 0 }}
      style={{
        position: 'absolute',
        left: screenX,
        top: screenY - (50 * zoom), 
        transform: 'translate(-50%, -50%)',
        zIndex: 20, 
      }}
      className="pointer-events-none flex flex-col items-center justify-center"
    >
      <div className={`p-3 rounded-xl shadow-lg border-2 backdrop-blur-md transition-colors duration-300 ${isActive ? theme.tailwind : 'bg-gray-900/80 border-gray-700 text-gray-400'}`}>
        <IconComponent size={24} />
      </div>
      
      <span className={`mt-2 text-xs font-bold px-2 py-1 rounded bg-black/80 text-white backdrop-blur-md whitespace-nowrap origin-top border border-white/10 ${isActive ? 'text-white' : 'text-gray-400'}`}>
        {skill.name}
      </span>
      
      {isActive && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 px-3 py-1 bg-white text-black text-[10px] font-black tracking-widest rounded-full shadow-xl"
        >
          PRESS SPACE
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
    setZoomLevel,
    setCurrentView
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
          y: containerRef.current.clientHeight / 3 
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine active skill (closest)
  const activeSkill = skills.find(s => 
    Math.abs(s.x - Math.round(playerPos.x)) < 0.5 && 
    Math.abs(s.y - Math.round(playerPos.y)) < 0.5
  );

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key)) {
         // e.preventDefault(); 
      }

      if (document.activeElement?.tagName === 'INPUT') return;

      // Interaction Logic
      if (e.key === ' ' && activeSkill) {
         setCurrentView(activeSkill.id as HouseId);
         return;
      }

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
  }, [targetPos, setTargetPos, activeSkill, setCurrentView]);

  // Click to Move Handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const adjustedX = x - centerOffset.x;
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

          ctx.fillStyle = (x + y) % 2 === 0 ? '#0f172a' : '#1e293b'; 
          ctx.fill();
          
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 0.5 * zoomLevel;
          ctx.stroke();

          // Highlight Target
          if (x === Math.round(targetPos.x) && y === Math.round(targetPos.y)) {
             ctx.fillStyle = 'rgba(6, 182, 212, 0.2)'; 
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
          const skill = item.data as Skill;
          const theme = THEME_COLORS[skill.theme] || THEME_COLORS.blue;
          const height = 24 * zoomLevel; // Taller cubes for Houses
          
          // Top Face
          ctx.fillStyle = theme.top; 
          ctx.beginPath();
          ctx.moveTo(drawX, drawY - height);
          ctx.lineTo(drawX + TW / 2, drawY + TH / 2 - height);
          ctx.lineTo(drawX, drawY + TH - height);
          ctx.lineTo(drawX - TW / 2, drawY + TH / 2 - height);
          ctx.closePath();
          ctx.fill();
          
          // Outer Glow (Simulated by Shadow)
          ctx.shadowColor = theme.top;
          ctx.shadowBlur = 15;
          ctx.fill();
          ctx.shadowBlur = 0; 

          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 1 * zoomLevel;
          ctx.stroke();

          // Right Face
          ctx.fillStyle = theme.right; 
          ctx.beginPath();
          ctx.moveTo(drawX + TW / 2, drawY + TH / 2 - height);
          ctx.lineTo(drawX + TW / 2, drawY + TH / 2);
          ctx.lineTo(drawX, drawY + TH);
          ctx.lineTo(drawX, drawY + TH - height);
          ctx.closePath();
          ctx.fill();

          // Left Face
          ctx.fillStyle = theme.left; 
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
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
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

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-950 overflow-hidden">
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