"use client";

import React, { useContext, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, KeyRound } from 'lucide-react';

const adActivationSchema = z.object({
  code: z.string().min(1, { message: "Activation code is required." }),
});

type AdActivationFormData = z.infer<typeof adActivationSchema>;

export default function AdActivationForm() {
  const context = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AdActivationFormData>({
    resolver: zodResolver(adActivationSchema),
    defaultValues: {
      code: '',
    },
  });

  if (!context) return <p>Loading context...</p>;
  const { activateAdForCurrentUser } = context;

  const onSubmit: SubmitHandler<AdActivationFormData> = async (data) => {
    setIsLoading(true);
    await activateAdForCurrentUser(data.code);
    setIsLoading(false);
    form.reset(); // Reset form after submission
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border border-border rounded-lg bg-card">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">Activation Code</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <KeyRound className="h-5 w-5 text-muted-foreground" />
                  <Input placeholder="Enter your code (e.g., AbdullahPremium)" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Activate Ad
        </Button>
      </form>
    </Form>
  );
}
