import type { Metadata } from "next";
import "./globals.css";
import { Manrope } from "next/font/google";
import { SidebarWrapper } from "@/components/navigation/layout/SidebarClientWrapper";
import { AppUserProvider } from "@/components/providers/AppUserProvider";
import { getUserDB } from "@/lib/getUserDB";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Auth0 Next.js App",
  description: "Next.js app with Auth0 authentication",
};
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserDB();

  return (
    <html lang="en" className="dark">
      <body>
        <AppUserProvider initialUser={user}>
          <SidebarWrapper>{children}</SidebarWrapper>
        </AppUserProvider>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
