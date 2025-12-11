'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const { user, isAuthenticated, isBiro, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="border-b-2 border-border bg-card/95 backdrop-blur-sm sticky top-0 z-50 wood-grain shadow-md">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-foreground tracking-wide hover:opacity-80 transition-opacity">
              🎱 Biliárd
            </Link>
            <div className="hidden md:flex space-x-2">
              <Link
                href="/"
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                  pathname === '/' 
                    ? 'bg-secondary/80 text-foreground border border-border shadow-sm' 
                    : 'text-foreground/70 hover:text-foreground hover:bg-secondary/60 hover:scale-105'
                )}
              >
                Főoldal
              </Link>
              <Link
                href="/tournaments"
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                  pathname.startsWith('/tournaments')
                    ? 'bg-secondary/80 text-foreground border border-border shadow-sm'
                    : 'text-foreground/70 hover:text-foreground hover:bg-secondary/60 hover:scale-105'
                )}
              >
                Bajnokságok
              </Link>
              {isAuthenticated && (
                <Link
                  href={`/profile/${user?.id}`}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                    pathname.startsWith('/profile')
                      ? 'bg-secondary/80 text-foreground border border-border shadow-sm'
                      : 'text-foreground/70 hover:text-foreground hover:bg-secondary/60 hover:scale-105'
                  )}
                >
                  Profilom
                </Link>
              )}
              {isBiro && (
                <Link
                  href="/biro"
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                    pathname.startsWith('/biro')
                      ? 'bg-secondary/80 text-foreground border border-border shadow-sm'
                      : 'text-foreground/70 hover:text-foreground hover:bg-secondary/60 hover:scale-105'
                  )}
                >
                  Bírói felület
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-foreground font-medium hidden md:inline">
                  {user?.user?.username || user?.first_name}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={logout} 
                  className="hidden md:flex border-border text-foreground hover:bg-secondary/60 hover:scale-105 transition-all duration-200"
                >
                  Kijelentkezés
                </Button>
              </>
            ) : (
              <Link href="/login" className="hidden md:block">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-border text-foreground hover:bg-secondary/60 hover:scale-105 transition-all duration-200"
                >
                  Bejelentkezés
                </Button>
              </Link>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-md text-foreground hover:bg-secondary/60 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card/98 backdrop-blur-sm animate-slide-in-up">
          <div className="container mx-auto px-6 py-4 space-y-2">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className={cn(
                'block px-4 py-3 rounded-md text-sm font-medium transition-all duration-200',
                pathname === '/' 
                  ? 'bg-secondary/80 text-foreground border border-border shadow-sm' 
                  : 'text-foreground/70 hover:text-foreground hover:bg-secondary/60'
              )}
            >
              Főoldal
            </Link>
            <Link
              href="/tournaments"
              onClick={closeMobileMenu}
              className={cn(
                'block px-4 py-3 rounded-md text-sm font-medium transition-all duration-200',
                pathname.startsWith('/tournaments')
                  ? 'bg-secondary/80 text-foreground border border-border shadow-sm'
                  : 'text-foreground/70 hover:text-foreground hover:bg-secondary/60'
              )}
            >
              Bajnokságok
            </Link>
            {isAuthenticated && (
              <Link
                href={`/profile/${user?.id}`}
                onClick={closeMobileMenu}
                className={cn(
                  'block px-4 py-3 rounded-md text-sm font-medium transition-all duration-200',
                  pathname.startsWith('/profile')
                    ? 'bg-secondary/80 text-foreground border border-border shadow-sm'
                    : 'text-foreground/70 hover:text-foreground hover:bg-secondary/60'
                )}
              >
                Profilom
              </Link>
            )}
            {isBiro && (
              <Link
                href="/biro"
                onClick={closeMobileMenu}
                className={cn(
                  'block px-4 py-3 rounded-md text-sm font-medium transition-all duration-200',
                  pathname.startsWith('/biro')
                    ? 'bg-secondary/80 text-foreground border border-border shadow-sm'
                    : 'text-foreground/70 hover:text-foreground hover:bg-secondary/60'
                )}
              >
                Bírói felület
              </Link>
            )}
            
            <div className="pt-2 border-t border-border mt-2">
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 text-sm text-foreground font-medium">
                    {user?.user?.username || user?.first_name}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }} 
                    className="w-full border-border text-foreground hover:bg-secondary/60 transition-all duration-200"
                  >
                    Kijelentkezés
                  </Button>
                </>
              ) : (
                <Link href="/login" onClick={closeMobileMenu} className="block">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-border text-foreground hover:bg-secondary/60 transition-all duration-200"
                  >
                    Bejelentkezés
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
