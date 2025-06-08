"use client";

import React from 'react';
import { type Business } from '@/contexts/AppContext';
import AdActivationForm from './AdActivationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Megaphone, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface AdManagerProps {
  business: Business;
}

// Replace with your actual WhatsApp number
const WHATSAPP_NUMBER = "+923001234567"; // Example Pakistani number
const WHATSAPP_MESSAGE = "I want to subscribe to SabziNow ads.";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export default function AdManager({ business }: AdManagerProps) {
  const adIsActive = business.isSponsored && business.adExpiryDate && new Date(business.adExpiryDate) > new Date();
  const adStatusText = adIsActive 
    ? `Active until ${new Date(business.adExpiryDate!).toLocaleDateString()}` 
    : "Inactive";

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Megaphone className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-headline">Ad Management</CardTitle>
            <CardDescription>Boost your visibility on SabziNow.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <p className="text-lg font-medium text-foreground">Current Ad Status:</p>
          <Badge variant={adIsActive ? "default" : "destructive"} className={adIsActive ? "bg-green-500 hover:bg-green-600" : ""}>
            {adIsActive ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <AlertCircle className="mr-2 h-4 w-4" />}
            {adStatusText}
          </Badge>
        </div>

        {!adIsActive && (
           <Card className="bg-accent/10 border-accent">
            <CardHeader>
                <CardTitle className="text-accent font-semibold">Want to get sponsored?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-foreground/80">
                    Contact us on WhatsApp to get your unique activation code. Sponsored listings appear at the top of search results and on the home page!
                </p>
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Link href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                        Subscribe via WhatsApp <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
           </Card>
        )}
        
        <div>
          <h3 className="text-xl font-semibold mb-3 text-primary">Activate Your Ad</h3>
          <p className="text-muted-foreground mb-4">
            Received an activation code? Enter it below to activate your 1-month ad subscription.
          </p>
          <AdActivationForm />
        </div>
      </CardContent>
    </Card>
  );
}
