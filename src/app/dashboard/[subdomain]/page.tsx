'use client'
import { MenuManager } from '@/components/menu/menu-manager'
import { useParams } from 'next/navigation'
import { Sidebar } from "@/components/sidebar/sidebar"
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Bell, Settings, LogOut} from 'lucide-react'






export default function RestaurantAdminDashboard() {
  const { subdomain } = useParams() as { subdomain: string }


 



  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
     
      <main className="flex-1 p-8 overflow-y-auto">
       

        
       


     
      </main>
    </div>
  )
}