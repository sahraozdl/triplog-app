"use client";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <div className="flex md:hidden bg-sidebar p-4">
          <SidebarTrigger className="border-2" />
        </div>

        <main className="min-h-screen w-full px-4">
          <Breadcrumbs />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
