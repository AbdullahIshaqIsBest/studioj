"use client";

import React, { useContext } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppContext } from '@/contexts/AppContext';
import { LogIn, LogOut, UserPlus, LayoutDashboard, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from "@/components/ui/sheet";

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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2 sm:space-x-4">
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

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px] p-6">
              <SheetTitle className="text-xl font-semibold mb-4 text-primary">Navigation</SheetTitle>
              {/* Optional: <SheetDescription>Access app sections here.</SheetDescription> */}
              <nav className="flex flex-col space-y-3 mt-6">
                <SheetClose asChild>
                  <Link href="/" className="py-2 px-3 hover:bg-accent rounded-md text-lg">Home</Link>
                </SheetClose>

                {currentUser ? (
                  <>
                    <SheetClose asChild>
                      <Link href="/dashboard" className="py-2 px-3 hover:bg-accent rounded-md text-lg flex items-center">
                        <LayoutDashboard className="mr-2 h-5 w-5" /> Dashboard
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          logoutUser();
                        }}
                        className="w-full justify-start py-2 px-3 hover:bg-accent rounded-md text-lg flex items-center"
                      >
                        <LogOut className="mr-2 h-5 w-5" /> Logout
                      </Button>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Link href="/register" className="py-2 px-3 hover:bg-accent rounded-md text-lg flex items-center">
                        <UserPlus className="mr-2 h-5 w-5" /> Register
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/login" className="py-2 px-3 hover:bg-accent rounded-md text-lg flex items-center">
                        <LogIn className="mr-2 h-5 w-5" /> Login
                      </Link>
                    </SheetClose>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
