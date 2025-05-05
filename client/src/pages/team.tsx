import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserInvitationForm } from "@/components/forms/UserInvitationForm";
import { Plus, Search, Users, Copy, CheckCircle, Clock } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { getInitials } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { XCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getCurrentUserId } from "@/lib/firestore";
import { useAuth } from "@/lib/auth";
interface Sender_Invitation {
  id: string;
  createdAt: string;
  invitedEmail: string;
  invitedMessage: string;
  invitedRole: string;
  senderEmail: string;
  status: "pending" | "accepted" | "rejected";
  token: string;
}

export default function Team() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [invitationLink, setInvitationLink] = useState("");
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [update, setUpdate] = useState({});
  // Store local pending invitations that we've added
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [invitationUsers, setInvitationUsers] = useState<Sender_Invitation[]>(
    []
  );

  // Load pending invitations from localStorage on component mount
  useEffect(() => {
    try {
      const storedInvitations =
        localStorage.getItem("pendingInvitations") || "[]";
      const parsedInvitations = JSON.parse(storedInvitations);

      // Clear invalid invitations from localStorage
      const validInvitations = parsedInvitations.filter(
        (inv) => inv && inv.invitedEmail
      );

      if (validInvitations.length !== parsedInvitations.length) {
        console.warn("Removed invalid invitations from localStorage");
        localStorage.setItem(
          "pendingInvitations",
          JSON.stringify(validInvitations)
        );
      }

      if (validInvitations.length > 0) {
        console.log("Loaded invitations from localStorage:", validInvitations);
        setPendingInvitations(validInvitations);
      }
    } catch (error) {
      console.error("Error loading invitations from localStorage:", error);
      // Clear potentially corrupted data
      localStorage.removeItem("pendingInvitations");
    }
  }, []);

  useEffect(() => {
    const getInvitations = async () => {
      if (!getCurrentUserId()) return;
      // Replace with the actual email or user identifier you want to filter by
      const userEmail = auth.currentUser?.email;

      if (!userEmail) return;

      const q = query(
        collection(db, "user_invitations"),
        where("senderEmail", "==", userEmail)
      );

      const querySnapshot = await getDocs(q);
      // console.log(querySnapshot.docs);
      const invitations = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInvitationUsers(invitations as Sender_Invitation[]);
      // console.log("User invitations:", invitations);
      // You can now set this to state if you want to display it
    };
    getInvitations();
  }, [update]);
  // Fetch team members from the server
  const {
    data: serverTeam,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const response = await fetch("/api/team", {
        headers: {
          Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch team members");
      }

      return response.json();
    },
    // Configure refetching to ensure we have up-to-date data
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  // Combine server team data with pending invitations
  const team = useMemo(() => {
    if (!invitationUsers || !serverTeam) {
      return pendingInvitations.length > 0 ? pendingInvitations : [];
    }

    // Combine server data with pending invitations
    const combinedTeam = [...serverTeam, ...invitationUsers];

    // Add any pending invitations that aren't already in the server data
    invitationUsers.forEach((invitation) => {
      // Skip invalid invitations
      if (!invitation || !invitation.invitedEmail) {
        console.warn("Skipping invalid invitation:", invitation);
        return;
      }

      // Check if this invitation is already in the server data
      const exists = combinedTeam.some(
        (member) =>
          member.email === invitation.invitedEmail &&
          member.status === "pending"
      );

      if (!exists) {
        combinedTeam.push({
          id: invitation.id || `pending-${Date.now()}`,
          email: invitation.invitedEmail,
          displayName: invitation.invitedEmail.split("@")[0],
          role: invitation.invitedRole || "user",
          status: invitation.status || "pending",
          addedAt: invitation.createdAt || new Date().toISOString(),
          isOwner: false,
        });
      }
    });

    return combinedTeam;
  }, [serverTeam, pendingInvitations, invitationUsers]);

  const filteredTeam = team?.filter(
    (member) =>
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">Admin</Badge>;
      case "manager":
        return (
          <Badge variant="default" className="bg-blue-600">
            Manager
          </Badge>
        );
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };
  const handleInvitationSuccess = async (data) => {
    console.log("Invitation success handler received:", data);

    if (data && data.invitationLink) {
      setInvitationLink(data.invitationLink);
      setShowInviteForm(false);
      setLoading(true);
      if (data.invitedEmail) {
        console.log("Adding pending member with email:", data.invitedEmail);

        // Check if invitation already exists in Firestore with pending status
        try {
          const q = query(
            collection(db, "user_invitations"),
            where("invitedEmail", "==", data.invitedEmail),
            where("status", "==", "pending"),
            where("senderEmail", "==", user?.email)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            toast.error("Already requested to this user");
            setShowInviteForm(false);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error checking existing invitations:", error);
          toast.error("Failed to check existing invitations");
          setShowInviteForm(false);
          return;
        }

        // Create a storage object for the pending invitation
        const storageMember = {
          id: getCurrentUserId(),
          invitedEmail: data.invitedEmail,
          senderEmail: user?.email,
          invitedRole: data.invitedRole || "user",
          invitedMessage: data.invitedMessage || "",
          token: data.token,
          status: "pending",
          createdAt: data.createdAt || new Date().toISOString(),
        };
        console.log({ storageMember });
        // Store invitation in Firebase Firestore
        try {
          await addDoc(collection(db, "user_invitations"), storageMember);
          console.log("Invitation stored in Firestore");
        } catch (error) {
          setLoading(false);
          console.error("Failed to store invitation in Firestore:", error);
          toast.error("Failed to store invitation in Firestore");
        }

        // Add to our local pending invitations state
        setPendingInvitations((prev) => {
          const updatedInvitations = [...prev, storageMember];
          // Store in localStorage to persist between refreshes
          localStorage.setItem(
            "pendingInvitations",
            JSON.stringify(updatedInvitations)
          );
          return updatedInvitations;
        });

        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${await auth.currentUser?.getIdToken()}`
            },
            body: JSON.stringify({
              to: data.invitedEmail,
              subject: `You have been invited as a ${data.invitedRole}`,
              text: `You have received an invitation from ${data.invitedEmail} \n ${data.invitationLink}`,
              inviterEmail: data.invitedEmail,
              invitationLink: data.invitationLink,
              role: data.invitedRole,
            }),
          });

          setShowInviteForm(false);
          setLoading(false);
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to send email");
          }

          const result = await response.text();
          console.log("Added to pending invitations:", storageMember);

          toast.success("Invitation sent successfully");
        } catch (error) {
          setLoading(false);
          console.error("Failed to send invitation email:", error);
          toast.error("Failed to send invitation email");
        }
      }
    } else {
      // toast.success("Team member invited successfully");
    }
    setLoading(false);
    setShowInviteForm(false);
    setShowInvitationDialog(true);
    setUpdate({});
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitationLink);
    toast.success("Invitation link copied to clipboard");
  };

  const InviteButton = () => (
    <Button
      onClick={() => setShowInviteForm(true)}
      className="bg-gradient-to-br from-primary/90 via-primary-900 to-black hover:from-primary/80 hover:via-primary-800 hover:to-primary-900 transition-all"
    >
      <Plus className="mr-2 h-4 w-4" />
      Invite Team Member
    </Button>
  );

  // Dialog for showing invitation form
  const InviteFormDialog = () => (
    <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your team. They'll receive a link to
            accept the invitation.
          </DialogDescription>
        </DialogHeader>
        <UserInvitationForm onSuccess={handleInvitationSuccess} />
      </DialogContent>
    </Dialog>
  );

  const LoadingDialog = () => (
    <Dialog open={loading}>
      <DialogContent className="flex flex-col items-center justify-center">
        <DialogHeader>
          <DialogTitle>Processing Invitation</DialogTitle>
          <DialogDescription>Please wait while we process your invitation request.</DialogDescription>
        </DialogHeader>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-center text-lg font-medium">
          Processing invitation...
        </p>
      </DialogContent>
    </Dialog>
  );
  // Dialog for showing invitation link
  const InvitationLinkDialog = () => (
    <Dialog open={showInvitationDialog} onOpenChange={setShowInvitationDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitation Sent</DialogTitle>
          <DialogDescription>
            Share this link with your team member to join your company.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <Input value={invitationLink} readOnly className="flex-1" />
          <Button size="icon" variant="outline" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="bg-amber-50 p-3 rounded-md text-amber-800 text-sm flex items-start space-x-2">
          <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            This invitation link will expire in 7 days. Send a new invitation if
            it expires.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Team</h1>
        <InviteButton />
      </div>

      <div className="flex max-w-sm items-center space-x-2">
        <Input
          placeholder="Search team members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="ghost" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        // Loading state
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        // Error state
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-red-100 p-6 mb-6">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Failed to Load Team</h2>
          <p className="text-gray-500 mb-8 max-w-md">
            There was an error loading your team members. Please try again
            later.
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      ) : team?.length === 0 ? (
        // Empty state
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-gray-100 p-6 mb-6">
            <Users className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No Team Members Yet</h2>
          <p className="text-gray-500 mb-8 max-w-md">
            Start building your team by inviting members. They'll be able to
            help manage assets, vendors, and documents.
          </p>
          <InviteButton />
          <div className="mt-12 bg-blue-50 rounded-lg p-4 max-w-md">
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Pro Tip:</span> You can assign
              different roles to team members to control their access levels and
              responsibilities.
            </p>
          </div>
        </div>
      ) : (
        // Team members list
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeam?.map((member) => {
            console.log(member.email, member.status);
            return (
              <Card
                key={member.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.photoURL || undefined} />
                      <AvatarFallback>
                        {getInitials(member.displayName || member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">
                          {member.displayName || member.email.split("@")[0]}
                        </h3>
                        {member.isOwner && (
                          <Badge variant="secondary" className="ml-2">
                            Owner
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {member.email}
                      </p>
                      <div className="flex items-center space-x-2">
                        {getRoleBadge(member.role)}
                        {member.status === "pending" ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-200"
                          >
                            Pending
                          </Badge>
                        ) : member.status === "accepted" ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Accepted
                          </Badge>
                        ) : (
                          member.addedAt && (
                            <span className="text-xs text-muted-foreground">
                              Joined{" "}
                              {formatDistanceToNow(new Date(member.addedAt), {
                                addSuffix: true,
                              })}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {loading && <LoadingDialog />}
          {filteredTeam?.length === 0 && team.length > 0 && (
            <div className="col-span-3 text-center py-10">
              <p className="text-muted-foreground">No team members found</p>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      {showInviteForm && <InviteFormDialog />}
      <InvitationLinkDialog />
    </div>
  );
}

// Add these imports at the top of the file
