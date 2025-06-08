import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-card/50 border-t border-border/50 py-6 text-center mt-12">
      <div className="container mx-auto px-4">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SabziNow. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Delivering Freshness to Pakistan. Payment via Cash on Delivery.
        </p>
      </div>
    </footer>
  );
}
