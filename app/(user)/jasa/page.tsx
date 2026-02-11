// app/jasa/page.tsx 
import { Suspense } from "react";
import JasaPageContent from "@/app/components/ui/JasaPageContent";
import { LoaderTwo } from "@/app/components/transition/loader";

export default function JasaPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <LoaderTwo />
        </div>
      }
    >
      <JasaPageContent />
    </Suspense>
  );
}