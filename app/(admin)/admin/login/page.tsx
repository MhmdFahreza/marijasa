// app/(admin)/admin/login/page.tsx
import { Suspense } from "react";
import { LoginForm } from "@/app/components/ui/login-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
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