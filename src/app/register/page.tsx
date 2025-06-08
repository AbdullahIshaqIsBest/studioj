"use client";

import RegistrationForm from '@/components/auth/RegistrationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="flex justify-center items-start py-8 min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Register Your Business</CardTitle>
          <CardDescription>Join SabziNow and reach more customers!</CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationForm />
        </CardContent>
      </Card>
    </div>
  );
}
