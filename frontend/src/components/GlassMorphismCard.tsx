import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlassMorphismCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glowColor?: string;
}

export function GlassMorphismCard({
  children,
  className = '',
  hoverEffect = true,
  glowColor = 'rgba(255, 255, 255, 0.1)'
}: GlassMorphismCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // 检测是否是暗色模式
  const isDark = document.documentElement.classList.contains('dark');
  const bgColor = isDark ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.1)';
  const borderColor = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(255, 255, 255, 0.18)';

  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl backdrop-blur-md dark:text-white ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        backgroundColor: bgColor,
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
        border: `1px solid ${borderColor}`
      }}
      onHoverStart={hoverEffect ? () => setIsHovered(true) : undefined}
      onHoverEnd={hoverEffect ? () => setIsHovered(false) : undefined}
      whileHover={hoverEffect ? { scale: 1.02 } : undefined}
    >
      <AnimatePresence>
        {isHovered && hoverEffect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 -z-10"
            style={{
              background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
              filter: 'blur(20px)'
            }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">{children}</div>
      
      <motion.div
        className={`absolute inset-0 -z-20 opacity-50 ${
          isDark ? 'bg-gradient-to-br from-gray-800/30 to-gray-900/50' : 'bg-gradient-to-br from-white/5 to-white/10'
        }`}
        style={{
          maskImage: 'radial-gradient(circle at center, black, transparent)'
        }}
      />
    </motion.div>
  );
}
