
"use client";

import React, { useContext, useState, useEffect } from 'react';
import { AppContext, type Business, type BusinessCategory, businessCategories } from '@/contexts/AppContext';
import BusinessCard from '@/components/shared/BusinessCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { AlertTriangle, ShoppingBag, Search, Lightbulb, Loader2, Briefcase, ExternalLink, Sparkles } from 'lucide-react';
import { suggestBusinesses, type SuggestBusinessesInput, type SuggestBusinessesOutput, type SuggestedBusiness } from '@/ai/flows/suggest-businesses-flow';

export default function HomePage() {
  const context = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | 'All'>('All');
  const [aiSuggestions, setAiSuggestions] = useState<SuggestedBusiness[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  if (!context) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Error</h1>
        <p className="text-muted-foreground">Could not load application context. Please try again later.</p>
      </div>
    );
  }

  const { businesses, loading, toast } = context;

  const handleGetAiSuggestions = async () => {
    setAiLoading(true);
    setAiSuggestions([]);
    try {
      const businessesForAI: SuggestBusinessesInput['businesses'] = businesses.map(b => ({
        id: b.id,
        name: b.name,
        description: b.description,
        category: b.category
      }));

      if (businessesForAI.length === 0) {
        toast({ title: "No Businesses", description: "Cannot generate suggestions as there are no businesses listed.", variant: "default" });
        setAiLoading(false);
        return;
      }
      
      const result: SuggestBusinessesOutput = await suggestBusinesses({ businesses: businessesForAI, count: 3 });
      setAiSuggestions(result.suggestions);
    } catch (error) {
      console.error("Failed to get AI suggestions:", error);
      toast({ title: "AI Suggestion Error", description: "Could not fetch suggestions at this time.", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const filteredBusinesses = businesses
    .filter(business => {
      const searchTermLower = searchTerm.toLowerCase();
      const nameMatch = business.name.toLowerCase().includes(searchTermLower);
      const descriptionMatch = business.description.toLowerCase().includes(searchTermLower);
      const categoryMatch = typeof business.category === 'string' && business.category.toLowerCase().includes(searchTermLower);
      const matchesSearch = nameMatch || descriptionMatch || categoryMatch;

      const matchesCategory = selectedCategory === 'All' || business.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
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
          <Link href="#businesses-listing">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Explore Businesses
          </Link>
        </Button>
      </section>

      <section id="ai-suggestions" className="py-8">
        <Card className="shadow-xl border-primary/30">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Lightbulb className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl font-headline text-primary">AI Business Navigator</CardTitle>
                <CardDescription>Let AI help you find interesting local businesses!</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGetAiSuggestions} disabled={aiLoading || businesses.length === 0} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Get AI Suggestions
            </Button>
            {aiLoading && aiSuggestions.length === 0 && (
              <div className="flex items-center justify-center p-4 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating suggestions...
              </div>
            )}
            {!aiLoading && aiSuggestions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                {aiSuggestions.map(suggestion => (
                  <Card key={suggestion.businessId} className="bg-card/70 hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-accent">{suggestion.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground/80 mb-3">{suggestion.reason}</p>
                      <Button variant="link" asChild className="p-0 h-auto text-primary">
                        <Link href={`/business/${suggestion.businessId}`}>
                          View Business <ExternalLink className="ml-1 h-3 w-3"/>
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
             {!aiLoading && !aiSuggestions.length && businesses.length > 0 && !aiLoading && (
              <p className="text-muted-foreground text-sm pt-2">Click the button above to get personalized suggestions.</p>
            )}
            {!aiLoading && businesses.length === 0 && (
              <p className="text-muted-foreground text-sm pt-2">Add some businesses first to get AI suggestions.</p>
            )}
          </CardContent>
        </Card>
      </section>


      <section id="businesses-listing" className="space-y-8">
        <div className="space-y-4 p-6 bg-card rounded-lg shadow-md">
          <h2 className="text-3xl font-semibold text-center text-primary mb-4">Find Local Businesses</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center items-center">
            <Briefcase className="h-5 w-5 text-muted-foreground mr-1"/>
            <Button 
              variant={selectedCategory === 'All' ? 'default' : 'outline'} 
              onClick={() => setSelectedCategory('All')}
              className={selectedCategory === 'All' ? 'bg-accent text-accent-foreground' : ''}
            >
              All Categories
            </Button>
            {businessCategories.map(category => (
              <Button 
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? 'bg-accent text-accent-foreground' : ''}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-border rounded-lg p-4 shadow-md animate-pulse">
                <div className="w-full h-48 bg-muted rounded-md mb-4"></div>
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-10 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <p className="text-center text-muted-foreground text-lg py-8">
            {businesses.length > 0 ? "No businesses match your current search or filter." : "No businesses are currently registered. Check back soon!"}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBusinesses.map((business: Business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
