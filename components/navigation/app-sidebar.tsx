"use client";

import * as React from "react";
import {
  BookOpen,
  LuggageIcon,
  Bus,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Plus,
  Send,
  Settings2,
  ListTree,
  Calendar,
} from "lucide-react";

import { NavMain } from "@/components/navigation/nav-main";
import { NavProjects } from "@/components/navigation/nav-projects";
import { NavSecondary } from "@/components/navigation/nav-secondary";
import { NavUser } from "@/components/navigation/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: ListTree,
      isActive: true,
      items: [
        {
          title: "New Trip",
          url: "/newTrip",
          icon: Plus,
        },
        {
          title: "Active Trips",
          url: "/dashboard#active-trips",
        },
        {
          title: "Past Trips",
          url: "#",
        },
      ],
    },
    {
      title: "Trips (Coming Soon)",
      url: "#",
      icon: LuggageIcon,
      items: [
        {
          title: "example",
          url: "#",
        },
        {
          title: "example",
          url: "#",
        },
        {
          title: "example",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation (Coming Soon)",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction (Coming Soon)",
          url: "#",
        },
        {
          title: "Get Started (Coming Soon)",
          url: "#",
        },
      ],
    },
    {
      title: "Settings (Coming Soon)",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General (Coming Soon)",
          url: "#",
        },
        {
          title: "Team (Coming Soon)",
          url: "#",
        },
        {
          title: "Billing (Coming Soon)",
          url: "#",
        },
        {
          title: "Limits (Coming Soon)",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support (Coming Soon)",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback (Coming Soon)",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "example (Coming Soon)",
      url: "#",
      icon: Frame,
    },
    {
      name: "example (Coming Soon)",
      url: "#",
      icon: PieChart,
    },
    {
      name: "example (Coming Soon)",
      url: "#",
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Bus className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">TripLog</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
