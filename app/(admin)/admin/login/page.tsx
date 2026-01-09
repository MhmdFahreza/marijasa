// app/(admin)/admin/login/page.tsx
import { Suspense } from "react";
import { LoginForm } from "@/app/components/ui/login-form";

export const metadata = {
  title: "Admin Login - Marijasa",
  description: "Login to admin dashboard",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950">
      <div className="w-full max-w-sm">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-12">
              <div className="h-8 w-8 border-4 border-[#7CE0A8] border-t-transparent rounded-full animate-spin"></div>
            </div>
          }
        >
          <LoginForm userType="admin" />
        </Suspense>
      </div>
    </div>
  );
}