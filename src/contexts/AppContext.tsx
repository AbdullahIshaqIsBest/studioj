
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
  password?: string; // Password is sent for registration, not stored in frontend state after fetch
  image?: string; 
  isSponsored: boolean;
  adExpiryDate?: string;
  createdAt?: string; // Added from MongoDB
  updatedAt?: string; // Added from MongoDB
}

export interface User {
  id: string; // Should correspond to Business ID for simplicity in this app
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
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/businesses');
      if (!response.ok) {
        throw new Error(`Failed to fetch businesses: ${response.statusText}`);
      }
      const data: Business[] = await response.json();
      setBusinesses(data);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      toast({ title: "Error", description: "Could not load businesses. Please try again later.", variant: "destructive" });
      // Optionally, set businesses to an empty array or handle appropriately
      setBusinesses([]); 
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
      // For now, if no products in localStorage, use initialProducts
      // This part will be replaced when products are moved to MongoDB
      setProducts(initialProducts); 
      localStorage.setItem('sabziNowProducts', JSON.stringify(initialProducts));
    }

    const storedUser = localStorage.getItem('sabziNowCurrentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    // Initial loading includes business fetch, products, and user from localStorage
  }, [fetchBusinesses]);


  useEffect(() => {
    // Products still use localStorage for now
    if (!loading) { // Check loading to prevent writing initial empty/default state
        localStorage.setItem('sabziNowProducts', JSON.stringify(products));
    }
  }, [products, loading]);

  useEffect(() => {
    // CurrentUser still uses localStorage
    if (!loading) {
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to register business: ${response.statusText}`);
      }
      
      const newBusiness: Business = result; // API returns the created business
      
      setBusinesses(prev => [...prev, newBusiness]);
      toast({ title: "Registration Successful", description: `Welcome, ${newBusiness.name}!` });
      
      const newUser: User = { id: newBusiness.id, email: newBusiness.email, businessId: newBusiness.id };
      setCurrentUser(newUser);
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
    // TODO: This needs to be updated to an API call for user authentication against MongoDB
    // For now, it still checks against the locally fetched businesses state.
    // This is NOT secure and is a placeholder.
    setLoading(true);
    const business = businesses.find(b => b.email === email && b.password === pass); // Password check here is temporary
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
    // No API call needed for logout with client-side session
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
  };

  const activateAdForCurrentUser = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: "No user logged in." };
    }
    // TODO: This needs to be an API call to update the business in MongoDB
    // For now, it optimistically updates the local state. This will be out of sync with DB.
    const input: ActivateAdSubscriptionInput = { code };
    try {
      const result = await activateAdSubscription(input); // This is an AI flow, not a DB update
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
        // This change is only local. A proper API call would be needed here.
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

  const addProduct = async (productData: Omit<Product, 'id'>): Promise<boolean> => {
    // TODO: This needs to be an API call to add product to MongoDB
    // For now, it adds to local state and localStorage.
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
    // This will filter from the 'products' state, which is still localStorage based.
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

