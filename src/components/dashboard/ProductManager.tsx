
"use client";

import React, { useContext, useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AppContext, type Product } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PackagePlus, Sparkles, Loader2, List, Tag, Image as ImageIcon, DollarSign } from 'lucide-react';
import { generateProductDescription, type GenerateProductDescriptionInput } from '@/ai/flows/generate-product-description-flow';
import Image from 'next/image';

const productSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  category: z.string().min(2, { message: "Category is required." }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  image: z.string().url({ message: "Please enter a valid image URL." }).optional().or(z.literal('')),
  keywords: z.string().optional(), // For AI description generation
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductManagerProps {
  businessId: string;
}

export default function ProductManager({ businessId }: ProductManagerProps) {
  const context = useContext(AppContext);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [businessProducts, setBusinessProducts] = useState<Product[]>([]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      price: 0,
      description: '',
      image: '',
      keywords: '',
    },
  });

  useEffect(() => {
    if (context?.currentUser && context.getProductsByBusinessId) {
      setBusinessProducts(context.getProductsByBusinessId(context.currentUser.businessId));
    }
  }, [context, context?.products]);


  if (!context) return <p>Loading context...</p>;
  const { addProduct, getProductsByBusinessId, currentUser } = context;

  if (!currentUser || currentUser.businessId !== businessId) {
    return <p className="text-destructive">Unauthorized to manage products for this business.</p>;
  }
  
  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    setIsAddingProduct(true);
    const productData: Omit<Product, 'id' | 'businessId'> = {
      name: data.name,
      category: data.category,
      price: data.price,
      description: data.description,
      image: data.image || undefined,
    };
    const success = await addProduct(productData as Omit<Product, 'id'>); // Explicit cast needed due to businessId
    if (success) {
      form.reset();
      // Products list will update via useEffect on context.products
    }
    setIsAddingProduct(false);
  };

  const handleGenerateDescription = async () => {
    const productName = form.getValues("name");
    const category = form.getValues("category");
    const keywords = form.getValues("keywords");

    if (!productName || !category) {
      context.toast({
        title: "Missing Information",
        description: "Please enter Product Name and Category before generating description.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingDesc(true);
    try {
      const input: GenerateProductDescriptionInput = { productName, category, keywords };
      const result = await generateProductDescription(input);
      form.setValue("description", result.description, { shouldValidate: true });
      context.toast({
        title: "Description Generated!",
        description: "AI has crafted a description for your product.",
      });
    } catch (error) {
      console.error("Failed to generate description:", error);
      context.toast({
        title: "Error",
        description: "Could not generate description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDesc(false);
    }
  };
  
  const getImageHint = (category: string): string => {
    if (category.toLowerCase().includes('fruit')) return "fruits assortment";
    if (category.toLowerCase().includes('vegetable')) return "vegetables market";
    if (category.toLowerCase().includes('bakery') || category.toLowerCase().includes('cake')) return "bakery goods";
    if (category.toLowerCase().includes('meal') || category.toLowerCase().includes('food')) return "delicious meal";
    if (category.toLowerCase().includes('drink') || category.toLowerCase().includes('beverage')) return "refreshing drink";
    return "product item";
  }


  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <PackagePlus className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-headline">Product Management</CardTitle>
            <CardDescription>Add and manage products for your business.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 border border-border rounded-lg bg-card/50">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Fresh Mangoes, Chicken Karahi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Fruits, Main Course, Bakery" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (PKR)</FormLabel>
                    <FormControl>
                       <div className="flex items-center">
                         <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
                         <Input type="number" placeholder="e.g., 250" {...field} />
                       </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords for AI (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., sweet, juicy, spicy, traditional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Tell customers about this product..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" variant="outline" onClick={handleGenerateDescription} disabled={isGeneratingDesc} className="w-full sm:w-auto border-accent text-accent hover:bg-accent/10">
              {isGeneratingDesc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              AI Generate Description
            </Button>
             <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl>
                     <div className="flex items-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground mr-2" />
                        <Input placeholder="https://placehold.co/300x200.png" {...field} />
                     </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isAddingProduct}>
              {isAddingProduct ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackagePlus className="mr-2 h-4 w-4" />}
              Add Product
            </Button>
          </form>
        </Form>

        <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 text-primary flex items-center"><List className="mr-2 h-6 w-6"/> Your Products</h3>
            {businessProducts.length === 0 ? (
                <p className="text-muted-foreground">You haven't added any products yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {businessProducts.map(product => (
                        <Card key={product.id} className="flex flex-col overflow-hidden shadow-md">
                            <CardHeader className="p-0">
                                <Image
                                    src={product.image || `https://placehold.co/300x200/6AB04C/FFF?text=${encodeURIComponent(product.name)}`}
                                    alt={product.name}
                                    width={300}
                                    height={200}
                                    className="w-full h-40 object-cover"
                                    data-ai-hint={getImageHint(product.category)}
                                />
                            </CardHeader>
                            <CardContent className="p-4 flex-grow">
                                <CardTitle className="text-lg font-headline mb-1 text-primary">{product.name}</CardTitle>
                                <Badge variant="secondary" className="mb-2 text-xs"><Tag className="mr-1 h-3 w-3"/>{product.category}</Badge>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-3">{product.description}</p>
                            </CardContent>
                            <CardFooter className="p-4 bg-muted/30 border-t border-border/20 flex justify-between items-center">
                                <p className="font-semibold text-primary text-lg">PKR {product.price}</p>
                                {/* Future: Edit/Delete buttons */}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>

      </CardContent>
    </Card>
  );
}


    