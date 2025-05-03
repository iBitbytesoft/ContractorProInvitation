
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { firestoreService, auth, storage } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

// Document schema from shared schema or defined here
const documentSchema = z.object({
  documentName: z.string().min(1, "Document name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  fileURL: z.string().min(1, "Document file is required"),
  userId: z.string(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

export default function DocumentForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  
  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      documentName: "",
      category: "",
      description: "",
      fileURL: "",
      userId: auth.currentUser?.uid || "",
    },
  });
  
  // Upload document file
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `documents/${auth.currentUser?.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      form.setValue("fileURL", downloadUrl);
      toast({
        title: "File uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Save document to Firestore
  const saveMutation = useMutation({
    mutationFn: async (data: DocumentFormData) => {
      return firestoreService.createDocument(data);
    },
    onSuccess: () => {
      toast({
        title: "Document uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error("Failed to save document:", error);
      toast({
        title: "Failed to upload document",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: DocumentFormData) => {
    data.userId = auth.currentUser?.uid || "";
    saveMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="contracts">Contracts</SelectItem>
                  <SelectItem value="licenses">Licenses & Permits</SelectItem>
                  <SelectItem value="invoices">Invoices</SelectItem>
                  <SelectItem value="certificates">Certificates</SelectItem>
                  <SelectItem value="reports">Reports</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
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
          name="fileURL"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document File</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input 
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button
          type="submit"
          className="w-full bg-primary"
          disabled={saveMutation.isPending || isUploading}
        >
          {saveMutation.isPending || isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload Document"
          )}
        </Button>
      </form>
    </Form>
  );
}
