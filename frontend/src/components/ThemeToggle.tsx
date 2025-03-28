import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  useEffect(() => {
    // 从 localStorage 获取保存的主题，如果没有则使用浏览器偏好
    const savedTheme = localStorage.getItem('theme') as typeof theme;
    
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // 检查系统偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = prefersDark ? 'dark' : 'light';
      setTheme(defaultTheme);
      applyTheme(defaultTheme);
    }
  }, []);

  const applyTheme = (newTheme: typeof theme) => {
    // 设置DaisyUI主题
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // 检查是否是深色主题
    const isDarkTheme = ['dark', 'night', 'cyberpunk', 'synthwave'].includes(newTheme);
    
    // 处理Tailwind暗模式类
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#1f2937'; // 确保背景颜色也变暗
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = ''; // 重置为默认背景色
    }
    
    // 添加特定主题的背景处理
    document.body.className = '';
    document.body.classList.add('min-h-screen', 'transition-colors', 'duration-300');
    
    if (isDarkTheme) {
      document.body.classList.add('bg-gradient-to-br', 'from-gray-900', 'to-gray-800', 'text-white');
    } else {
      document.body.classList.add('bg-gradient-to-br', 'from-violet-100', 'to-indigo-200', 'text-gray-900');
    }
    
    // 应用CSS变量
    if (isDarkTheme) {
      document.documentElement.style.setProperty('--background', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--foreground', '210 40% 98%');
    } else {
      document.documentElement.style.setProperty('--background', '0 0% 100%');
      document.documentElement.style.setProperty('--foreground', '222.2 84% 4.9%');
    }
    
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    const themes: Array<typeof theme> = ['light', 'dark'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];
    
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" />;
      case 'dark':
        return <Moon className="h-5 w-5" />;
      default:
        return <span className="text-xs font-bold">{theme.slice(0, 1).toUpperCase()}</span>;
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border-2 bg-transparent transition-colors hover:bg-muted dark:border-gray-600 dark:text-white"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      <motion.span 
        key={theme} 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {getIcon()}
      </motion.span>
    </motion.button>
  );
}
