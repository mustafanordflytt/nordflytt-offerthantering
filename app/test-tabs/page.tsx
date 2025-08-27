'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function TestTabs() {
  const [activeTab, setActiveTab] = useState('tab1')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Tabs</h1>
      
      <div className="mb-4 p-2 bg-blue-100 rounded">
        <p>Current tab: {activeTab}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tab1">
          <div className="p-4 bg-gray-100 rounded">
            <h2 className="font-semibold">Tab 1 Content</h2>
            <p>This is the content of tab 1</p>
          </div>
        </TabsContent>
        
        <TabsContent value="tab2">
          <div className="p-4 bg-gray-100 rounded">
            <h2 className="font-semibold">Tab 2 Content</h2>
            <p>This is the content of tab 2</p>
          </div>
        </TabsContent>
        
        <TabsContent value="tab3">
          <div className="p-4 bg-gray-100 rounded">
            <h2 className="font-semibold">Tab 3 Content</h2>
            <p>This is the content of tab 3</p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-4">
        <button 
          onClick={() => setActiveTab('tab2')} 
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Go to Tab 2
        </button>
      </div>
    </div>
  )
}