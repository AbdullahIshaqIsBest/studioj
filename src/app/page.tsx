"use client";

import React, { useContext } from 'react';
import { AppContext, type Business } from '@/contexts/AppContext';
import BusinessCard from '@/components/shared/BusinessCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle, ShoppingBag } from 'lucide-react';

export default function HomePage() {
  const context = useContext(AppContext);

  if (!context) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Error</h1>
        <p className="text-muted-foreground">Could not load application context. Please try again later.</p>
      </div>
    );
  }

  const { businesses, loading } = context;

  const sortedBusinesses = [...businesses].sort((a, b) => {
    const aIsActiveSponsored = a.isSponsored && a.adExpiryDate && new Date(a.adExpiryDate) > new Date();
    const bIsActiveSponsored = b.isSponsored && b.adExpiryDate && new Date(b.adExpiryDate) > new Date();
    if (aIsActiveSponsored && !bIsActiveSponsored) return -1;
    if (!aIsActiveSponsored && bIsActiveSponsored) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-12">
      <section className="text-center py-12 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg shadow-lg">
        <h1 className="text-5xl font-bold text-primary mb-4">Welcome to SabziNow!</h1>
        <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
          Discover fresh groceries, delicious meals, and more from local businesses in Pakistan. All delivered to your doorstep with Cash on Delivery.
        </p>
        <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="#businesses">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Explore Businesses
          </Link>
        </Button>
      </section>

      <section id="businesses">
        <h2 className="text-3xl font-semibold mb-8 text-center text-primary">Our Partner Businesses</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-border rounded-lg p-4 shadow-md animate-pulse">
                <div className="w-full h-48 bg-muted rounded-md mb-4"></div>
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <p className="text-center text-muted-foreground text-lg">No businesses are currently registered. Check back soon!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedBusinesses.map((business: Business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
