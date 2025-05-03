import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { storage, firestoreService, auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import type { Asset } from "@/lib/types";

// Define the asset schema
const assetSchema = z.object({
  assetName: z.string().min(2, "Name must be at least 2 characters"),
  assetPhotoURL: z.string().optional(),
  assignedTo: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  condition: z.string().optional(),
  createdAt: z.string().optional(),
  internalNotes: z.string().optional(),
  lastMaintenanceDate: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  nextMaintenanceDate: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().optional(),
  serialNumber: z.string().optional(),
  serviceDate: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  usageType: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  userId: z.string().optional(),
  updatedAt: z.string().optional(),
});

type AssetFormData = z.infer<typeof assetSchema>;

interface AssetFormProps {
  mode?: "create" | "edit" | "view";
  initialData?: Asset;
  onSuccess?: () => void;
  onCancel?: () => void;
  assetId?: string;
}

export function AssetForm({ mode = "create", initialData, onSuccess, onCancel, assetId }: AssetFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isViewMode = mode === "view";

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: initialData || {
      assetName: "",
      assetPhotoURL: "",
      assignedTo: "",
      category: "",
      condition: "new",
      createdAt: new Date().toISOString(),
      internalNotes: "",
      lastMaintenanceDate: "",
      location: "",
      manufacturer: "",
      model: "",
      nextMaintenanceDate: "",
      purchaseDate: "",
      purchasePrice: undefined,
      serialNumber: "",
      serviceDate: "",
      status: "available",
      usageType: "company_owned",
      warrantyExpiry: "",
      userId: auth.currentUser?.uid,
      updatedAt: "",
    },
  });

  // Fetch asset data for edit mode
  useEffect(() => {
    if (mode === "edit" && assetId) {
      const fetchAsset = async () => {
        try {
          const asset = await firestoreService.getAsset(assetId);
          if (asset) {
            form.reset(asset);
          }
        } catch (error) {
          console.error("Error fetching asset:", error);
          toast({
            title: "Error",
            description: "Failed to fetch asset data",
            variant: "destructive"
          });
        }
      };
      fetchAsset();
    }
  }, [mode, assetId, form, toast]);

  const handlePhotoUpload = async (file: File): Promise<string | null> => {
    if (!file || !auth.currentUser) return null;

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `assets/${auth.currentUser.uid}/${fileName}`);
      const uploadTask = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadTask.ref);

      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      });

      return downloadUrl;
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: AssetFormData) => {
      if (!auth.currentUser) throw new Error("You must be logged in");

      const assetData: Asset = {
        ...data,
        userId: auth.currentUser.uid,
        assetPhotoURL: data.assetPhotoURL || "",
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (mode === "edit" && assetId) {
        await firestoreService.updateAsset(assetId, assetData);
        return assetId;
      } else {
        return await firestoreService.createAsset(assetData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast({
        title: "Success",
        description: `Asset ${mode === "edit" ? "updated" : "created"} successfully`,
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AssetFormData) => {
    try {
      await mutation.mutateAsync(data);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save asset",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="assetName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter asset name" 
                    {...field} 
                    disabled={isViewMode}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isViewMode}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="tools">Tools</SelectItem>
                    <SelectItem value="heavy_equipment">Heavy Equipment</SelectItem>
                    <SelectItem value="vehicles">Vehicles</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="manufacturer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manufacturer</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter manufacturer" 
                    {...field} 
                    disabled={isViewMode}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter model" 
                    {...field} 
                    disabled={isViewMode}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serial Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter serial number" 
                    {...field} 
                    disabled={isViewMode}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter location" 
                    {...field} 
                    disabled={isViewMode}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned To</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter assignee" 
                    {...field} 
                    disabled={isViewMode}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isViewMode}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in_use">In Use</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condition</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isViewMode}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="usageType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usage Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isViewMode}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select usage type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="company_owned">Company Owned</SelectItem>
                    <SelectItem value="leased">Leased</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchasePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Price</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter purchase price" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    disabled={isViewMode}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    disabled={isViewMode}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="warrantyExpiry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Warranty Expiry</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    disabled={isViewMode}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastMaintenanceDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Maintenance Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    disabled={isViewMode}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nextMaintenanceDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Next Maintenance Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    disabled={isViewMode}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serviceDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    disabled={isViewMode}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!isViewMode && (
          <FormField
            control={form.control}
            name="assetPhotoURL"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Photo</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await handlePhotoUpload(file);
                          if (url) {
                            field.onChange(url);
                          }
                        }
                      }}
                      disabled={isViewMode || isUploading}
                    />
                    {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {form.watch("assetPhotoURL") && (
          <div className="col-span-2">
            <img 
              src={form.watch("assetPhotoURL")} 
              alt="Asset preview" 
              className="max-w-[200px] rounded-md"
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="internalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Internal Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter internal notes" 
                  className="min-h-[100px]" 
                  {...field} 
                  disabled={isViewMode}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}

          {!isViewMode && (
            <Button 
              type="submit" 
              disabled={mutation.isPending || isUploading}
            >
              {mutation.isPending || isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "edit" ? "Updating..." : "Creating..."}
                </>
              ) : (
                mode === "edit" ? "Update Asset" : "Create Asset"
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

export default AssetForm;