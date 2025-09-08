'use client'
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, useSidebar, SidebarFooter } from "@/components/ui/sidebar"
import {BotMessageSquare} from 'lucide-react'
import { useEffect } from "react"

export function AppSidebar() {

    const { isMobile, setOpenMobile } = useSidebar()

  useEffect(() => {
    if (isMobile) setOpenMobile(false)
  }, [isMobile, setOpenMobile])
  const {toggleSidebar} = useSidebar()
  return (
     <>
      {/* Always visible trigger (on mobile + desktop) */}
      <div className="p-2 bg-gray-100 h-screen">
        <BotMessageSquare
          color="black"
          className="w-6 h-6  cursor-pointer"
          onClick={() => toggleSidebar()}
        />
      </div>

      {/* The actual sidebar */}
      <Sidebar collapsible="icon">
        <SidebarContent className="flex flex-col items-center pt-2">
          {/* Your sidebar groups, menus, etc */}
           <BotMessageSquare
          className="w-6 h-6 cursor-pointer"
          onClick={() => toggleSidebar()}
        />
        </SidebarContent>
      </Sidebar>
    </>
  )
}