
"use client";

import React from 'react';
import Image from 'next/image';
import { type Business } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone, Globe } from 'lucide-react';
import Link from 'next/link';

interface BusinessCardProps {
  business: Business;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const isActiveSponsored = business.isSponsored && business.adExpiryDate && new Date(business.adExpiryDate) > new Date();

  const getImageHint = (name: string): string => {
    if (name.toLowerCase().includes('farm') || name.toLowerCase().includes('fresh')) return "vegetables fruits";
    if (name.toLowerCase().includes('cuisine') || name.toLowerCase().includes('kitchen')) return "restaurant food";
    if (name.toLowerCase().includes('bakery') || name.toLowerCase().includes('sweet')) return "bakery cakes";
    return "store shop";
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
          data-ai-hint={getImageHint(business.name)}
          onError={(e) => (e.currentTarget.src = defaultImageSrc)}
        />
        {isActiveSponsored && (
          <Badge variant="default" className="absolute top-2 right-2 bg-accent text-accent-foreground font-semibold">
            <Star className="mr-1 h-4 w-4 fill-current" /> Sponsored
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <CardTitle className="text-2xl font-headline mb-2 text-primary">{business.name}</CardTitle>
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
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
