
"use client";

import React, { createContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
// Removed direct import of Genkit flow for ad activation, will go through API
// import { activateAdSubscription, type ActivateAdSubscriptionInput } from '@/ai/flows/activate-ad-subscription';

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
  name: string; 
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
  fetchProducts: () => Promise<void>;
  registerBusiness: (businessData: Omit<Business & {password: string}, 'id' | 'isSponsored' | 'adExpiryDate'>) => Promise<boolean>;
  loginUser: (email: string, pass: string) => Promise<boolean>;
  logoutUser: () => void;
  activateAdForCurrentUser: (code: string) => Promise<{ success: boolean; message: string }>;
  getBusinessById: (id: string) => Business | undefined;
  addProduct: (productData: Omit<Product, 'id'>) => Promise<boolean>;
  getProductsByBusinessId: (businessId: string) => Product[];
  toast: ToastFunctionType;
}

export const AppContext = createContext<AppContextType | null>(null);

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
        let detailedErrorMsg = `Server error (status ${response.status})`;
        try {
          const errorJson = await response.json();
          const serverMessage = errorJson.message || 'No specific message from server.';
          const serverDetail = errorJson.errorDetail || '';
          
          detailedErrorMsg += `: ${serverMessage}`;
          if (serverDetail && serverDetail !== serverMessage && serverDetail.trim() !== "") {
            detailedErrorMsg += ` Details: ${serverDetail}`;
          }
          console.error('Client_API_ERROR_JSON when fetching businesses:', errorJson);
        } catch (e) {
          const statusText = (response.statusText && response.statusText.trim() !== "") ? response.statusText : "Unable to retrieve server error text.";
          detailedErrorMsg += `: ${statusText}`;
          if (!(e instanceof SyntaxError)) { 
            console.error('Client_API_ERROR_PARSING_FAILED or NON-JSON_RESPONSE when fetching businesses:', e);
          }
        }
        console.error(`Full detailed error for toast (fetchBusinesses): ${detailedErrorMsg}`);
        toast({ title: "Failed to Load Businesses", description: detailedErrorMsg, variant: "destructive" });
        throw new Error(`Failed to fetch businesses. ${detailedErrorMsg}`);
      }
      const data: Business[] = await response.json();
      setBusinesses(data);
    } catch (error) {
      if (!(error instanceof Error && error.message.startsWith('Failed to fetch businesses'))) {
        console.error("AppContext - Error fetching businesses:", error);
      }
      if (error instanceof Error && !error.message.includes("Server error")) {
          toast({ title: "Network Error", description: `Could not connect to server to fetch businesses. ${error.message}`, variant: "destructive" });
      }
      setBusinesses([]); 
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        let detailedErrorMsg = `Server error (status ${response.status})`;
        try {
          const errorJson = await response.json();
          const serverMessage = errorJson.message || 'No specific message.';
          const serverDetail = errorJson.errorDetail || '';
          detailedErrorMsg += `: ${serverMessage}${serverDetail ? ` Details: ${serverDetail}` : ''}`;
        } catch (e) {
          detailedErrorMsg += response.statusText ? `: ${response.statusText}` : ": Unable to retrieve server error text.";
        }
        toast({ title: "Failed to Load Products", description: detailedErrorMsg, variant: "destructive" });
        throw new Error(`Failed to fetch products. ${detailedErrorMsg}`);
      }
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (error) {
        console.error("AppContext - Error fetching products:", error);
        if (error instanceof Error && !error.message.includes("Server error")) {
            toast({ title: "Product Fetch Error", description: error.message, variant: "destructive" });
        }
        setProducts([]);
    } finally {
        setLoading(false);
    }
  }, [toast]);


  useEffect(() => {
    Promise.all([fetchBusinesses(), fetchProducts()]).then(() => {
        const storedUser = localStorage.getItem('sabziNowCurrentUser');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setCurrentUser(parsedUser);
            } catch (e) {
                console.error("Failed to parse stored user:", e);
                localStorage.removeItem('sabziNowCurrentUser');
            }
        }
        setLoading(false); 
    });
  }, [fetchBusinesses, fetchProducts]);


  useEffect(() => {
    if (typeof window !== 'undefined' && !loading) { 
        if (currentUser) {
            localStorage.setItem('sabziNowCurrentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('sabziNowCurrentUser');
        }
    }
  }, [currentUser, loading]);

  const registerBusiness = async (businessData: Omit<Business & {password: string}, 'id' | 'isSponsored' | 'adExpiryDate'>): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessData), 
      });

      const result = await response.json();

      if (!response.ok) {
        let serverErrorMsg = `Registration failed (status ${response.status})`;
        const serverMessage = result.message || 'No specific message from server.';
        const serverDetail = result.errorDetail || '';
        serverErrorMsg += `: ${serverMessage}${serverDetail && serverDetail !== serverMessage && serverDetail.trim() !== "" ? ` Details: ${serverDetail}` : ''}`;
        console.error('Client_API_ERROR_JSON when registering business:', result);
        throw new Error(serverErrorMsg);
      }
      
      const newApiBusiness: Business = result; 
      
      setBusinesses(prev => [...prev, newApiBusiness]);
      toast({ title: "Registration Successful", description: `Welcome, ${newApiBusiness.name}!` });
      
      const newUser: User = { 
        id: newApiBusiness.id, 
        email: newApiBusiness.email, 
        businessId: newApiBusiness.id,
        name: newApiBusiness.name
      };
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
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      const result = await response.json();

      if (!response.ok) {
        const message = result.message || (response.status === 401 ? "Invalid email or password." : "Login failed.");
        const detail = result.errorDetail || '';
        const fullMessage = detail ? `${message} Details: ${detail}` : message;
        toast({ title: "Login Failed", description: fullMessage, variant: "destructive" });
        console.error('Login API Error:', result);
        setLoading(false);
        return false;
      }

      const loggedInBusiness: Business = result; 
      const user: User = { 
        id: loggedInBusiness.id, 
        email: loggedInBusiness.email, 
        businessId: loggedInBusiness.id,
        name: loggedInBusiness.name
      };
      setCurrentUser(user);
      toast({ title: "Login Successful", description: `Welcome back, ${loggedInBusiness.name}!` });
      router.push('/dashboard');
      return true;
    } catch (error) {
      console.error("Error during login:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown network error occurred during login.";
      toast({ title: "Login Error", description: errorMessage, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
  };
  
  const activateAdForCurrentUser = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      const msg = "You need to be logged in to activate an ad.";
      toast({ title: "Not Logged In", description: msg, variant: "destructive"});
      return { success: false, message: msg };
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/businesses/${currentUser.businessId}/activate-ad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.message || `Ad activation failed (status ${response.status}).`;
        const errorDetail = result.errorDetail || '';
        const fullMessage = errorDetail ? `${errorMessage} Details: ${errorDetail}` : errorMessage;
        toast({ title: "Ad Activation Failed", description: fullMessage, variant: "destructive" });
        console.error('Ad Activation API Error:', result);
        return { success: false, message: fullMessage };
      }
      
      const updatedBusinessFromApi: Business = result;

      setBusinesses(prevBusinesses =>
        prevBusinesses.map(b =>
          b.id === updatedBusinessFromApi.id
            ? updatedBusinessFromApi
            : b
        )
      );

      let successMessage = "Ad subscription activated successfully.";
      if (updatedBusinessFromApi.adExpiryDate) {
        successMessage = `Your ad subscription is now active until ${new Date(updatedBusinessFromApi.adExpiryDate).toLocaleDateString()}.`;
      }
      toast({ title: "Ad Activated!", description: successMessage });
      return { success: true, message: successMessage };

    } catch (error) {
      console.error("Error activating ad:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown network error occurred during ad activation.";
      toast({ title: "Ad Activation Error", description: errorMessage, variant: "destructive" });
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  
  const getBusinessById = (id: string): Business | undefined => {
    return businesses.find(b => b.id === id);
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'businessId'>): Promise<boolean> => {
    if (!currentUser) {
        toast({ title: "Error", description: "You must be logged in to add products.", variant: "destructive" });
        return false;
    }
    setLoading(true);
    try {
        const productPayload = {
            ...productData,
            businessId: currentUser.businessId, 
            salePrice: productData.salePrice && productData.salePrice > 0 ? productData.salePrice : undefined,
        };

        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productPayload),
        });

        const newProduct = await response.json();

        if (!response.ok) {
            const message = newProduct.message || "Failed to add product.";
            const detail = newProduct.errorDetail || "";
            const fullMessage = detail ? `${message} Details: ${detail}` : message;
            toast({ title: "Add Product Failed", description: fullMessage, variant: "destructive" });
            console.error('Add Product API Error:', newProduct);
            setLoading(false);
            return false;
        }
        
        setProducts(prev => [...prev, newProduct]);
        toast({ title: "Product Added", description: `${newProduct.name} has been added successfully.` });
        return true;
    } catch (error) {
        console.error("Error adding product:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown network error occurred.";
        toast({ title: "Add Product Error", description: errorMessage, variant: "destructive" });
        return false;
    } finally {
        setLoading(false);
    }
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
        fetchProducts,
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
