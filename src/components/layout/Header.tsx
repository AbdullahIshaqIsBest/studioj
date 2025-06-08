"use client";

import React, { useContext } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppContext } from '@/contexts/AppContext';
import { LogIn, LogOut, UserPlus, LayoutDashboard, ShoppingCart } from 'lucide-react';

export default function Header() {
  const context = useContext(AppContext);

  if (!context) return null; // Or a loading/error state

  const { currentUser, logoutUser } = context;

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-3xl font-bold text-primary font-headline">
          SabziNow
        </Link>
        <nav className="flex items-center space-x-2 sm:space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/">Home</Link>
          </Button>
          {currentUser ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </Button>
              <Button variant="outline" onClick={logoutUser} className="border-primary text-primary hover:bg-primary/10">
                <LogOut className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/register">
                  <UserPlus className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Register Business</span>
                </Link>
              </Button>
              <Button variant="default" asChild className="bg-primary hover:bg-primary/90">
                <Link href="/login">
                  <LogIn className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Login</span>
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
