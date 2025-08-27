'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Send, 
  Paperclip, 
  Image, 
  Smile, 
  Mic,
  MicOff,
  AlertTriangle,
  Plus,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'file' | 'emergency') => void
  isEmergencyRoom?: boolean
  disabled?: boolean
}

export default function MessageInput({ onSendMessage, isEmergencyRoom = false, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isEmergencyMode, setIsEmergencyMode] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  // Common emojis for quick access
  const commonEmojis = ['😊', '😂', '❤️', '👍', '👎', '😢', '😮', '😡', '🎉', '🔥', '💪', '🙏']

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (message.trim() || attachments.length > 0) {
      if (attachments.length > 0) {
        // Handle file uploads
        attachments.forEach(file => {
          // In a real app, you'd upload the file first and get a URL
          const fileUrl = URL.createObjectURL(file)
          onSendMessage(fileUrl, file.type.startsWith('image/') ? 'image' : 'file')
        })
        setAttachments([])
      }
      
      if (message.trim()) {
        const messageType = isEmergencyMode ? 'emergency' : 'text'
        onSendMessage(message.trim(), messageType)
        setMessage('')
        setIsEmergencyMode(false)
      }
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }, [message, attachments, onSendMessage, isEmergencyMode])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments(prev => [...prev, ...newFiles])
      e.target.value = '' // Reset input
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    setAttachments(prev => [...prev, ...files])
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const audioChunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        onSendMessage(audioUrl, 'file')
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const insertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="border-t bg-white">
      {/* Drag and drop overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 flex items-center justify-center z-10">
          <div className="text-center">
            <Paperclip className="mx-auto h-8 w-8 text-blue-500 mb-2" />
            <p className="text-blue-700 font-medium">Släpp filer här för att bifoga</p>
          </div>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="p-3 border-b bg-gray-50">
          <div className="flex items-center space-x-2 mb-2">
            <Paperclip className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Bifogade filer ({attachments.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center space-x-2 bg-white border rounded-lg p-2">
                <div className="flex items-center space-x-2">
                  {file.type.startsWith('image/') ? (
                    <Image className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Paperclip className="h-4 w-4 text-gray-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium truncate max-w-32">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(index)}
                  className="h-11 w-11 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="p-3 border-b bg-gray-50">
          <div className="flex items-center space-x-2 mb-2">
            <Smile className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Välj emoji</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => insertEmoji(emoji)}
                className="p-2 hover:bg-gray-200 rounded transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emergency mode banner */}
      {isEmergencyMode && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <Badge variant="destructive">NÖDLÄGE AKTIVERAT</Badge>
              <span className="text-sm text-red-700">
                Detta meddelande kommer att markeras som nödmeddelande
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEmergencyMode(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main input area */}
      <div 
        className="p-4"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Textarea */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isEmergencyRoom 
                  ? "Skriv nödmeddelande..." 
                  : "Skriv ett meddelande..."
              }
              disabled={disabled}
              className={cn(
                "min-h-[40px] max-h-[120px] resize-none pr-12",
                isEmergencyMode && "border-red-300 focus:ring-red-500"
              )}
            />
            
            {/* Character count for long messages */}
            {message.length > 100 && (
              <div className="absolute bottom-2 right-12 text-xs text-gray-500">
                {message.length}/2000
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* File attachment */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                title="Bifoga fil"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              {/* Image attachment */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'image/*'
                    fileInputRef.current.click()
                  }
                }}
                disabled={disabled}
                title="Bifoga bild"
              >
                <Image className="h-4 w-4" />
              </Button>

              {/* Emoji picker */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled}
                title="Lägg till emoji"
              >
                <Smile className="h-4 w-4" />
              </Button>

              {/* Voice recording */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={disabled}
                title={isRecording ? "Stoppa inspelning" : "Spela in röstmeddelande"}
                className={isRecording ? "text-red-600" : ""}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              {/* Emergency mode (only for emergency rooms or admins) */}
              {(isEmergencyRoom || true) && (
                <Button
                  type="button"
                  variant={isEmergencyMode ? "destructive" : "ghost"}
                  size="sm"
                  onClick={() => setIsEmergencyMode(!isEmergencyMode)}
                  disabled={disabled}
                  title="Nödläge"
                >
                  <AlertTriangle className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Send button */}
            <Button
              type="submit"
              disabled={(!message.trim() && attachments.length === 0) || disabled || isRecording}
              className="bg-[#002A5C] hover:bg-[#001a42]"
            >
              <Send className="h-4 w-4 mr-2" />
              {isRecording ? 'Spelar in...' : 'Skicka'}
            </Button>
          </div>
        </form>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center py-1 text-sm">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>Spelar in...</span>
          </div>
        </div>
      )}
    </div>
  )
}