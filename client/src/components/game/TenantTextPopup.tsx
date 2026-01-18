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
      setShowNotification(true);
      setShowFullMessage(false);
    }
  }, [isOpen]);

  const handleNotificationClick = () => {
    setShowNotification(false);
    setShowFullMessage(true);
  };

  const handleClose = () => {
    setShowNotification(false);
    setShowFullMessage(false);
    onClose();
  };

  const currentTime = timestamp || new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const initials = tenantName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] cursor-pointer"
          onClick={handleNotificationClick}
          data-testid="tenant-notification"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 p-3 min-w-[320px] max-w-[380px]">
            <div className="flex items-start gap-3">
              <div className="relative">
                {tenantPortraitUrl ? (
                  <img 
                    src={tenantPortraitUrl} 
                    alt={tenantName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                    {initials}
                  </div>
                )}
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-900 text-sm">{tenantName}</span>
                  <span className="text-xs text-gray-400">now</span>
                </div>
                <p className="text-gray-600 text-sm truncate">{message}</p>
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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-[360px]"
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
