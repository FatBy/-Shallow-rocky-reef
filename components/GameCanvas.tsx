import React, { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { MAP_SIZE, TILE_HEIGHT, TILE_WIDTH } from '../constants';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skill } from '../types';

// Helper for isometric math
const isoToScreen = (x: number, y: number) => {
  return {
    x: (x - y) * (TILE_WIDTH / 2),
    y: (x + y) * (TILE_HEIGHT / 2),
  };
};

interface SkillOverlayProps {
  skill: Skill;
  screenX: number;
  screenY: number;
  isActive: boolean;
}

// Skill Icon Overlay Component
const SkillOverlay: React.FC<SkillOverlayProps> = ({ skill, screenX, screenY, isActive }) => {
  const IconComponent = (Icons as any)[skill.iconName] || Icons.Box;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1, y: isActive ? -10 : 0 }}
      style={{
        position: 'absolute',
        left: screenX,
        top: screenY - 60, // Float above the tile
        transform: 'translate(-50%, -50%)',
        zIndex: 20, // Above canvas
      }}
      className="pointer-events-none flex flex-col items-center justify-center"
    >
      <div className={`p-2 rounded-lg shadow-lg border-2 ${isActive ? 'bg-blue-600 border-white text-white' : 'bg-gray-800 border-gray-600 text-gray-300'}`}>
        <IconComponent size={24} />
      </div>
      <span className={`mt-1 text-xs font-bold px-2 py-0.5 rounded bg-black/50 text-white backdrop-blur-sm whitespace-nowrap`}>
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
    agentStatus 
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
      // Prevent default scrolling for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key)) {
         // e.preventDefault(); // Optional: might block input typing if not careful
      }

      // Check if user is typing in an input field (simple check)
      if (document.activeElement?.tagName === 'INPUT') return;

      let dx = 0;
      let dy = 0;

      if (e.key === 'w' || e.key === 'ArrowUp') { dx = -1; dy = -1; } // Isometric Up (actually North in Iso is usually Up-Right or Up-Left depending on convention, but mapping W to -x,-y is common for "up" visual on screen)
      // Correction: W key should move visually UP.
      // In Iso: 
      // x-y moves Up-Right on screen? No.
      // x increases moves Down-Right.
      // y increases moves Down-Left.
      // To move UP SCREEN: decrease X and decrease Y.
      // To move DOWN SCREEN: increase X and increase Y.
      // To move LEFT SCREEN: decrease X and increase Y.
      // To move RIGHT SCREEN: increase X and decrease Y.
      
      if (e.key === 'w' || e.key === 'ArrowUp') { dx = -1; dy = -1; }
      if (e.key === 's' || e.key === 'ArrowDown') { dx = 1; dy = 1; }
      if (e.key === 'a' || e.key === 'ArrowLeft') { dx = -1; dy = 1; }
      if (e.key === 'd' || e.key === 'ArrowRight') { dx = 1; dy = -1; }

      if (dx !== 0 || dy !== 0) {
        const nextX = Math.round(targetPos.x + dx);
        const nextY = Math.round(targetPos.y + dy);

        // Bounds check
        if (nextX >= 0 && nextX < MAP_SIZE && nextY >= 0 && nextY < MAP_SIZE) {
          setTargetPos({ x: nextX, y: nextY });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetPos, setTargetPos]);

  // Game Loop
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Interpolate Player Position
      const lerpSpeed = 0.15;
      const newX = playerPos.x + (targetPos.x - playerPos.x) * lerpSpeed;
      const newY = playerPos.y + (targetPos.y - playerPos.y) * lerpSpeed;
      
      // Update store only if significant change to avoid React render spam,
      // but here we are inside animation frame. 
      // We will perform the update in the next React cycle via store to keep react components active,
      // OR just use local var for rendering and update store less frequently.
      // For this scale, updating store every frame is okayish, but better to check diff.
      if (Math.abs(newX - targetPos.x) > 0.01 || Math.abs(newY - targetPos.y) > 0.01) {
        setPlayerPos({ x: newX, y: newY });
      }

      // Drawing Constants
      const offsetX = centerOffset.x;
      const offsetY = centerOffset.y;

      // Draw Grid
      for (let x = 0; x < MAP_SIZE; x++) {
        for (let y = 0; y < MAP_SIZE; y++) {
          const screen = isoToScreen(x, y);
          const drawX = screen.x + offsetX;
          const drawY = screen.y + offsetY;

          // Draw Tile
          ctx.beginPath();
          ctx.moveTo(drawX, drawY);
          ctx.lineTo(drawX + TILE_WIDTH / 2, drawY + TILE_HEIGHT / 2);
          ctx.lineTo(drawX, drawY + TILE_HEIGHT);
          ctx.lineTo(drawX - TILE_WIDTH / 2, drawY + TILE_HEIGHT / 2);
          ctx.closePath();

          // Coloring
          ctx.fillStyle = (x + y) % 2 === 0 ? '#1f2937' : '#374151'; // Checkered dark gray
          ctx.fill();
          
          // Highlight hover or grid lines
          ctx.strokeStyle = '#4b5563';
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // Highlight Target Tile
          if (x === Math.round(targetPos.x) && y === Math.round(targetPos.y)) {
             ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
             ctx.fill();
          }
        }
      }

      // Render Entities Sorted by Depth (X + Y)
      // We need to render Buildings and Player/Drone in correct order.
      // Order factor: (x + y). 
      // If same, prioritize moving entity?
      
      // Buildings
      skills.forEach(skill => {
        // Simple Building Block
        const screen = isoToScreen(skill.x, skill.y);
        const drawX = screen.x + offsetX;
        const drawY = screen.y + offsetY;
        
        // Only draw building base if 'behind' player, otherwise draw after?
        // Actually, simple Painter's algo: Loop x+y from 0 to MAX.
      });
      
      const renderList: any[] = [];
      
      // Add Skills
      skills.forEach(s => renderList.push({ type: 'skill', x: s.x, y: s.y, data: s }));
      
      // Add Player
      renderList.push({ type: 'player', x: playerPos.x, y: playerPos.y, data: null });
      
      // Sort
      renderList.sort((a, b) => (a.x + a.y) - (b.x + b.y));

      renderList.forEach(item => {
        const screen = isoToScreen(item.x, item.y);
        const drawX = screen.x + offsetX;
        const drawY = screen.y + offsetY;

        if (item.type === 'skill') {
          // Draw Building Block
          const height = 20; // building height
          
          // Top Face
          ctx.fillStyle = '#4f46e5'; // Indigo 600
          ctx.beginPath();
          ctx.moveTo(drawX, drawY - height);
          ctx.lineTo(drawX + TILE_WIDTH / 2, drawY + TILE_HEIGHT / 2 - height);
          ctx.lineTo(drawX, drawY + TILE_HEIGHT - height);
          ctx.lineTo(drawX - TILE_WIDTH / 2, drawY + TILE_HEIGHT / 2 - height);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#818cf8';
          ctx.stroke();

          // Right Face
          ctx.fillStyle = '#3730a3'; // Indigo 800
          ctx.beginPath();
          ctx.moveTo(drawX + TILE_WIDTH / 2, drawY + TILE_HEIGHT / 2 - height);
          ctx.lineTo(drawX + TILE_WIDTH / 2, drawY + TILE_HEIGHT / 2);
          ctx.lineTo(drawX, drawY + TILE_HEIGHT);
          ctx.lineTo(drawX, drawY + TILE_HEIGHT - height);
          ctx.closePath();
          ctx.fill();

          // Left Face
          ctx.fillStyle = '#312e81'; // Indigo 900
          ctx.beginPath();
          ctx.moveTo(drawX - TILE_WIDTH / 2, drawY + TILE_HEIGHT / 2 - height);
          ctx.lineTo(drawX - TILE_WIDTH / 2, drawY + TILE_HEIGHT / 2);
          ctx.lineTo(drawX, drawY + TILE_HEIGHT);
          ctx.lineTo(drawX, drawY + TILE_HEIGHT - height);
          ctx.closePath();
          ctx.fill();

        } else if (item.type === 'player') {
          // Draw Player (Cylinder/Capsule)
          const pY = drawY - 10; // Levitate slightly or stand on tile
          
          // Shadow
          ctx.beginPath();
          ctx.ellipse(drawX, drawY + TILE_HEIGHT/2, 10, 5, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fill();

          // Body
          ctx.beginPath();
          ctx.arc(drawX, pY, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          
          // Drone (Orbiting)
          const time = Date.now() / 500;
          const droneX = drawX + Math.cos(time) * 20;
          const droneY = pY - 20 + Math.sin(time) * 5;
          
          ctx.beginPath();
          ctx.arc(droneX, droneY, 5, 0, Math.PI * 2);
          
          // Drone Color based on Agent Status
          if (agentStatus === 'idle') ctx.fillStyle = '#60a5fa'; // Blue
          else if (agentStatus === 'processing') ctx.fillStyle = '#fbbf24'; // Yellow
          else if (agentStatus === 'error') ctx.fillStyle = '#ef4444'; // Red
          
          ctx.fill();
          
          // Processing Ring
          if (agentStatus === 'processing') {
             ctx.strokeStyle = '#fbbf24';
             ctx.lineWidth = 2;
             ctx.beginPath();
             ctx.arc(droneX, droneY, 8, time * 2, time * 2 + Math.PI);
             ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [playerPos, targetPos, centerOffset, skills, agentStatus]);

  // Determine active skill for React Overlays
  const activeSkill = skills.find(s => 
    Math.abs(s.x - Math.round(playerPos.x)) < 0.5 && 
    Math.abs(s.y - Math.round(playerPos.y)) < 0.5
  );

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-900 overflow-hidden">
      <canvas ref={canvasRef} className="block" />
      
      {/* Overlay Layer for Skill Icons */}
      <div className="absolute inset-0 pointer-events-none">
        {skills.map(skill => {
            const screen = isoToScreen(skill.x, skill.y);
            return (
                <SkillOverlay 
                    key={skill.id}
                    skill={skill}
                    screenX={screen.x + centerOffset.x}
                    screenY={screen.y + centerOffset.y}
                    isActive={activeSkill?.id === skill.id}
                />
            );
        })}
      </div>
    </div>
  );
};