import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { User } from '../store';

interface WheelProps {
  activeUsers: User[];
  currentUserId: string;
}

export const Wheel = ({ activeUsers, currentUserId }: WheelProps) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (activeUsers.length === 0) return;

    const userIndex = activeUsers.findIndex(u => u.id === currentUserId);
    if (userIndex === -1) return;

    // Calculate slice angle
    const sliceAngle = 360 / activeUsers.length;
    
    // We want the selected user to be at the top (which is -90 degrees in SVG, or 270)
    // The top is 0 degrees of our visual rotation, but the slice is drawn from 0 (right) to sliceAngle.
    // So the center of the slice is userIndex * sliceAngle + sliceAngle / 2.
    // To bring it to the top (which is -90deg rotation of the whole circle, assuming 0 is top. Wait, CSS rotation 0 is top? No, CSS transform rotate(0) keeps it as is. 
    // Let's just say we rotate the wheel so that the target slice is at the top.
    
    const targetAngle = 360 - (userIndex * sliceAngle + sliceAngle / 2);
    
    // Add 3 full spins (1080 degrees) to the current rotation, then reach the target angle.
    // We want to always spin forward.
    const currentModulo = rotation % 360;
    const currentSpins = rotation - currentModulo;
    
    let nextRotation = currentSpins + 1080 + targetAngle;
    
    // Ensure it always spins forward
    if (nextRotation <= rotation) {
      nextRotation += 360;
    }

    setRotation(nextRotation);
  }, [currentUserId, activeUsers.length]); // Intentionally not including rotation

  if (activeUsers.length === 0) {
    return <div className="flex items-center justify-center h-64 text-gray-500">No active users</div>;
  }

  const sliceAngle = 360 / activeUsers.length;

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto rounded-full border-4 border-primary shadow-xl overflow-hidden bg-white">
      {/* Indicator needle */}
      <div className="absolute top-0 left-1/2 -ml-3 -mt-2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-red-500 z-10 drop-shadow-md"></div>
      
      <motion.div 
        className="w-full h-full rounded-full"
        animate={{ rotate: rotation }}
        transition={{ duration: 3, ease: "easeOut" }}
        style={{ transformOrigin: "center center" }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full rounded-full">
          {activeUsers.map((user, i) => {
            const startAngle = i * sliceAngle;
            const endAngle = startAngle + sliceAngle;
            
            // Math for drawing SVG pie slice
            const x1 = 50 + 50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
            const y1 = 50 + 50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
            const x2 = 50 + 50 * Math.cos((Math.PI * (endAngle - 90)) / 180);
            const y2 = 50 + 50 * Math.sin((Math.PI * (endAngle - 90)) / 180);
            
            const largeArcFlag = sliceAngle > 180 ? 1 : 0;
            
            const d = [
              "M 50 50",
              `L ${x1} ${y1}`,
              `A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              "Z"
            ].join(" ");

            // Text positioning
            const textAngle = startAngle + sliceAngle / 2;
            const textX = 50 + 30 * Math.cos((Math.PI * (textAngle - 90)) / 180);
            const textY = 50 + 30 * Math.sin((Math.PI * (textAngle - 90)) / 180);

            // Colors based on index
            const colors = ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f472b6"];
            const color = colors[i % colors.length];

            return (
              <g key={user.id}>
                <path d={d} fill={color} stroke="#fff" strokeWidth="0.5" />
                <text 
                  x={textX} 
                  y={textY} 
                  fill="white" 
                  fontSize="6" 
                  fontWeight="bold" 
                  textAnchor="middle" 
                  dominantBaseline="middle"
                  transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                >
                  {user.name}
                </text>
              </g>
            );
          })}
        </svg>
      </motion.div>
    </div>
  );
};
