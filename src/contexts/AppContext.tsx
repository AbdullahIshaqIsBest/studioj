"use client";

import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { activateAdSubscription, type ActivateAdSubscriptionInput } from '@/ai/flows/activate-ad-subscription';

export interface Business {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string; // Added for login
  password?: string; // Added for login
  image?: string;
  isSponsored: boolean;
  adExpiryDate?: string; // Store as ISO string
}

export interface User {
  id: string;
  email: string;
  businessId: string;
}

interface AppContextType {
  businesses: Business[];
  currentUser: User | null;
  loading: boolean;
  registerBusiness: (business: Omit<Business, 'id' | 'isSponsored' | 'adExpiryDate'>) => Promise<boolean>;
  loginUser: (email: string, pass: string) => Promise<boolean>;
  logoutUser: () => void;
  activateAdForCurrentUser: (code: string) => Promise<{ success: boolean; message: string }>;
  getBusinessById: (id: string) => Business | undefined;
}

export const AppContext = createContext<AppContextType | null>(null);

// Sample Data
const initialBusinesses: Business[] = [
  {
    id: '1',
    name: 'Fresh Farms Co.',
    description: 'The freshest vegetables and fruits, straight from the farm to your table. Organic options available.',
    address: '123 Green Valley, Lahore',
    phone: '0300-1234567',
    email: 'farm@example.com',
    password: 'password123',
    image: 'https://placehold.co/600x400/6AB04C/FFF?text=Fresh+Farms',
    isSponsored: true,
    adExpiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // Active for 15 more days
  },
  {
    id: '2',
    name: 'Karachi Kuisine',
    description: 'Authentic Karachi biryani, haleem, and more. Taste the tradition of the city of lights.',
    address: '456 Biryani Lane, Karachi',
    phone: '0321-9876543',
    email: 'cuisine@example.com',
    password: 'password123',
    image: 'https://placehold.co/600x400/A3C459/FFF?text=Karachi+Kuisine',
    isSponsored: false,
  },
  {
    id: '3',
    name: 'Lahori Bites',
    description: 'Delicious Lahori breakfast, snacks, and traditional sweets. Open early till late.',
    address: '789 Food Street, Lahore',
    phone: '0333-1122334',
    email: 'bites@example.com',
    password: 'password123',
    image: 'https://placehold.co/600x400/6AB04C/FFF?text=Lahori+Bites',
    isSponsored: false,
  },
   {
    id: '4',
    name: 'Sweet Delights Bakery',
    description: 'Cakes, pastries, and bread baked fresh daily. Custom orders welcome for all occasions.',
    address: 'Cafe Road, Islamabad',
    phone: '0311-5550000',
    email: 'bakery@example.com',
    password: 'password123',
    image: 'https://placehold.co/600x400/A3C459/FFF?text=Sweet+Delights',
    isSponsored: true,
    adExpiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Expired 5 days ago
  },
];


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Simulate loading data
    const storedBusinesses = localStorage.getItem('sabziNowBusinesses');
    if (storedBusinesses) {
      setBusinesses(JSON.parse(storedBusinesses));
    } else {
      setBusinesses(initialBusinesses);
      localStorage.setItem('sabziNowBusinesses', JSON.stringify(initialBusinesses));
    }

    const storedUser = localStorage.getItem('sabziNowCurrentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) { // only save to localStorage after initial load to prevent overwriting
        localStorage.setItem('sabziNowBusinesses', JSON.stringify(businesses));
    }
  }, [businesses, loading]);

  useEffect(() => {
    if (!loading) {
        if (currentUser) {
            localStorage.setItem('sabziNowCurrentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('sabziNowCurrentUser');
        }
    }
  }, [currentUser, loading]);

  const registerBusiness = async (businessData: Omit<Business, 'id' | 'isSponsored' | 'adExpiryDate'>): Promise<boolean> => {
    const existingBusiness = businesses.find(b => b.email === businessData.email);
    if (existingBusiness) {
      toast({ title: "Registration Failed", description: "A business with this email already exists.", variant: "destructive" });
      return false;
    }
    const newBusiness: Business = {
      ...businessData,
      id: String(Date.now()), // Simple ID generation
      isSponsored: false,
    };
    setBusinesses(prev => [...prev, newBusiness]);
    toast({ title: "Registration Successful", description: `Welcome, ${newBusiness.name}!` });
    // Log in the new user directly
    const newUser: User = { id: newBusiness.id, email: newBusiness.email, businessId: newBusiness.id };
    setCurrentUser(newUser);
    router.push('/dashboard');
    return true;
  };

  const loginUser = async (email: string, pass: string): Promise<boolean> => {
    const business = businesses.find(b => b.email === email && b.password === pass);
    if (business) {
      const user: User = { id: business.id, email: business.email, businessId: business.id };
      setCurrentUser(user);
      toast({ title: "Login Successful", description: `Welcome back, ${business.name}!` });
      router.push('/dashboard');
      return true;
    }
    toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
    return false;
  };

  const logoutUser = () => {
    setCurrentUser(null);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
  };

  const activateAdForCurrentUser = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: "No user logged in." };
    }

    const input: ActivateAdSubscriptionInput = { code };
    try {
      const result = await activateAdSubscription(input);
      if (result.success) {
        setBusinesses(prevBusinesses =>
          prevBusinesses.map(b =>
            b.id === currentUser.businessId
              ? {
                  ...b,
                  isSponsored: true,
                  adExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                }
              : b
          )
        );
        toast({ title: "Ad Activated!", description: result.message });
        return { success: true, message: result.message };
      } else {
        toast({ title: "Ad Activation Failed", description: result.message, variant: "destructive" });
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Error activating ad:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Ad Activation Error", description: errorMessage, variant: "destructive" });
      return { success: false, message: errorMessage };
    }
  };
  
  const getBusinessById = (id: string): Business | undefined => {
    return businesses.find(b => b.id === id);
  };

  return (
    <AppContext.Provider value={{ businesses, currentUser, loading, registerBusiness, loginUser, logoutUser, activateAdForCurrentUser, getBusinessById }}>
      {children}
    </AppContext.Provider>
  );
};
