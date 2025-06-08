
"use client";

import React, { useContext, useEffect } from 'react';
import { AppContext, type Business } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';
import AdManager from '@/components/dashboard/AdManager';
import ProductManager from '@/components/dashboard/ProductManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Mail, Phone, MapPin, AlertTriangle, Loader2, Globe } from 'lucide-react';
import Image from 'next/image';

export default function DashboardPage() {
  const context = useContext(AppContext);
  const router = useRouter();

  useEffect(() => {
    if (!context?.loading && !context?.currentUser) {
      router.push('/login');
    }
  }, [context, router]);

  if (!context || context.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const { currentUser, getBusinessById } = context;

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">Please log in to view your dashboard.</p>
      </div>
    );
  }

  const business = getBusinessById(currentUser.businessId);

  if (!business) {
    return <p className="text-center text-destructive">Could not find business details.</p>;
  }
  
  const getImageHint = (name: string): string => {
    if (name.toLowerCase().includes('farm') || name.toLowerCase().includes('fresh')) return "vegetables fruits";
    if (name.toLowerCase().includes('cuisine') || name.toLowerCase().includes('kitchen')) return "restaurant food";
    if (name.toLowerCase().includes('bakery') || name.toLowerCase().includes('sweet')) return "bakery cakes";
    return "store shop";
  }

  const defaultImageSrc = `https://placehold.co/120x120/6AB04C/FFF?text=${encodeURIComponent(business.name[0])}`;

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold font-headline text-primary">Business Dashboard</h1>
      
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Image 
              src={business.image || defaultImageSrc}
              alt={`${business.name} logo`}
              width={100}
              height={100}
              className="rounded-lg border-2 border-card object-cover w-24 h-24 sm:w-28 sm:h-28"
              data-ai-hint={getImageHint(business.name)}
              onError={(e) => (e.currentTarget.src = defaultImageSrc)} // Fallback for broken Data URIs or links
            />
            <div>
              <CardTitle className="text-3xl font-headline text-primary flex items-center">
                <Building className="mr-3 h-8 w-8" /> {business.name}
              </CardTitle>
              <CardDescription className="text-foreground/80 mt-1">{business.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary mb-2">Contact Information</h3>
            <p className="flex items-center text-foreground/90"><Mail className="mr-2 h-5 w-5 text-accent" /> {business.email}</p>
            <p className="flex items-center text-foreground/90"><Phone className="mr-2 h-5 w-5 text-accent" /> {business.phone}</p>
            <p className="flex items-center text-foreground/90"><MapPin className="mr-2 h-5 w-5 text-accent" /> {business.address}</p>
            <p className="flex items-center text-foreground/90"><Globe className="mr-2 h-5 w-5 text-accent" /> {business.city}</p>
          </div>
          <div className="flex items-start justify-end">
            {/* Edit Business Info Placeholder */}
          </div>
        </CardContent>
      </Card>

      <ProductManager businessId={currentUser.businessId} />
      
      <AdManager business={business} />

    </div>
  );
}
