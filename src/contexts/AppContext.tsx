
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

// Business interface as returned by API (password excluded)
export interface Business {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  category: BusinessCategory;
  phone: string;
  email: string;
  // password?: string; // Password should not be on the client-side Business object
  image?: string; 
  isSponsored: boolean;
  adExpiryDate?: string;
  createdAt?: string; 
  updatedAt?: string; 
}

// User interface for client-side session
export interface User {
  id: string; // Corresponds to Business ID
  email: string;
  businessId: string; // Same as id for now
  name: string; // Add business name for display purposes
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
        // Avoid double toast if already handled
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
                // Optional: Could add a call here to verify user session with backend if implementing tokens
                setCurrentUser(parsedUser);
            } catch (e) {
                console.error("Failed to parse stored user:", e);
                localStorage.removeItem('sabziNowCurrentUser');
            }
        }
        setLoading(false); // Overall loading false after all initial fetches
    });
  }, [fetchBusinesses, fetchProducts]);


  useEffect(() => {
    // This effect now only handles currentUser persistence
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
        body: JSON.stringify(businessData), // businessData includes password for registration
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
      
      const newApiBusiness: Business = result; // API returns business without password
      
      // Add to local state (optimistic update, or rely on next fetchBusinesses)
      setBusinesses(prev => [...prev, newApiBusiness]);
      toast({ title: "Registration Successful", description: `Welcome, ${newApiBusiness.name}!` });
      
      // Automatically log in the new user
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
        // API handles 400, 401, 500 etc.
        const message = result.message || (response.status === 401 ? "Invalid email or password." : "Login failed.");
        const detail = result.errorDetail || '';
        const fullMessage = detail ? `${message} Details: ${detail}` : message;
        toast({ title: "Login Failed", description: fullMessage, variant: "destructive" });
        console.error('Login API Error:', result);
        setLoading(false);
        return false;
      }

      const loggedInBusiness: Business = result; // API returns business details (no password)
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
    // TODO: Implement API call for server-side session invalidation if using tokens/sessions.
    setCurrentUser(null);
    // localStorage.removeItem('sabziNowCurrentUser'); // Handled by useEffect for currentUser
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
  };
  
  const activateAdForCurrentUser = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      toast({ title: "Not Logged In", description: "You need to be logged in to activate an ad.", variant: "destructive"});
      return { success: false, message: "No user logged in." };
    }
    
    setLoading(true);
    try {
      // TODO: This should be an API call that updates the business in MongoDB.
      // The AI flow is for code validation, not data persistence directly.
      const aiInput: ActivateAdSubscriptionInput = { code };
      const aiResult = await activateAdSubscription(aiInput); 
      
      if (aiResult.success) {
        // Placeholder for API call to update business sponsorship status
        // For now, optimistic update locally
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
        // Also update the business object for the current user if they view their own page
        const updatedBusiness = businesses.find(b => b.id === currentUser.businessId);
        if (updatedBusiness) {
            // This is a bit indirect; ideally, the business object for the dashboard would also re-fetch or update
        }

        toast({ title: "Ad Activated!", description: aiResult.message });
        // Fetch businesses again to reflect the change from a potential (future) backend update
        await fetchBusinesses(); 
        return { success: true, message: aiResult.message };
      } else {
        toast({ title: "Ad Activation Failed", description: aiResult.message, variant: "destructive" });
        return { success: false, message: aiResult.message };
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

  const addProduct = async (productData: Omit<Product, 'id' | 'businessId'>): Promise<boolean> => {
    if (!currentUser) {
        toast({ title: "Error", description: "You must be logged in to add products.", variant: "destructive" });
        return false;
    }
    setLoading(true);
    try {
        const productPayload = {
            ...productData,
            businessId: currentUser.businessId, // Add businessId from current user
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
