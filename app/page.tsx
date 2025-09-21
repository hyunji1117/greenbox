'use client'

import React, { useState } from 'react'
import Sidebar from '@/app/components/Sidebar'
import FridgeBoard from '@/app/components/FridgeBoard'
import AssignmentBoard from '@/app/components/AssignmentBoard'
import ActivityFeed from '@/app/components/ActivityFeed'
import { FridgeProvider } from '@/app/context/FridgeContext'
import FoodBenefitsBoard from '@/app/components/FoodBenefitsBoard'


// 중요: default export로 변경
export default function Page() {
  const [activeTab, setActiveTab] = useState('fridge')
  
  const renderContent = () => {
    switch (activeTab) {
      case 'fridge':
        return <FridgeBoard />
      case 'foodBenefits':
        return <FoodBenefitsBoard />
      case 'activity':
        return <ActivityFeed />
      case 'assignments':
        return <AssignmentBoard />
      default:
        return <FridgeBoard />
    }
  }
  
  return (
    <FridgeProvider>
      <div className="flex h-screen bg-gray-100">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 overflow-auto">
          <div className="p-6 h-full">{renderContent()}</div>
        </div>
      </div>
    </FridgeProvider>
  )
}