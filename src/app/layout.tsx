import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "き楽っく発注アプリ",
  description: "商品発注・発注残管理アプリ MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <StoreProvider>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
            <AppShell>{children}</AppShell>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
