"use client";

import LoginForm from '@/components/auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex justify-center items-start py-8 min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
             <KeyRound className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Business Login</CardTitle>
          <CardDescription>Access your SabziNow dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
