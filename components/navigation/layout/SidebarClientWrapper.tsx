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
        <div className="flex md:hidden bg-sidebar p-3 sm:p-4">
          <SidebarTrigger className="border-2" />
        </div>

        <main className="min-h-screen w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10">
          <div className="mx-auto w-full max-w-7xl">
            <Breadcrumbs />
            <div className="py-4 sm:py-6 md:py-8">{children}</div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
