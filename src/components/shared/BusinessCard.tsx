
"use client";

import React from 'react';
import Image from 'next/image';
import { type Business, type BusinessCategory } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone, Globe, Briefcase } from 'lucide-react';
import Link from 'next/link';

interface BusinessCardProps {
  business: Business;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const isActiveSponsored = business.isSponsored && business.adExpiryDate && new Date(business.adExpiryDate) > new Date();

  const getImageHint = (category: BusinessCategory | undefined, name: string): string => {
    const catLower = typeof category === 'string' ? category.toLowerCase() : "";
    const nameLower = typeof name === 'string' ? name.toLowerCase() : "";

    if (catLower) { // Check if category is a valid string and try to match
        if (catLower.includes('grocery') || catLower.includes('farm goods')) return "vegetables fruits";
        if (catLower.includes('restaurant') || catLower.includes('cafe')) return "restaurant food";
        if (catLower.includes('bakery') || catLower.includes('sweets')) return "bakery cakes";
    }
    
    // Fallback to name-based hints if category didn't match or was undefined/empty
    if (nameLower) {
        if (nameLower.includes('farm') || nameLower.includes('fresh')) return "vegetables fruits";
        if (nameLower.includes('cuisine') || nameLower.includes('kitchen')) return "restaurant food";
        if (nameLower.includes('bakery') || nameLower.includes('sweet')) return "bakery cakes";
    }
    
    return "store shop"; // Default generic hint
  };


  const placeholderColor = isActiveSponsored ? 'A3C459' : '6AB04C';
  const defaultImageSrc = `https://placehold.co/600x400/${placeholderColor}/FFFFFF?text=${encodeURIComponent(business.name)}`;

  return (
    <Card className={`flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden ${isActiveSponsored ? 'border-accent border-2' : 'border-border'}`}>
      <CardHeader className="p-0 relative">
        <Image
          src={business.image || defaultImageSrc}
          alt={business.name}
          width={600}
          height={400}
          className="w-full h-48 object-cover"
          data-ai-hint={getImageHint(business.category, business.name)}
          onError={(e) => (e.currentTarget.src = defaultImageSrc)}
        />
        {isActiveSponsored && (
          <Badge variant="default" className="absolute top-2 right-2 bg-accent text-accent-foreground font-semibold">
            <Star className="mr-1 h-4 w-4 fill-current" /> Sponsored
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <CardTitle className="text-2xl font-headline mb-1 text-primary">{business.name}</CardTitle>
        <Badge variant="outline" className="mb-2 text-xs text-muted-foreground">
          <Briefcase className="mr-1 h-3 w-3"/>{business.category || 'N/A'}
        </Badge>
        <CardDescription className="text-foreground/80 mb-4 min-h-[60px] line-clamp-3">{business.description}</CardDescription>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" />
            <span>{business.address}</span>
          </div>
          <div className="flex items-center">
            <Globe className="h-4 w-4 mr-2 text-primary" />
            <span>{business.city}</span>
          </div>
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-2 text-primary" />
            <span>{business.phone}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 bg-card/50 border-t border-border/20">
        <Button variant="default" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
          <Link href={`/business/${business.id}`}>
            View Details & Order
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

