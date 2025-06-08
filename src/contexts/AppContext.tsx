
"use client";

import React, { createContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { activateAdSubscription, type ActivateAdSubscriptionInput } from '@/ai/flows/activate-ad-subscription';

export type BusinessCategory = "Restaurant & Cafe" | "Grocery & Farm Goods" | "Bakery & Sweets" | "General Store" | "Services" | "Other";

export const businessCategories: BusinessCategory[] = [
  "Restaurant & Cafe",
  "Grocery & Farm Goods",
  "Bakery & Sweets",
  "General Store",
  "Services",
  "Other"
];

export interface Business {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  category: BusinessCategory;
  phone: string;
  email: string;
  password?: string; 
  image?: string; 
  isSponsored: boolean;
  adExpiryDate?: string;
  createdAt?: string; 
  updatedAt?: string; 
}

export interface User {
  id: string; 
  email: string;
  businessId: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  description: string;
  image?: string; 
}

type ToastFunctionType = ReturnType<typeof useToast>['toast'];

interface AppContextType {
  businesses: Business[];
  currentUser: User | null;
  products: Product[];
  loading: boolean;
  fetchBusinesses: () => Promise<void>;
  registerBusiness: (business: Omit<Business, 'id' | 'isSponsored' | 'adExpiryDate'>) => Promise<boolean>;
  loginUser: (email: string, pass: string) => Promise<boolean>;
  logoutUser: () => void;
  activateAdForCurrentUser: (code: string) => Promise<{ success: boolean; message: string }>;
  getBusinessById: (id: string) => Business | undefined;
  addProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
  getProductsByBusinessId: (businessId: string) => Product[];
  toast: ToastFunctionType;
}

export const AppContext = createContext<AppContextType | null>(null);

// Initial products (still from localStorage for now)
const initialProducts: Product[] = [
    { id: 'p1', businessId: '1', name: 'Organic Apples', category: 'Fruits', price: 250, salePrice: 220, description: 'Crisp and juicy organic apples, freshly picked.', image: 'https://placehold.co/300x200/FF6347/FFF?text=Apples' },
    { id: 'p2', businessId: '1', name: 'Farm Fresh Carrots', category: 'Vegetables', price: 100, description: 'Sweet and crunchy carrots, perfect for salads or snacking.', image: 'https://placehold.co/300x200/FFA500/FFF?text=Carrots' },
    { id: 'p3', businessId: '2', name: 'Chicken Biryani (Single)', category: 'Main Course', price: 350, salePrice: 325, description: 'Aromatic and flavorful chicken biryani with tender chicken pieces.', image: 'https://placehold.co/300x200/8A2BE2/FFF?text=Biryani' },
    { id: 'p4', businessId: '4', name: 'Chocolate Fudge Cake', category: 'Cakes', price: 1200, description: 'Rich and decadent chocolate fudge cake, perfect for celebrations.', image: 'https://placehold.co/300x200/D2691E/FFF?text=Cake'},
];


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const router = useRouter();
  const { toast } = useToast();

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/businesses');
      if (!response.ok) {
        let detailedErrorMsg = `Server error (status ${response.status})`;
        try {
          const errorJson = await response.json();
          detailedErrorMsg += `: ${errorJson.message || errorJson.errorDetail || 'Unknown server error structure'}`;
        } catch (e) {
          if (response.statusText && response.statusText.trim() !== "" && response.statusText.trim() !== ".") {
            detailedErrorMsg += `: ${response.statusText}`;
          } else {
            detailedErrorMsg += ` (No additional error details found in response)`;
          }
        }
        throw new Error(`Failed to fetch businesses. ${detailedErrorMsg}`);
      }
      const data: Business[] = await response.json();
      setBusinesses(data);
    } catch (error) {
      console.error("AppContext - Error fetching businesses:", error);
      const clientErrorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching businesses.";
      toast({ title: "Failed to Load Businesses", description: clientErrorMessage, variant: "destructive" });
      setBusinesses([]); // Reset to empty on error
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBusinesses();

    const storedProducts = localStorage.getItem('sabziNowProducts');
    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    } else {
      setProducts(initialProducts); 
      localStorage.setItem('sabziNowProducts', JSON.stringify(initialProducts));
    }

    const storedUser = localStorage.getItem('sabziNowCurrentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, [fetchBusinesses]);


  useEffect(() => {
    if (typeof window !== 'undefined' && !loading) { 
        localStorage.setItem('sabziNowProducts', JSON.stringify(products));
    }
  }, [products, loading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !loading) {
        if (currentUser) {
            localStorage.setItem('sabziNowCurrentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('sabziNowCurrentUser');
        }
    }
  }, [currentUser, loading]);

  const registerBusiness = async (businessData: Omit<Business, 'id' | 'isSponsored' | 'adExpiryDate'>): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.errorDetail || `Failed to register: ${response.statusText || response.status}`);
      }
      
      const newBusiness: Business = result;
      
      setBusinesses(prev => [...prev, newBusiness]);
      toast({ title: "Registration Successful", description: `Welcome, ${newBusiness.name}!` });
      
      const newUser: User = { id: newBusiness.id, email: newBusiness.email, businessId: newBusiness.id };
      setCurrentUser(newUser);
      // No need to stringify newUser explicitly for localStorage, useEffect handles it.
      router.push('/dashboard');
      return true;
    } catch (error) {
      console.error("Error registering business:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during registration.";
      toast({ title: "Registration Failed", description: errorMessage, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (email: string, pass: string): Promise<boolean> => {
    // TODO: Implement API call for secure authentication against MongoDB.
    // The current implementation is insecure (checks against client-side password if available, or just email).
    setLoading(true);
    const business = businesses.find(b => b.email === email && b.password === pass); 
    if (business) {
      const user: User = { id: business.id, email: business.email, businessId: business.id };
      setCurrentUser(user);
      toast({ title: "Login Successful", description: `Welcome back, ${business.name}!` });
      router.push('/dashboard');
      setLoading(false);
      return true;
    }
    toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
    setLoading(false);
    return false;
  };

  const logoutUser = () => {
    setCurrentUser(null);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
  };

  const activateAdForCurrentUser = async (code: string): Promise<{ success: boolean; message: string }> => {
    // TODO: Implement API call to update business ad status in MongoDB.
    // Current implementation only updates local state and uses an AI flow for validation.
    if (!currentUser) {
      toast({ title: "Not Logged In", description: "You need to be logged in to activate an ad.", variant: "destructive"});
      return { success: false, message: "No user logged in." };
    }
    
    setLoading(true);
    try {
      const input: ActivateAdSubscriptionInput = { code };
      const result = await activateAdSubscription(input); 
      
      if (result.success) {
        // Optimistic update locally - a proper API call would confirm and return the updated business
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
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during ad activation.";
      toast({ title: "Ad Activation Error", description: errorMessage, variant: "destructive" });
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  
  const getBusinessById = (id: string): Business | undefined => {
    return businesses.find(b => b.id === id);
  };

  const addProduct = async (productData: Omit<Product, 'id'>): Promise<boolean> => {
    // TODO: Implement API call to add product to MongoDB, associated with the current user's business.
    // Current implementation adds to local state and localStorage.
    if (!currentUser) {
        toast({ title: "Error", description: "You must be logged in to add products.", variant: "destructive" });
        return false;
    }
    const newProduct: Product = {
        ...productData,
        id: `prod_${String(Date.now())}_${Math.random().toString(36).substring(2, 7)}`,
        businessId: currentUser.businessId,
        salePrice: productData.salePrice && productData.salePrice > 0 ? productData.salePrice : undefined,
    };
    setProducts(prev => [...prev, newProduct]);
    toast({ title: "Product Added", description: `${newProduct.name} has been added successfully.` });
    return true;
  };

  const getProductsByBusinessId = (businessId: string): Product[] => {
    return products.filter(p => p.businessId === businessId);
  };

  return (
    <AppContext.Provider value={{ 
        businesses, 
        currentUser, 
        products, 
        loading,
        fetchBusinesses,
        registerBusiness, 
        loginUser, 
        logoutUser, 
        activateAdForCurrentUser, 
        getBusinessById, 
        addProduct, 
        getProductsByBusinessId,
        toast
      }}>
      {children}
    </AppContext.Provider>
  );
};
