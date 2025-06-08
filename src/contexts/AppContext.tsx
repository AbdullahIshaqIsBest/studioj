
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
  city: string;
  phone: string;
  email: string;
  password?: string;
  image?: string; 
  isSponsored: boolean;
  adExpiryDate?: string;
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
  salePrice?: number; // Added for deals/sales
  description: string;
  image?: string; 
}

type ToastFunctionType = ReturnType<typeof useToast>['toast'];

interface AppContextType {
  businesses: Business[];
  currentUser: User | null;
  products: Product[];
  loading: boolean;
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

const initialBusinesses: Business[] = [
  {
    id: '1',
    name: 'Fresh Farms Co.',
    description: 'The freshest vegetables and fruits, straight from the farm to your table. Organic options available.',
    address: '123 Green Valley',
    city: 'Lahore',
    phone: '0300-1234567',
    email: 'farm@example.com',
    password: 'password123',
    image: 'https://placehold.co/600x400/6AB04C/FFF?text=Fresh+Farms',
    isSponsored: true,
    adExpiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    name: 'Karachi Kuisine',
    description: 'Authentic Karachi biryani, haleem, and more. Taste the tradition of the city of lights.',
    address: '456 Biryani Lane',
    city: 'Karachi',
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
    address: '789 Food Street',
    city: 'Lahore',
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
    address: 'Cafe Road',
    city: 'Islamabad',
    phone: '0311-5550000',
    email: 'bakery@example.com',
    password: 'password123',
    image: 'https://placehold.co/600x400/A3C459/FFF?text=Sweet+Delights',
    isSponsored: true,
    adExpiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const initialProducts: Product[] = [
    { id: 'p1', businessId: '1', name: 'Organic Apples', category: 'Fruits', price: 250, salePrice: 220, description: 'Crisp and juicy organic apples, freshly picked.', image: 'https://placehold.co/300x200/FF6347/FFF?text=Apples' },
    { id: 'p2', businessId: '1', name: 'Farm Fresh Carrots', category: 'Vegetables', price: 100, description: 'Sweet and crunchy carrots, perfect for salads or snacking.', image: 'https://placehold.co/300x200/FFA500/FFF?text=Carrots' },
    { id: 'p3', businessId: '2', name: 'Chicken Biryani (Single)', category: 'Main Course', price: 350, salePrice: 325, description: 'Aromatic and flavorful chicken biryani with tender chicken pieces.', image: 'https://placehold.co/300x200/8A2BE2/FFF?text=Biryani' },
];


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const storedBusinesses = localStorage.getItem('sabziNowBusinesses');
    if (storedBusinesses) {
      setBusinesses(JSON.parse(storedBusinesses));
    } else {
      setBusinesses(initialBusinesses);
      localStorage.setItem('sabziNowBusinesses', JSON.stringify(initialBusinesses));
    }

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
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
        localStorage.setItem('sabziNowBusinesses', JSON.stringify(businesses));
    }
  }, [businesses, loading]);

  useEffect(() => {
    if (!loading) {
        localStorage.setItem('sabziNowProducts', JSON.stringify(products));
    }
  }, [products, loading]);

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
      id: String(Date.now()),
      isSponsored: false,
    };
    setBusinesses(prev => [...prev, newBusiness]);
    toast({ title: "Registration Successful", description: `Welcome, ${newBusiness.name}!` });
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

  const addProduct = async (productData: Omit<Product, 'id'>): Promise<boolean> => {
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
