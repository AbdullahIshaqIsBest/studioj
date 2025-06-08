
"use client";

import React, { useContext, useEffect, useState } from 'react';
import { AppContext, type Business, type Product } from '@/contexts/AppContext';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, MapPin, Phone, Mail, Globe, Package, Tag, DollarSign, ShoppingCart } from 'lucide-react';

interface SelectedProduct extends Product {
  quantity: number;
}

export default function BusinessProfilePage() {
  const context = useContext(AppContext);
  const params = useParams();
  const router = useRouter();
  const businessId = typeof params.id === 'string' ? params.id : undefined;

  const [business, setBusiness] = useState<Business | null | undefined>(undefined); // undefined for loading, null for not found
  const [products, setProducts] = useState<Product[]>([]);
  const [order, setOrder] = useState<SelectedProduct[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');


  useEffect(() => {
    if (context && businessId) {
      const foundBusiness = context.getBusinessById(businessId);
      setBusiness(foundBusiness);
      if (foundBusiness) {
        setProducts(context.getProductsByBusinessId(businessId));
      }
    }
  }, [context, businessId]);

  if (!context || business === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading business details...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Business Not Found</h1>
        <p className="text-muted-foreground">The requested business profile could not be found.</p>
        <Button onClick={() => router.push('/')} className="mt-4">Go to Homepage</Button>
      </div>
    );
  }

  const getImageHint = (nameOrCategory: string, isProduct: boolean = false): string => {
    const lower = nameOrCategory.toLowerCase();
    if (isProduct) {
        if (lower.includes('fruit')) return "fruits assortment";
        if (lower.includes('vegetable')) return "vegetables market";
        if (lower.includes('bakery') || lower.includes('cake')) return "bakery goods";
        if (lower.includes('meal') || lower.includes('food')) return "delicious meal";
        if (lower.includes('drink') || lower.includes('beverage')) return "refreshing drink";
        return "product item";
    } else {
        if (lower.includes('farm') || lower.includes('fresh')) return "vegetables fruits";
        if (lower.includes('cuisine') || lower.includes('kitchen')) return "restaurant food";
        if (lower.includes('bakery') || lower.includes('sweet')) return "bakery cakes";
        return "store shop";
    }
  }

  const defaultBusinessImage = `https://placehold.co/800x400/6AB04C/FFF?text=${encodeURIComponent(business.name)}`;
  
  const addToOrder = (product: Product) => {
    setOrder(prevOrder => {
      const existingProduct = prevOrder.find(item => item.id === product.id);
      if (existingProduct) {
        return prevOrder.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prevOrder, { ...product, quantity: 1 }];
    });
  };

  const removeFromOrder = (productId: string) => {
    setOrder(prevOrder => {
      const existingProduct = prevOrder.find(item => item.id === productId);
      if (existingProduct && existingProduct.quantity > 1) {
        return prevOrder.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prevOrder.filter(item => item.id !== productId);
    });
  };

  const calculateTotal = () => {
    return order.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const handlePlaceOrder = () => {
    if (!customerName || !customerPhone) {
      context.toast({ title: "Missing Information", description: "Please enter your name and phone number.", variant: "destructive"});
      return;
    }
    if (order.length === 0) {
      context.toast({ title: "Empty Order", description: "Please add products to your order.", variant: "destructive"});
      return;
    }

    let message = `Hi ${business.name}, I'd like to place an order:\n\n`;
    order.forEach(item => {
      message += `${item.name} (x${item.quantity}) - PKR ${(item.price * item.quantity).toFixed(2)}\n`;
    });
    message += `\nTotal: PKR ${calculateTotal()}\n\n`;
    message += `My Details:\nName: ${customerName}\nPhone: ${customerPhone}\n\n`;
    message += `Thank you! (Order from SabziNow)`;

    const whatsappUrl = `https://wa.me/${business.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setOrder([]);
    setCustomerName('');
    setCustomerPhone('');
    context.toast({ title: "Order Prepared!", description: "You are being redirected to WhatsApp to send your order."});
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-xl overflow-hidden">
        <div className="relative w-full h-64 md:h-80">
          <Image
            src={business.image || defaultBusinessImage}
            alt={`${business.name} cover image`}
            layout="fill"
            objectFit="cover"
            className="bg-muted"
            data-ai-hint={getImageHint(business.name)}
            onError={(e) => (e.currentTarget.src = defaultBusinessImage)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <CardTitle className="absolute bottom-6 left-6 text-4xl font-headline text-white md:text-5xl">
            {business.name}
          </CardTitle>
        </div>
        <CardContent className="p-6 space-y-4">
          <p className="text-lg text-foreground/80">{business.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-md">
            <div className="flex items-center"><MapPin className="mr-3 h-5 w-5 text-primary" /> {business.address}</div>
            <div className="flex items-center"><Globe className="mr-3 h-5 w-5 text-primary" /> {business.city}</div>
            <div className="flex items-center"><Phone className="mr-3 h-5 w-5 text-primary" /> {business.phone}</div>
            <div className="flex items-center"><Mail className="mr-3 h-5 w-5 text-primary" /> {business.email}</div>
          </div>
          {business.isSponsored && business.adExpiryDate && new Date(business.adExpiryDate) > new Date() && (
             <Badge className="bg-accent text-accent-foreground mt-2">Sponsored Listing</Badge>
          )}
        </CardContent>
      </Card>

      <section id="products">
        <h2 className="text-3xl font-semibold mb-6 text-primary flex items-center">
          <Package className="mr-3 h-7 w-7" /> Products
        </h2>
        {products.length === 0 ? (
          <p className="text-center text-muted-foreground text-lg py-8">This business has not added any products yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => {
              const defaultProductImage = `https://placehold.co/300x200/A3C459/FFF?text=${encodeURIComponent(product.name)}`;
              return (
                <Card key={product.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0">
                    <Image
                      src={product.image || defaultProductImage}
                      alt={product.name}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover"
                      data-ai-hint={getImageHint(product.category, true)}
                      onError={(e) => (e.currentTarget.src = defaultProductImage)}
                    />
                  </CardHeader>
                  <CardContent className="p-4 flex-grow">
                    <CardTitle className="text-xl font-headline mb-1 text-primary">{product.name}</CardTitle>
                    <Badge variant="secondary" className="mb-2 text-xs"><Tag className="mr-1 h-3 w-3"/>{product.category}</Badge>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3 h-[60px]">{product.description}</p>
                  </CardContent>
                  <CardFooter className="p-4 bg-muted/30 border-t flex flex-col items-start space-y-2">
                    <p className="font-semibold text-primary text-lg">PKR {product.price.toFixed(2)}</p>
                    <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => addToOrder(product)}>
                      <ShoppingCart className="mr-2 h-4 w-4" /> Add to Order
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {order.length > 0 && (
        <Card className="shadow-lg mt-12">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-primary flex items-center">
              <ShoppingCart className="mr-3 h-7 w-7" /> Your Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 border-b">
                <div>
                  <p className="font-semibold">{item.name} <span className="text-sm text-muted-foreground">(x{item.quantity})</span></p>
                  <p className="text-sm text-primary">PKR {(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => removeFromOrder(item.id)}>Remove</Button>
              </div>
            ))}
            <div className="pt-4 text-right">
              <p className="text-xl font-bold">Total: PKR {calculateTotal()}</p>
            </div>
            <div className="space-y-3 pt-4">
              <input 
                type="text" 
                placeholder="Your Name" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              <input 
                type="tel" 
                placeholder="Your Phone Number (e.g., 03001234567)" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-primary hover:bg-primary/90" size="lg" onClick={handlePlaceOrder}>
              Place Order via WhatsApp
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

