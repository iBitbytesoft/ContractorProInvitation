import { useEffect, useState } from "react";
import { useLocation, useRoute, useRouter } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { db, acceptInvitation, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

export default function AcceptInvitation() {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [, params] = useRoute("/accept-invitation/:token");
  const token = params?.token;

  // Extract email from URL - handle both query params and token format
  const urlParts = location.split("?");
  const queryParams = new URLSearchParams(urlParts[1] || "");

  // Try to get email from query params
  let emailFromQuery = queryParams.get("email");

  // If not in query params, try to extract from token (format: mock-token-timestamp-email)
  if (!emailFromQuery && token && token.includes("-")) {
    const tokenParts = token.split("-");
    if (tokenParts.length >= 4) {
      // The email might be encoded in the token after the timestamp
      const possibleEmail = decodeURIComponent(tokenParts.slice(3).join("-"));
      if (possibleEmail.includes("@")) {
        emailFromQuery = possibleEmail;
      }
    }
  }

  const roleFromQuery = queryParams.get("role");

  console.log("Extracted email from URL:", emailFromQuery);
  console.log("Full URL:", location);
  console.log("Token:", token);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  // Initialize email state with the extracted email
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true); // Default to signup for new users

  // Update email whenever emailFromQuery changes
  useEffect(() => {
    if (emailFromQuery) {
      console.log("Setting email from query:", emailFromQuery);
      setEmail(emailFromQuery);
    }
  }, [emailFromQuery]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [status, setStatus] = useState<
    "loading" | "accepted" | "invalid" | "error"
  >("loading");

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    // Verify the invitation token
    const verifyInvitation = async () => {
      try {
        // For mock tokens, handle locally
        if (token && token.startsWith("mock-token-")) {
          console.log("Verifying mock invitation token:", token);

          // Extract email from token if present
          let emailFromToken = "test@example.com";

          // Try to extract email from the token (format: mock-token-timestamp-email)
          if (token.includes("-")) {
            const tokenParts = token.split("-");
            if (tokenParts.length >= 4) {
              const possibleEmail = decodeURIComponent(
                tokenParts.slice(3).join("-")
              );
              if (possibleEmail.includes("@")) {
                emailFromToken = possibleEmail;
              }
            }
          }

          // Check localStorage for this invitation
          try {
            const storedInvitations =
              localStorage.getItem("pendingInvitations");
            if (storedInvitations) {
              const invitations = JSON.parse(storedInvitations);
              const matchingInvitation = invitations.find(
                (inv) => inv.token === token
              );

              if (matchingInvitation) {
                console.log(
                  "Found matching invitation in localStorage:",
                  matchingInvitation
                );
                setInvitation({
                  email: matchingInvitation.invitedEmail,
                  role: matchingInvitation.invitedRole,
                  message: matchingInvitation.invitedMessage || "",
                });
                setEmail(matchingInvitation.invitedEmail);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            console.error("Error checking localStorage for invitation:", e);
          }

          // If not found in localStorage, use email from query or token
          const mockInvitation = {
            email: emailFromQuery || emailFromToken,
            role: roleFromQuery || "user",
            message: "Please join our team!",
          };

          console.log("Using mock invitation:", mockInvitation);
          setInvitation(mockInvitation);
          setEmail(mockInvitation.email);
          setLoading(false);
          return;
        }

        // For real tokens, verify with the server
        const response = await fetch(`/api/invitations/${token}`);

        if (!response.ok) {
          let errorMessage = "Failed to verify invitation";
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If we can't parse the JSON, just use the default error message
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Invitation verified:", data);

        if (!data.valid) {
          throw new Error(data.message || "Invalid invitation");
        }

        // Set the email from the verified invitation
        setInvitation({
          email: data.email,
          role: data.role,
          invitedBy: data.invitedBy,
          inviterEmail: data.inviterEmail,
          message: data.message,
        });
        setEmail(data.email);
        setLoading(false);
      } catch (error) {
        console.error("Error verifying invitation:", error);
        setError(
          error instanceof Error ? error.message : "Failed to verify invitation"
        );
        setLoading(false);
      }
    };

    verifyInvitation();
  }, [token, emailFromQuery, roleFromQuery]);

  useEffect(() => {
    const checkInvitationStatus = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = location.split("/").pop();

      if (!token) {
        setStatus("invalid");
        return;
      }

      try {
        // Check both collections for the invitation status
        const userInvitationsQuery = query(
          collection(db, "user_invitations"),
          where("token", "==", token)
        );
        const userInvitationsSnapshot = await getDocs(userInvitationsQuery);

        const invitationsQuery = query(
          collection(db, "invitations"),
          where("token", "==", token)
        );
        const invitationsSnapshot = await getDocs(invitationsQuery);

        // Check if invitation exists in either collection
        if (userInvitationsSnapshot.empty && invitationsSnapshot.empty) {
          setStatus("invalid");
          return;
        }

        // Check if invitation is already accepted in user_invitations
        if (!userInvitationsSnapshot.empty) {
          const userInvitation = userInvitationsSnapshot.docs[0].data();
          if (userInvitation.status === "accepted") {
            setStatus("accepted");
            return;
          }
        }

        // Check if invitation is already accepted in invitations
        if (!invitationsSnapshot.empty) {
          const invitation = invitationsSnapshot.docs[0].data();
          if (invitation.status === "accepted") {
            setStatus("accepted");
            return;
          }
        }

        setStatus("loading");
      } catch (error) {
        console.error("Error checking invitation status:", error);
        setStatus("error");
      }
    };

    checkInvitationStatus();
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Check if user is already signed in
      if (auth.currentUser) {
        // If user is signed in but with a different email, sign them out
        if (auth.currentUser.email !== email) {
          await auth.signOut();
        }
      }

      // Sign up or sign in based on the mode
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      // For mock tokens, update the invitation in localStorage
      if (token && token.startsWith("mock-token-")) {
        try {
          const storedInvitations = localStorage.getItem("pendingInvitations");
          if (storedInvitations) {
            const invitations = JSON.parse(storedInvitations);
            const updatedInvitations = invitations.map((inv) => {
              if (inv.token === token) {
                return {
                  ...inv,
                  status: "accepted",
                  acceptedAt: new Date().toISOString(),
                };
              }
              return inv;
            });

            localStorage.setItem(
              "pendingInvitations",
              JSON.stringify(updatedInvitations)
            );
            console.log("Updated invitation status in localStorage");
          }
        } catch (e) {
          console.error("Error updating invitation in localStorage:", e);
        }

        // Skip server call for mock tokens
        setSuccess(true);
        toast.success("Invitation accepted successfully!");

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          setLocation("/dashboard");
        }, 2000);

        // return;
      }

      // For real tokens, update both collections in Firestore
      const updateData = {
        status: "accepted",
        acceptedAt: new Date().toISOString(),
        acceptedBy: auth.currentUser?.uid,
        acceptedEmail: auth.currentUser?.email,
      };

      // Update user_invitations collection
      const userInvitationsQuery = query(
        collection(db, "user_invitations"),
        where("token", "==", token)
      );
      const userInvitationsSnapshot = await getDocs(userInvitationsQuery);

      if (!userInvitationsSnapshot.empty) {
        const docRef = userInvitationsSnapshot.docs[0].ref;
        await updateDoc(docRef, updateData);
        console.log("Updated user_invitations collection");
      } else {
        console.log("No matching document found in user_invitations");
      }

      // Update invitations collection
      const invitationsQuery = query(
        collection(db, "invitations"),
        where("token", "==", token)
      );
      const invitationsSnapshot = await getDocs(invitationsQuery);

      if (!invitationsSnapshot.empty) {
        const docRef = invitationsSnapshot.docs[0].ref;
        await updateDoc(docRef, updateData);
        console.log("Updated invitations collection");
      } else {
        console.log("No matching document found in invitations");
      }

      // Call the acceptInvitation helper function if it exists
      if (typeof acceptInvitation === "function") {
        try {
          await acceptInvitation(token);
          console.log("Called acceptInvitation helper function");
        } catch (error) {
          console.error("Error in acceptInvitation helper:", error);
        }
      }

      // For real tokens, make the API call
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
        body: JSON.stringify({
          uid: auth.currentUser?.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to accept invitation");
      }

      setSuccess(true);
      toast.success("Invitation accepted successfully!");

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to accept invitation"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle className="mt-4">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => setLocation("/login")}>
              Return to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle className="mt-4">Invitation Accepted</CardTitle>
            <CardDescription>
              You have successfully joined the team. Redirecting to dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to join {invitation?.companyName || "a company"}{" "}
            as a {invitation?.role || "team member"}.
            {invitation?.message && (
              <div className="mt-2 rounded-md bg-muted p-3 text-sm">
                "{invitation.message}"
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-gradient-to-br from-primary/90 via-primary-900 to-black hover:from-primary/80 hover:via-primary-800 hover:to-primary-900"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isSignUp ? (
                  "Sign Up & Accept"
                ) : (
                  "Sign In & Accept"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={isProcessing}
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
