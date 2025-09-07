'use client'
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import {BotMessageSquare} from 'lucide-react'

export function AppSidebar() {

  const {toggleSidebar} = useSidebar()
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
          <div className="flex items-center pt-2 justify-center">
            <BotMessageSquare className=" w-6 h-6" onClick={()=> toggleSidebar()} />
          </div>
      </SidebarContent>
    </Sidebar>
  )
}