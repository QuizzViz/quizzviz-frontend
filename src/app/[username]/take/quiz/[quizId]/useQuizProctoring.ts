import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseQuizProctoringProps {
  onQuizEnd: () => void;
}

export function useQuizProctoring({ onQuizEnd }: UseQuizProctoringProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isHandlingAction = useRef(false);
  const checkFullscreenInterval = useRef<NodeJS.Timeout>();
  const tabChangedRef = useRef(false);

  // End quiz with message
  const endQuiz = useCallback((message: string) => {
    // Only show the toast and end quiz if not already handling an action
    if (isHandlingAction.current) return;
    
    isHandlingAction.current = true;
    
    toast.error(message, {
      style: {
        background: '#1F2937',
        color: '#EF4444',
        border: '1px solid #374151',
        maxWidth: '500px',
        margin: '0 auto',
        textAlign: 'center',
        borderRadius: '0.5rem',
        fontSize: '0.95rem',
        padding: '1rem',
      },
      duration: 5000,
      position: 'top-center',
      onAutoClose: () => {
        // Only end quiz after toast is closed and user has confirmed
        onQuizEnd();
        isHandlingAction.current = false;
      }
    });
  }, [onQuizEnd]);

  // Request fullscreen
  const requestFullscreen = useCallback(async (): Promise<boolean> => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).msRequestFullscreen) {
        await (document.documentElement as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
      return true;
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
      setIsFullscreen(false);
      endQuiz('Fullscreen is required to take this quiz. Please enable it to continue.');
      return false;
    }
  }, [endQuiz, setIsFullscreen]);

  // Exit fullscreen
  const exitFullscreen = useCallback(async (): Promise<void> => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
        await (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.error('Failed to exit fullscreen:', err);
      throw err;
    }
  }, []);

  // Check if currently in fullscreen
  const checkFullscreen = useCallback(async (): Promise<boolean> => {
    const isFullscreenNow = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
    
    setIsFullscreen(isFullscreenNow);
    return isFullscreenNow;
  }, []);
  
  // Show confirmation dialog when trying to exit fullscreen or quit
  const confirmAction = useCallback(async (action: 'fullscreen' | 'quiz'): Promise<boolean> => {
    if (isHandlingAction.current) return false;
    
    isHandlingAction.current = true;
    const message = action === 'fullscreen' 
      ? 'Are you sure you want to exit fullscreen mode? This will end your quiz attempt.'
      : 'Are you sure you want to quit the quiz? This will end your current attempt.';
    
    const confirmExit = window.confirm(message);
    
    if (!confirmExit) {
      // If user cancels, ensure we're still in fullscreen
      if (action === 'fullscreen' && !(await checkFullscreen())) {
        try {
          await requestFullscreen();
        } catch (err) {
          console.error('Failed to re-enter fullscreen:', err);
          // Don't end quiz automatically, just show a warning
          toast.warning('Please remain in fullscreen mode to continue the quiz.');
        }
      }
      isHandlingAction.current = false;
      return false;
    }
    
    // Only end quiz if user confirms
    if (action === 'quiz') {
      endQuiz('You have chosen to end the quiz.');
    } else if (action === 'fullscreen') {
      endQuiz('You have exited fullscreen mode. Quiz ended.');
    }
    
    isHandlingAction.current = false;
    return true;
  }, [checkFullscreen, endQuiz, requestFullscreen]);

  // Handle keyboard events
  const handleKeyDown = useCallback(async (e: KeyboardEvent) => {
    // Prevent F1, F5, F12, Tab, r (for F5 and Ctrl+R)
    const preventKeys = ['F1', 'F5', 'F12', 'Tab', 'r'];

    // Prevent Alt+Tab, Ctrl+W, Ctrl+N, etc.
    if (e.altKey || e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Handle Escape key specifically - prevent default and show confirmation
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      
      const shouldEnd = await confirmAction('quiz');
      if (shouldEnd) {
        endQuiz('You have chosen to end the quiz.');
      }
      return false;
    }

    // Handle other prevented keys
    if (preventKeys.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, [endQuiz, confirmAction]);

  // Handle tab/window change
  const handleTabChange = useCallback((eventName: string) => {
    if (isHandlingAction.current) return;
    
    if (!tabChangedRef.current) {
      tabChangedRef.current = true;
      console.log(`${eventName} detected, ending quiz`);
      
      // Try to bring focus back and show a warning first
      window.focus();
      
      // Show a more visible warning
      const warningMessage = 'Warning: Tab switching is not allowed during the quiz. This is your final warning.';
      toast.error(warningMessage, {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#7F1D1D',
          color: 'white',
          fontSize: '1.1em',
          textAlign: 'center',
          padding: '1rem',
          borderRadius: '0.5rem',
          maxWidth: '90%',
          margin: '0 auto',
          fontWeight: 'bold'
        }
      });
      
      // End the quiz after a short delay
      setTimeout(() => {
        endQuiz('Quiz ended: You left the quiz tab.');
      }, 1000);
    }
  }, [endQuiz]);

  // Handle visibility change (tab switch)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      handleTabChange('visibilitychange');
    }
  }, [handleTabChange]);

  // Handle fullscreen change
  const handleFullscreenChange = useCallback(async (e?: Event) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isHandlingAction.current) return;
    
    const wasFullscreen = isFullscreen;
    const isNowFullscreen = await checkFullscreen();
    
    // If we're exiting fullscreen and it wasn't initiated by our code
    if (wasFullscreen && !isNowFullscreen) {
      e?.preventDefault();
      e?.stopImmediatePropagation();
      
      // Force back to fullscreen immediately
      try {
        await requestFullscreen();
        
        // Show a warning
        toast.warning('Fullscreen mode is required to continue the quiz.', {
          duration: 3000,
          position: 'top-center'
        });
      } catch (err) {
        console.error('Failed to re-enter fullscreen:', err);
        endQuiz('Fullscreen mode is required. Quiz ended.');
      }
    }
    
    // Update the state if we're in fullscreen
    if (isNowFullscreen) {
      setIsFullscreen(true);
    } else {
      // If we somehow got here and not in fullscreen, try to re-enter
      requestFullscreen().catch(() => {
        endQuiz('Failed to maintain fullscreen mode. Quiz ended.');
      });
    }
  }, [checkFullscreen, isFullscreen, requestFullscreen, endQuiz]);

  // Prevent context menu
  const preventContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    return false;
  }, []);

  // Handle beforeunload
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    // This message might not be shown in modern browsers
    const confirmationMessage = 'Are you sure you want to leave? Your quiz progress will be lost.';
    
    // Standard for most browsers
    e.preventDefault();
    e.returnValue = confirmationMessage;
    
    // Show a more visible warning
    toast.warning('Do not close or refresh this page!', {
      duration: 2000,
      position: 'top-center',
      style: {
        background: '#B45309',
        color: 'white',
        fontSize: '1.1em',
        textAlign: 'center',
        padding: '1rem',
        borderRadius: '0.5rem',
        maxWidth: '90%',
        margin: '0 auto',
        fontWeight: 'bold'
      }
    });
    
    return confirmationMessage;
  }, []);

  // Initialize proctoring
  useEffect(() => {
    let isMounted = true;
    
    const enforceFullscreen = async () => {
      if (!isMounted) return;
      
      const isInFullscreen = await checkFullscreen();
      
      if (!isInFullscreen && !isHandlingAction.current) {
        try {
          await requestFullscreen();
        } catch (err) {
          console.error('Failed to enforce fullscreen:', err);
          if (isMounted) {
            endQuiz('Fullscreen is required to continue the quiz.');
          }
        }
      }
    };
    
    // Initial fullscreen check and enforcement
    enforceFullscreen();
    
    // Set up interval to check fullscreen status more frequently
    checkFullscreenInterval.current = setInterval(enforceFullscreen, 500);
    
    // Set up event listeners with passive: false to ensure preventDefault works
    const options = { capture: true, passive: false };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange, options);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange, options);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange, options);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange, options);
    document.addEventListener('keydown', handleKeyDown, options);
    document.addEventListener('visibilitychange', handleVisibilityChange, options);
    document.addEventListener('contextmenu', preventContextMenu, options);
    window.addEventListener('beforeunload', handleBeforeUnload, options);
    window.addEventListener('blur', () => handleTabChange('blur'), options);
    window.addEventListener('pagehide', () => handleTabChange('pagehide'), options);
    
    // Prevent any attempts to exit fullscreen
    const handleFullscreenError = (e: Event) => {
      e.preventDefault();
      enforceFullscreen();
    };
    document.addEventListener('fullscreenerror', handleFullscreenError, options);
    
      // Cleanup function
    return () => {
      isMounted = false;
      
      // Clear interval
      if (checkFullscreenInterval.current) {
        clearInterval(checkFullscreenInterval.current);
        checkFullscreenInterval.current = undefined;
      }
      
      // Remove all event listeners
      const cleanupOptions = { capture: true };
      document.removeEventListener('fullscreenchange', handleFullscreenChange, cleanupOptions);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange, cleanupOptions);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange, cleanupOptions);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange, cleanupOptions);
      document.removeEventListener('keydown', handleKeyDown, cleanupOptions);
      document.removeEventListener('visibilitychange', handleVisibilityChange, cleanupOptions);
      document.removeEventListener('contextmenu', preventContextMenu, cleanupOptions);
      window.removeEventListener('beforeunload', handleBeforeUnload, cleanupOptions);
      window.removeEventListener('blur', () => handleTabChange('blur'), cleanupOptions);
      window.removeEventListener('pagehide', () => handleTabChange('pagehide'), cleanupOptions);
      document.removeEventListener('fullscreenerror', handleFullscreenError, cleanupOptions);
    };
  }, [
    handleKeyDown, 
    handleFullscreenChange, 
    handleVisibilityChange, 
    handleTabChange,
    preventContextMenu, 
    handleBeforeUnload,
    endQuiz,
    requestFullscreen,
    checkFullscreen
  ]);

  // Return the public API
  return {
    isFullscreen,
    requestFullscreen,
    exitFullscreen,
    endQuiz: (message: string = 'Quiz ended.') => endQuiz(message)
  };
}
