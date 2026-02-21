"use client";

import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ToastProvider } from "@/lib/toast-context";
import CartDrawer from "@/components/CartDrawer";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CartProvider>
          <ToastProvider>
            {children}
            <CartDrawer />
          </ToastProvider>
        </CartProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
