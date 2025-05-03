import { useState, useEffect } from "react";
import { BusinessProfileForm } from "@/components/forms/BusinessProfileForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet-async";
import { Building2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

export default function BusinessProfilePage() {
  const { toast } = useToast();

  // Fetch existing profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ['businessProfile'],
    queryFn: async () => {
      try {
        const response = await fetchWithAuth('/api/business-profiles');
        if (!response.ok) {
          throw new Error('Failed to fetch business profile');
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching business profile:", error);
        return null;
      }
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Building2 className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold">Business Profile</h1>
            <p className="text-muted-foreground">
              Manage your company information and brand assets
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-96" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Business Profile | ContractorPro</title>
      </Helmet>

      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Building2 className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold">Business Profile</h1>
            <p className="text-muted-foreground">
              Manage your company information and brand assets
            </p>
          </div>
        </div>

        <BusinessProfileForm 
          defaultValues={profile || undefined}
          onSuccess={() => {
            toast({
              title: "Success",
              description: "Business profile updated successfully",
            });
          }} 
        />
      </div>
    </>
  );
}