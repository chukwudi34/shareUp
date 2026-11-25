import type { Metadata } from "next";
import { getSessionUser, apiFetch } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { DialogProvider } from "@/components/dialog-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ShareUp — Own more. Together.",
    template: "%s · ShareUp",
  },
  description:
    "ShareUp is Nigeria's collective ownership marketplace. Buy, invest and own real assets together — with verified suppliers, safeguarded funds and full visibility.",
  openGraph: {
    title: "ShareUp — Own more. Together.",
    description: "Buy, invest and own real assets together.",
    images: ["/images/hero-community.webp"],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  let unread = 0;
  if (user) {
    try {
      const data = await apiFetch<{ meta: { unread: number } }>("notifications");
      unread = data.meta.unread;
    } catch {
      unread = 0;
    }
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <DialogProvider>
          <div className="min-h-screen py-2 sm:py-4 lg:py-6">
            <div className="shell">
              <div className="app-card overflow-hidden">
                <SiteHeader user={user} unread={unread} />
                <main>{children}</main>
                <div className="pb-16 lg:pb-0">
                  <SiteFooter />
                </div>
              </div>
            </div>
          </div>
          <MobileTabBar signedIn={Boolean(user)} />
        </DialogProvider>
      </body>
    </html>
  );
}
