import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Send } from 'lucide-react';

interface PostTooltipProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PostData) => void;
}

interface PostData {
  emoji: string;
  message: string;
  images: File[];
  lat: number;
  lng: number;
}

const helpEmojis = [
  { emoji: '🥖', label: 'Food' },
  { emoji: '🏠', label: 'Shelter' },
  { emoji: '🚗', label: 'Transportation' },
  { emoji: '❓', label: 'Other' },
];

const PostTooltip: React.FC<PostTooltipProps> = ({ isOpen, onClose, onSubmit }) => {
  const [emoji, setEmoji] = useState(helpEmojis[0].emoji);
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emoji && message.trim() && location) {
      setIsSubmitting(true);
      try {
        await onSubmit({ 
          emoji, 
          message: message.trim(), 
          images, 
          lat: location.lat, 
          lng: location.lng 
        });
        // Reset form
        setEmoji(helpEmojis[0].emoji);
        setMessage('');
        setImages([]);
        onClose();
      } catch (error) {
        console.error('Failed to submit post:', error);
        // Handle error - could show a toast or error message
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files].slice(0, 5)); // Limit to 5 images
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

 

  const handleEmojiSelect = (selectedEmoji: string) => {
    setEmoji(selectedEmoji);
    setShowEmojiPicker(false);
  };

  // Get user's current location when tooltip opens
  useEffect(() => {
    if (isOpen && !location) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            setLocationError(null);
          },
          (error) => {
            console.error('Error getting location:', error);
            setLocationError('Unable to get your location. Please enable location services.');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
      } else {
        setLocationError('Geolocation is not supported by this browser.');
      }
    }
  }, [isOpen, location]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Tooltip */}
          <motion.div
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50"
            initial={{ 
              opacity: 0, 
              scale: 0.85, 
              y: 30,
              x: "-50%",
              transformOrigin: "bottom center"
            }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              x: "-50%",
              transition: {
                type: "spring",
                damping: 20,
                stiffness: 400,
                mass: 0.8,
                duration: 0.5
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.9, 
              y: 15,
              x: "-50%",
              transition: {
                type: "spring",
                damping: 30,
                stiffness: 500,
                duration: 0.3
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.05)] border border-gray-200 w-80 max-w-[calc(100vw-2rem)] overflow-hidden relative after:content-[''] after:absolute after:-bottom-2 after:left-1/2 after:transform after:-translate-x-1/2 after:w-4 after:h-4 after:bg-white after:border after:border-gray-200 after:border-t-0 after:border-l-0 after:rotate-45 after:rounded-br-sm after:z-10 after:shadow-[2px_2px_4px_rgba(0,0,0,0.1)]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Request Help</h3>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Emoji Picker */}
                <div>
                  <div className="relative flex justify-center" ref={emojiPickerRef}>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="flex flex-col items-center justify-center w-20 h-20 border border-gray-300 rounded-full text-xl transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(139,92,246,0.15)] hover:border-purple-400 hover:bg-purple-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <span className="mb-0.5">{emoji}</span>
                      <span className="text-xs text-gray-600 leading-none">
                        {helpEmojis.find(item => item.emoji === emoji)?.label || 'Food'}
                      </span>
                    </button>
                    
                    {/* Emoji Picker Dropdown */}
                    <AnimatePresence>
                      {showEmojiPicker && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-3"
                        >
                          <div className="grid grid-cols-3 gap-3">
                            {helpEmojis.map((item, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleEmojiSelect(item.emoji)}
                                className="flex flex-col items-center p-2 hover:bg-purple-100 rounded-lg transition-colors"
                              >
                                <span className="text-2xl mb-1">{item.emoji}</span>
                                <span className="text-xs text-gray-600">{item.label}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Message Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What do you need help with?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200 ease-out focus:-translate-y-0.5 focus:shadow-[0_4px_12px_rgba(139,92,246,0.15)]"
                    rows={3}
                    maxLength={200}
                    required
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {message.length}/200
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Images (Optional)
                  </label>
                  
                  {/* Image Preview Grid */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {images.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg transition-all duration-200 ease-out hover:scale-105"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Button */}
                  <button
                    type="button"
                    onClick={openFileDialog}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(139,92,246,0.15)]"
                  >
                    <Image size={20} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {images.length > 0 ? 'Add more images' : 'Add images'}
                    </span>
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  {images.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {images.length}/5 images selected
                    </p>
                  )}
                </div>

                {/* Location Status */}
                {locationError && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                    {locationError}
                  </div>
                )}
                {location && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                    📍 Location detected
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                    !emoji || !message.trim() || !location || isSubmitting
                      ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                      : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-[0_4px_14px_0_rgba(139,92,246,0.4)] hover:from-purple-700 hover:to-purple-800 hover:shadow-[0_6px_20px_0_rgba(139,92,246,0.5)]'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!emoji || !message.trim() || !location || isSubmitting}
                >
                  <Send size={18} />
                  {isSubmitting ? 'Posting...' : 'Post'}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PostTooltip;
