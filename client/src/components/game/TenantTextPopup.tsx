import { useState, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TenantTextPopupProps {
  isOpen: boolean;
  onClose: () => void;
  tenantName: string;
  tenantPortraitUrl?: string | null;
  message: string;
  timestamp?: string;
}

export function TenantTextPopup({
  isOpen,
  onClose,
  tenantName,
  tenantPortraitUrl,
  message,
  timestamp,
}: TenantTextPopupProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [showFullMessage, setShowFullMessage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset to notification state when a new message arrives
      setShowNotification(true);
      setShowFullMessage(false);
    } else {
      // Reset both states when popup closes to prepare for next message
      setShowNotification(false);
      setShowFullMessage(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (showNotification && !showFullMessage) {
      const timer = setTimeout(() => {
        setShowNotification(false);
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showNotification, showFullMessage, onClose]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotification(false);
    onClose();
  };

  const handleNotificationClick = () => {
    setShowNotification(false);
    setShowFullMessage(true);
  };

  const handleClose = () => {
    setShowNotification(false);
    setShowFullMessage(false);
    onClose();
  };

  useEffect(() => {
    if (showFullMessage) {
      const timer = setTimeout(() => {
        setShowNotification(false);
        setShowFullMessage(false);
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showFullMessage, message, onClose]);

  const currentTime = timestamp || new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const initials = tenantName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.8 }}
          animate={{ 
            y: 0, 
            opacity: 1, 
            scale: 1,
            x: [0, -3, 3, -3, 3, 0],
          }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30,
            x: { delay: 0.3, duration: 0.4, repeat: 2, repeatDelay: 1 }
          }}
          className="fixed top-[calc(env(safe-area-inset-top,0px)+140px)] md:top-[calc(env(safe-area-inset-top,0px)+100px)] left-1/2 -translate-x-1/2 z-[100] cursor-pointer px-4"
          onClick={handleNotificationClick}
          data-testid="tenant-notification"
        >
          <div className="bg-white backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-blue-400 p-4 w-[calc(100vw-32px)] max-w-[400px] ring-4 ring-blue-400/30 relative">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute -top-2 -right-2 w-7 h-7 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
              data-testid="dismiss-notification"
              data-sound="close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                {tenantPortraitUrl ? (
                  <img 
                    src={tenantPortraitUrl} 
                    alt={tenantName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-blue-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg border-2 border-blue-300">
                    {initials}
                  </div>
                )}
                <motion.div 
                  className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                >
                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                </motion.div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-gray-900">{tenantName}</span>
                  <span className="text-xs text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full">NEW</span>
                </div>
                <p className="text-gray-700 text-sm line-clamp-2">{message}</p>
                <p className="text-blue-500 text-xs mt-2 font-medium">Tap to read full message →</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {showFullMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-[calc(env(safe-area-inset-bottom,0px)+16px)] overflow-y-auto"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-[360px] my-auto"
            onClick={(e) => e.stopPropagation()}
            data-testid="tenant-text-full"
          >
            <div className="bg-gray-100 rounded-[40px] overflow-hidden shadow-2xl border-[8px] border-gray-800">
              <div className="bg-gray-800 px-6 py-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-16 h-6 bg-black rounded-full" />
                </div>
              </div>
              
              <div className="bg-[#f2f2f7] min-h-[400px] flex flex-col">
                <div className="bg-[#f2f2f7] border-b border-gray-300 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={handleClose}
                      className="text-blue-500 text-sm font-medium"
                      data-testid="close-text-button"
                      data-sound="close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col items-center">
                      {tenantPortraitUrl ? (
                        <img 
                          src={tenantPortraitUrl} 
                          alt={tenantName}
                          className="w-12 h-12 rounded-full object-cover mb-1"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg mb-1">
                          {initials}
                        </div>
                      )}
                      <span className="text-gray-900 font-semibold text-sm">{tenantName}</span>
                      <span className="text-gray-500 text-xs">Tenant</span>
                    </div>
                    <div className="w-5" />
                  </div>
                </div>

                <div className="flex-1 p-4 space-y-2">
                  <div className="text-center">
                    <span className="text-xs text-gray-500 bg-gray-200/50 px-3 py-1 rounded-full">
                      Today {currentTime}
                    </span>
                  </div>
                  
                  <div className="flex justify-start">
                    <div className="max-w-[80%]">
                      <div className="bg-[#e5e5ea] rounded-2xl rounded-tl-md px-4 py-2 shadow-sm">
                        <p className="text-gray-900 text-[15px] leading-relaxed">{message}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 border-t border-gray-300 bg-white">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full px-4 py-2">
                      <span className="text-gray-400 text-sm">iMessage</span>
                    </div>
                    <button 
                      onClick={handleClose}
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-2 text-sm font-medium transition-colors"
                      data-testid="dismiss-text-button"
                      data-sound="close"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 px-6 py-2 flex justify-center">
                <div className="w-32 h-1 bg-gray-600 rounded-full" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
