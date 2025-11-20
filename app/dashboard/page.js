"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, User, Bot, MoreHorizontal, Mic, LogOut, Download, Loader2, Image as ImageIcon } from 'lucide-react';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const uploadImageToCloudinary = async (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload images');
    }

    return await response.json();
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    
    try {
      // Create immediate preview objects
      const previewImages = await Promise.all(
        files.map(async (file) => {
          if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            return {
              id: Date.now() + Math.random(),
              file: file,
              url: url, // Local preview URL
              cloudinaryUrl: null, // Will be set after upload
              name: file.name,
              isUploading: true
            };
          }
          return null;
        })
      ).then(results => results.filter(Boolean));

      // Add preview images immediately
      setSelectedImages(prev => [...prev, ...previewImages]);

      // Upload to Cloudinary in background
      const uploadResult = await uploadImageToCloudinary(files);
      
      if (uploadResult.success) {
        // Update with Cloudinary URLs
        setSelectedImages(prev => 
          prev.map((img, index) => {
            const uploadedImg = uploadResult.images[index];
            if (img.isUploading && uploadedImg) {
              return {
                ...img,
                cloudinaryUrl: uploadedImg.url,
                isUploading: false
              };
            }
            return img;
          })
        );
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      // Remove failed uploads
      setSelectedImages(prev => prev.filter(img => !img.isUploading));
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploadingImages(false);
    }

    event.target.value = '';
  };

  const removeImage = (imageId) => {
    setSelectedImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove && imageToRemove.url && imageToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  const callThumbnailAPI = async (prompt, images) => {
    try {
      const formData = new FormData();
      formData.append('prompt', prompt || '');

      // Add images to FormData
     images.forEach(img => {
      if (img.cloudinaryUrl) {
        formData.append('imageUrls', img.cloudinaryUrl);
      }
    });

      const response = await fetch('/api/generate-thumbnail', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API Error: ${response.status} - ${text}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && selectedImages.length === 0) return;

    // Create user message with current images (using Cloudinary URLs if available, fallback to preview)
    const messageImages = selectedImages.map(img => ({
      id: img.id,
      url: img.cloudinaryUrl || img.url,
      name: img.name,
      isUploading: img.isUploading || false
    }));

    const newMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText,
      images: messageImages,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);

    const currentPrompt = inputText;
    const currentImages = selectedImages;
    setInputText('');
    setSelectedImages([]);
    setIsTyping(true);
    setIsGenerating(true);

    try {
      const apiResponse = await callThumbnailAPI(currentPrompt, currentImages);
      console.log("api response of generated thumbnail= ",apiResponse)
      // Update user message with final Cloudinary URLs if they weren't already set
      if (apiResponse.thumbnail?.url > 0) {
        setMessages(prev =>
          prev.map(msg => {
            if (msg.id === newMessage.id) {
              const updatedImages = {
              id: newMessage.id + '-generated-thumbnail',
              url: apiResponse.thumbnail.url,
              name: "Generated Thumbnail",
              isUploading: false
              };
              return { ...msg, images: updatedImages };
            }
            return msg;
          })
        );
      }

      // Add AI response message
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: apiResponse.message || 'Thumbnail generated successfully!',
        thumbnails: apiResponse.thumbnail || [],
        timestamp: new Date(),
        generationId: apiResponse.generationId
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error in thumbnail generation:", error);
      const errorResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: `Sorry, I encountered an error while generating your thumbnail: ${error.message}. Please try again.`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
      setIsGenerating(false);
      // Clean up any remaining blob URLs
      selectedImages.forEach(img => {
        if (img.url && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleLogout = () => {
    alert('Logout functionality would be implemented here');
    setShowUserDropdown(false);
  };

  const downloadThumbnail = async (thumbnailUrl, filename) => {
    try {
      const response = await fetch(thumbnailUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'thumbnail.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download thumbnail');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputText(suggestion);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-red-400">YTThumbs</h1>
            <span className="text-sm text-gray-400">AI Thumbnail Generator</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {(isGenerating || uploadingImages) && (
              <div className="flex items-center space-x-2 text-yellow-400">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">
                  {uploadingImages ? 'Uploading...' : 'Generating...'}
                </span>
              </div>
            )}
            
            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <User size={16} />
              </button>
              
              {showUserDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-gray-700">
                    <div className="text-sm font-medium">User</div>
                    <div className="text-xs text-gray-400">user@example.com</div>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left rounded-md hover:bg-gray-700 transition-colors text-red-400 hover:text-red-300"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            // Welcome Screen (same as before)
            <div className="flex-1 flex flex-col items-center justify-center px-4">
              <div className="text-center max-w-2xl">
                <h2 className="text-3xl font-semibold mb-4 text-gray-100">
                  Create Amazing YouTube Thumbnails
                </h2>
                <p className="text-gray-400 mb-8">
                  Describe your video content and I'll generate eye-catching thumbnails for you!
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div 
                    className="p-4 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors cursor-pointer"
                    onClick={() => handleSuggestionClick("Create a gaming thumbnail with neon colors and explosion effects")}
                  >
                    <div className="text-sm font-medium mb-2">🎮 Gaming Thumbnail</div>
                    <div className="text-xs text-gray-400">Create exciting gaming thumbnails with vibrant colors</div>
                  </div>
                  <div 
                    className="p-4 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors cursor-pointer"
                    onClick={() => handleSuggestionClick("Design a tutorial thumbnail with clean text and arrows")}
                  >
                    <div className="text-sm font-medium mb-2">📚 Tutorial Style</div>
                    <div className="text-xs text-gray-400">Professional thumbnails for educational content</div>
                  </div>
                  <div 
                    className="p-4 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors cursor-pointer"
                    onClick={() => handleSuggestionClick("Generate a reaction thumbnail with surprised expression")}
                  >
                    <div className="text-sm font-medium mb-2">😱 Reaction Style</div>
                    <div className="text-xs text-gray-400">Eye-catching reaction thumbnails</div>
                  </div>
                  <div 
                    className="p-4 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors cursor-pointer"
                    onClick={() => handleSuggestionClick("Create a minimalist thumbnail with bold typography")}
                  >
                    <div className="text-sm font-medium mb-2">✨ Minimalist Design</div>
                    <div className="text-xs text-gray-400">Clean and modern thumbnail designs</div>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  💡 Tip: Upload reference images and be specific about colors, style, text, and emotions
                </div>
              </div>
            </div>
          ) : (
            // Messages
            <div className="px-4 py-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === 'user' 
                          ? 'bg-blue-500' 
                          : message.isError 
                            ? 'bg-red-500'
                            : 'bg-green-500'
                      }`}>
                        {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                      </div>

                      {/* Message Content */}
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.type === 'user'
                          ? 'bg-blue-600'
                          : message.isError
                            ? 'bg-red-800'
                            : 'bg-gray-800'
                      }`}>
                      {/* User Images */}
                      {message.images && message.images.length > 0 && (
                        <div className="mb-3 grid grid-cols-2 gap-2">
                          {message.images.map((image) => (
                            image.url ? (  // ✅ only render <img> if URL exists
                              <div key={image.id} className="relative group">
                                <div className="relative">
                                  <img
                                    src={image.url}
                                    alt={image.name || "uploaded image"}
                                    className={`rounded-lg max-w-full h-32 object-cover ${image.isUploading ? 'opacity-50' : ''}`}
                                  />
                                  {image.isUploading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="bg-black bg-opacity-50 rounded-full p-2">
                                        <Loader2 size={16} className="animate-spin text-white" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : null
                          ))}
                        </div>
                      )}

                        {/* Text Content */}
                        {message.content && (
                          <div className="whitespace-pre-wrap text-gray-100 mb-3">{message.content}</div>
                        )}

                      {/* Generated Thumbnails */}
                      {(() => {
                        // Normalize: convert single thumbnail → array
                        const thumbs = message.thumbnails
                          ? Array.isArray(message.thumbnails)
                            ? message.thumbnails
                            : [message.thumbnails]   // convert object → array
                          : [];

                        if (thumbs.length === 0) return null;

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {thumbs.map((thumbnail, index) =>
                              thumbnail?.url ? (
                                <div
                                  key={thumbnail.public_id || index}
                                  className="relative group bg-gray-700 rounded-lg overflow-hidden"
                                >
                                  {/* Thumbnail image */}
                                  <img
                                    src={thumbnail.url}
                                    alt={`Thumbnail ${index + 1}`}
                                    className="w-full h-32 object-cover"
                                    onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                                  />

                                  {/* Hover overlay */}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center pointer-events-none group-hover:pointer-events-auto z-10">
                                    <button
                                      onClick={() =>
                                        downloadThumbnail(thumbnail.url, `thumbnail_${index + 1}.png`)
                                      }
                                      className="z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2"
                                    >
                                      <Download size={16} />
                                      <span>Download</span>
                                    </button>
                                  </div>

                                  {/* Optional label */}
                                  {thumbnail.variant && (
                                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-20">
                                      {thumbnail.variant}
                                    </div>
                                  )}
                                </div>
                              ) : null
                            )}
                          </div>
                        );
                      })()}

                        {/* Timestamp */}
                        <div className={`text-xs mt-2 ${
                          message.type === 'user' ? 'text-blue-200' : 'text-gray-400'
                        }`}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-3 max-w-3xl">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <Bot size={16} />
                      </div>
                      <div className="bg-gray-800 rounded-2xl px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-400">Generating your thumbnail...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            {/* Selected Images Preview */}
            {selectedImages.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2 p-4 bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-300 w-full mb-2 flex items-center">
                  <span>Reference Images:</span>
                  {uploadingImages && (
                    <div className="ml-2 flex items-center">
                      <Loader2 size={12} className="animate-spin mr-1" />
                      <span className="text-xs">Uploading...</span>
                    </div>
                  )}
                </div>
                {selectedImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="relative">
                      <img
                        src={image.url}
                        alt={image.name}
                        className={`w-20 h-20 object-cover rounded-lg border border-gray-600 ${
                          image.isUploading ? 'opacity-50' : ''
                        }`}
                      />
                      {image.isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 size={12} className="animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={image.isUploading}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Container */}
            <div className="relative">
              <div className="flex items-end space-x-2 bg-gray-800 rounded-3xl p-2">
                {/* Attachment Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                  title="Upload reference images"
                  disabled={isGenerating || uploadingImages}
                >
                  <Paperclip size={20} />
                </button>

                {/* Text Input */}
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your YouTube thumbnail (e.g., 'Gaming thumbnail with bright colors and shocked expression')"
                  className="flex-1 bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none py-3 px-2 max-h-32"
                  rows={1}
                  disabled={isGenerating || uploadingImages}
                  style={{ 
                    minHeight: '24px',
                    height: 'auto',
                    overflowY: inputText.split('\n').length > 3 ? 'scroll' : 'hidden'
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                  }}
                />

                {/* Image Upload Icon */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                  title="Upload reference image"
                  disabled={isGenerating || uploadingImages}
                >
                  <ImageIcon size={20} />
                </button>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={(!inputText.trim() && selectedImages.length === 0) || isGenerating || uploadingImages}
                  className={`flex-shrink-0 p-2 rounded-full transition-colors ${
                    (inputText.trim() || selectedImages.length > 0) && !isGenerating && !uploadingImages
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {(isGenerating || uploadingImages) ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>

              {/* Helper Text */}
              <div className="mt-2 text-xs text-gray-500 text-center">
                YTThumbs AI can generate YouTube thumbnails. Upload reference images and describe your video content for best results.
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface