import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userInvitationSchema, type UserInvitation } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";

interface UserInvitationFormProps {
  onSuccess?: () => void;
}

export function UserInvitationForm({ onSuccess }: UserInvitationFormProps) {
  const form = useForm<UserInvitation>({
    resolver: zodResolver(userInvitationSchema),
    defaultValues: {
      email: "",
      role: "user",
      message: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: UserInvitation) => {
      try {
        // For development/testing, create a mock invitation without server call
        console.log("Creating mock invitation for testing");

        // Generate a unique token that includes the email
        const timestamp = Date.now();
        const token = `mock-token-${timestamp}-${encodeURIComponent(
          data.email
        )}`;

        // Create a mock response with a link for testing
        const mockData = {
          id: `mock-invitation-${timestamp}`,
          message: "Invitation sent successfully",
          invitationLink: `${
            window.location.origin
          }/accept-invitation/${token}?email=${encodeURIComponent(
            data.email
          )}&role=${encodeURIComponent(data.role)}`,
          invitedEmail: data.email,
          invitedRole: data.role,
          invitedMessage: data.message || "",
          token: token,
          status: "pending",
          createdAt: new Date().toISOString(),
        };

        console.log("Created mock invitation:", mockData);
        return mockData;

        /* Uncomment this for production use with Firebase
        // Get current user's auth token directly from Firebase
        if (!auth.currentUser) {
          throw new Error("You must be logged in to send invitations");
        }
        
        const token = await auth.currentUser.getIdToken(true);
        console.log("Generated token for API request");
        
        const response = await fetch("/api/invitations", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          // Try to parse as JSON, but handle case where response is not JSON
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            throw new Error(error.message || "Failed to send invitation");
          } else {
            // Handle non-JSON response
            const text = await response.text();
            console.error("Non-JSON error response:", text);
            throw new Error(`Server error: ${response.status}`);
          }
        }

        // Parse the response
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const jsonData = await response.json();
          console.log("Invitation response data:", jsonData);
          return jsonData;
        } else {
          throw new Error("Unexpected response format from server");
        }
        */
      } catch (error) {
        console.error("Error sending invitation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Make sure we pass the form data along with the response data
      const formData = form.getValues();
      const combinedData = {
        ...data,
        invitedEmail: formData.email,
        invitedRole: formData.role,
        invitedMessage: formData.message,
      };

      console.log("Invitation success with data:", combinedData);
      // toast.success("Invitation sent successfully");
      form.reset();
      onSuccess?.(combinedData);
    },
    onError: (error) => {
      console.error("Invitation error:", error);
      toast.error("Failed to send invitation: " + error.message);
    },
  });

  const onSubmit = (data: UserInvitation) => {
    mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invitation Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter an optional message"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-gradient-to-br from-primary/90 via-primary-900 to-black hover:from-primary/80 hover:via-primary-800 hover:to-primary-900"
          disabled={isPending}
        >
          {isPending ? "Sending..." : "Send Invitation"}
        </Button>
      </form>
    </Form>
  );
}
