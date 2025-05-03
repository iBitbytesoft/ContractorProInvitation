import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { AssetOperations } from '@/lib/operations/AssetOperations';
import { handleApiError } from '@/lib/utils/errorHandling';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, toSafeDate } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import Firebase Storage functions
import { getFirestore, doc, updateDoc, setDoc, collection } from "firebase/firestore"; // Import Firebase Firestore functions
import {auth} from "@/lib/firebase";


// Define the asset form schema using zod
const assetFormSchema = z.object({
  assetName: z.string().min(1, { message: "Asset name is required" }),
  category: z.string().min(1, { message: "Category is required" }),
  location: z.string().min(1, { message: "Location is required" }),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  condition: z.enum(["new", "good", "fair", "poor", "needs_repair", "decommissioned"]).optional(),
  purchasePrice: z.string().optional(),
  assignedTo: z.string().optional(),
  usageType: z.enum(["company_owned", "rented", "leased"]).optional(),
  notes: z.string().optional(),
  status: z.enum(["available", "in_use", "maintenance", "retired"]),
  type: z.enum(["heavy_equipment", "tools", "vehicles", "other"]),
  // The following fields will be handled separately since they involve Date objects
  purchaseDate: z.date().optional(),
  warrantyExpiry: z.date().optional(),
  lastMaintenanceDate: z.date().optional(),
  nextMaintenanceDate: z.date().optional(),
  assetPhotoURL: z.string().optional(), // Add assetPhotoURL to schema
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface EnhancedAssetFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
  isReadOnly?: boolean;
}

export function EnhancedAssetForm({ initialData, onSuccess, onCancel, isReadOnly = false }: EnhancedAssetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(initialData?.assetPhotoURL || null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      assetName: initialData?.assetName || '',
      category: initialData?.category || '',
      type: initialData?.type || 'heavy_equipment',
      location: initialData?.location || '',
      manufacturer: initialData?.manufacturer || '',
      model: initialData?.model || '',
      serialNumber: initialData?.serialNumber || '',
      condition: initialData?.condition || 'good',
      purchasePrice: initialData?.purchasePrice?.toString() || '',
      assignedTo: initialData?.assignedTo || '',
      usageType: initialData?.usageType || 'company_owned',
      notes: initialData?.notes || '',
      status: initialData?.status || 'available',
      purchaseDate: initialData?.purchaseDate ? toSafeDate(initialData.purchaseDate) || undefined : new Date(),
      warrantyExpiry: initialData?.warrantyExpiry ? toSafeDate(initialData.warrantyExpiry) || undefined : new Date(),
      lastMaintenanceDate: initialData?.lastMaintenanceDate ? toSafeDate(initialData.lastMaintenanceDate) || undefined : new Date(),
      nextMaintenanceDate: initialData?.nextMaintenanceDate ? toSafeDate(initialData.nextMaintenanceDate) || undefined : new Date(),
      assetPhotoURL: initialData?.assetPhotoURL || "" //add default value
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // Create a preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
    }
  };

  const generateUniqueFileName = (file: File): string => {
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${file.name}`;
    return fileName;
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    try {
      const storage = getStorage();
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");
      const storageRef = ref(storage, `assets/${userId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
      throw error;
    }
  };


  const onSubmit = async (data: AssetFormValues) => {
    setIsSubmitting(true);
    try {
      if (!auth.currentUser?.uid) throw new Error("User not authenticated");
     
      if (initialData?.id) {
        if (imageFile){
          await AssetOperations.updateAsset(initialData.id, data, imageFile);
        }
        else{
          await AssetOperations.updateAsset(initialData.id, data);
        }
        await AssetOperations.updateAsset(initialData.id, data);
      } else {
        if (imageFile){
          await AssetOperations.createAsset(data, imageFile);
        }
        else{
          await AssetOperations.createAsset(data);
        }
      }
      toast.success(`Asset ${initialData?.id ? 'updated' : 'created'} successfully`);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving asset:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="w-full mb-4">
                <div className="flex items-center justify-center">
                  <div className="relative h-48 w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex justify-center items-center">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Asset preview"
                        className="h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Upload asset image</p>
                      </div>
                    )}
                  </div>
                </div>
                {!isReadOnly && (
                  <Input
                    type="file"
                    accept="image/*"
                    className="mt-2"
                    onChange={handleImageChange}
                    disabled={isReadOnly}
                  />
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="assetName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Name*</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isReadOnly} />
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
                  <FormLabel>Category*</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isReadOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isReadOnly}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="heavy_equipment">Heavy Equipment</SelectItem>
                      <SelectItem value="tools">Tools</SelectItem>
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location*</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isReadOnly} />
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
                  <FormLabel>Status*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isReadOnly}
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
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturer</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isReadOnly} />
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
                    <Input {...field} disabled={isReadOnly} />
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
                    <Input {...field} disabled={isReadOnly} />
                  </FormControl>
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
                    <Input {...field} type="number" disabled={isReadOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Purchase Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isReadOnly}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={isReadOnly}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                    <Input {...field} disabled={isReadOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={5}
                  disabled={isReadOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isReadOnly && (
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onCancel?.()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : initialData ? 'Update Asset' : 'Create Asset'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}