"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "@/components/navigation";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const isBiroLivePage = pathname?.startsWith('/biro/live/') && pathname.split('/').length > 3;
  
  return (
    <>
      {!isLoginPage && !isBiroLivePage && <Navigation />}
      {children}
      {!isLoginPage && !isBiroLivePage && (
        <footer className="border-t border-border py-6 mt-12">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Fővédnök:</strong> Horváth András T. úr (@fizik.ha)
            </p>
            <p>
              Az oldalt készítette: <strong>Balla Botond</strong>, 23F
            </p>
            <p className="mt-2">
              <strong>Kőbányai Szent László Gimnázium</strong>
            </p>
          </div>
        </footer>
      )}
    </>
  );
}
