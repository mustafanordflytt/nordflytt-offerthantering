'use client';

import ChatWidget from '@/components/ChatWidget';

export default function TestChatPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Enhanced Chat Widget Demo
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Click the chat button in the bottom right corner to see the enhanced Maja chat experience.
        </p>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Design Improvements:</h2>
          <ul className="space-y-2 text-gray-700">
            <li>✅ Modern gradient header with Maja branding</li>
            <li>✅ Glassmorphism effect on message area</li>
            <li>✅ Professional welcome message with quick actions</li>
            <li>✅ Enhanced message bubbles with smooth animations</li>
            <li>✅ Gradient send button with hover effects</li>
            <li>✅ Improved typing indicator</li>
            <li>✅ Mobile-responsive full-screen mode</li>
            <li>✅ Professional shadows and borders</li>
          </ul>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Quick Action Buttons:</h3>
          <p className="text-gray-700">
            The chat now includes quick action buttons for common requests:
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4 max-w-sm">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <span className="text-xl mr-2">💰</span> Prisoffert
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <span className="text-xl mr-2">📦</span> Kartonger
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <span className="text-xl mr-2">🧾</span> RUT-avdrag
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <span className="text-xl mr-2">✨</span> Städning
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Chat Widget */}
      <ChatWidget 
        position="bottom-right"
        theme="nordflytt"
      />
    </div>
  );
}