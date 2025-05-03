import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PlusCircle } from "lucide-react";
import { auth } from "@/lib/firebase";
import { Document, Vendor } from "@/lib/types";
import DocumentOperations from "@/lib/operations/DocumentOperations";
import { VendorOperations } from "@/lib/firestore";

// Document schema with enhanced fields
const documentSchema = z.object({
  documentName: z.string().min(1, "Document name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  vendorId: z.string().optional(),
  file: z.any().refine((file) => file instanceof File, {
    message: "Please select a file",
  }),
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface UploadDocumentFormProps {
  onSuccess?: () => void;
  vendorId?: string; // Optional vendorId for pre-selecting a vendor
}

function UploadDocumentForm({ onSuccess, vendorId }: UploadDocumentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  // Fetch vendors for the dropdown
  const { data: vendors = [], isLoading: isLoadingVendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => VendorOperations.getAllVendors(),
  });

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      documentName: "",
      category: "",
      description: "",
      vendorId: vendorId || "",
    },
  });

  // Set vendorId if provided as a prop
  useEffect(() => {
    if (vendorId) {
      form.setValue("vendorId", vendorId);
    }
  }, [vendorId, form]);

  const mutation = useMutation({
    mutationFn: async (data: DocumentFormData) => {
      if (!auth.currentUser) throw new Error("You must be logged in");
      if (!data.file) throw new Error("No file selected");

      setIsUploading(true);
      try {
        // Get the file extension
        const fileExt = data.file.name.split('.').pop()?.toLowerCase() || '';
        const fileSize = data.file.size;
        const fileName = data.file.name;
        
        // If a vendor was selected, get its name for denormalizing
        let vendorName: string | undefined;
        if (data.vendorId) {
          const vendor = vendors.find((v: Vendor) => v.id === data.vendorId);
          vendorName = vendor?.companyName;
        }

        // Create document data
        const documentData: Partial<Document> = {
          documentName: data.documentName,
          category: data.category,
          description: data.description || "",
          vendorId: data.vendorId,
          vendorName: vendorName || "",
          fileName: fileName,
          fileType: fileExt,
          fileSize: fileSize,
          userId: auth.currentUser.uid,
        };

        // Create document and upload file
        return await DocumentOperations.createDocument(documentData, data.file);
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      form.reset();
      // Invalidate multiple queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      if (form.getValues("vendorId")) {
        queryClient.invalidateQueries({ queryKey: ["vendorDocuments", form.getValues("vendorId")] });
      }
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: DocumentFormData) => {
    await mutation.mutateAsync(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="documentName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter document name" {...field} />
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
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="license">License</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vendorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Associated Vendor (optional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingVendors ? (
                    <SelectItem value="loading">Loading vendors...</SelectItem>
                  ) : vendors.length === 0 ? (
                    <SelectItem value="none_available">No vendors available</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="none_selected">None</SelectItem>
                      {vendors.map((vendor: Vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id || `vendor_${Date.now()}`}>
                          {vendor.companyName}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Link this document to a specific vendor for better organization
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter document description" 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="file"
          render={({ field: { onChange, value, ...field } }) => (
            <FormItem>
              <FormLabel>Document File</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onChange(file);
                      
                      // Auto-fill document name if it's empty
                      const currentName = form.getValues("documentName");
                      if (!currentName) {
                        const fileName = file.name.split('.')[0]; // Remove extension
                        form.setValue("documentName", fileName);
                      }
                    }
                  }}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Supported formats: PDF, Word, Excel, and images
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-gradient-to-br from-primary/90 via-primary-900 to-black hover:from-primary/80 hover:via-primary-800 hover:to-primary-900"
          disabled={isUploading || mutation.isPending}
        >
          {(isUploading || mutation.isPending) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              Upload Document
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

export default UploadDocumentForm;