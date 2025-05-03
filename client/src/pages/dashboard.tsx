import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import {
  Building2,
  Hammer,
  ClipboardCheck,
  Users,
  FileText,
  PlusCircle,
  Wrench,
  TrendingUp,
  CircleUserRound,
  Plus,
  Copy,
  Clock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchInvitations } from "@/lib/firebase";

import CountCard from "@/components/dashboard/CountCard";
import RecentItemsList from "@/components/dashboard/RecentItemsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AssetOperations,
  VendorOperations,
  DocumentOperations,
  getCurrentUserId,
} from "@/lib/firestore";
import { EnhancedAssetForm } from "@/components/forms/EnhancedAssetForm";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { toast } from "sonner";
import { DialogDescription } from "@radix-ui/react-dialog";
import { UserInvitationForm } from "@/components/forms/UserInvitationForm";
import { Input } from "@/components/ui/input";

// Define types for our data
interface Asset {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  type?: string; // Added type property
  status?: string; // Added status property
}

interface Vendor {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface Document {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  status: string;
}

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

const Dashboard = () => {
  const [user, loading] = useAuthState(auth);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
    const [showInviteForm, setShowInviteForm] = useState(false);
      const [pendingInvitations, setPendingInvitations] = useState([]);
        const [update, setUpdate] = useState({});
      const [showInvitationDialog, setShowInvitationDialog] = useState(false);
        const [Loading, setLoading] = useState(false);
        const [invitationLink, setInvitationLink] = useState("");
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
  const [invitationUsers, setInvitationUsers] = useState<Sender_Invitation[]>(
    []
  );
  const {
    data: invitations = [],
    isLoading: invitationsLoading,
    refetch: refetchInvitations,
  } = useQuery<Invitation[]>({
    queryKey: ["invitations"],
    queryFn: fetchInvitations,
  });

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
  }, []);
  // Fetch asset count
  const {
    data: assetCount = 0,
    isLoading: isLoadingAssetCount,
    refetch: refetchAssetCount,
  } = useQuery({
    queryKey: ["assetCount"],
    queryFn: AssetOperations.getAssetCount,
    enabled: !!user,
    retry: 1,
  });

  // Fetch vendor count
  const { data: vendorCount = 0, isLoading: isLoadingVendorCount } = useQuery({
    queryKey: ["vendorCount"],
    queryFn: VendorOperations.getVendorCount,
    enabled: !!user,
    retry: 1,
  });

  // Fetch document count
  const { data: documentCount = 0, isLoading: isLoadingDocumentCount } =
    useQuery({
      queryKey: ["documentCount"],
      queryFn: DocumentOperations.getDocumentCount,
      enabled: !!user,
      retry: 1,
    });

  // Fetch recent assets
  const { data: recentAssets = [], isLoading: isLoadingRecentAssets } =
    useQuery({
      queryKey: ["recentAssets"],
      queryFn: () => AssetOperations.getRecentAssets(5),
      enabled: !!user,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    });

  // Fetch recent vendors
  const { data: recentVendors = [], isLoading: isLoadingRecentVendors } =
    useQuery({
      queryKey: ["recentVendors"],
      queryFn: () => VendorOperations.getRecentVendors(5),
      enabled: !!user,
      retry: 1,
    });

  // Fetch recent documents
  const { data: recentDocuments = [], isLoading: isLoadingRecentDocuments } =
    useQuery({
      queryKey: ["recentDocuments"],
      queryFn: () => DocumentOperations.getRecentDocuments(5),
      enabled: !!user,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    });

  const handleAssetAdded = () => {
    setIsAddAssetOpen(false);
    refetchAssetCount();
  };
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

      const copyToClipboard = () => {
        navigator.clipboard.writeText(invitationLink);
        toast.success("Invitation link copied to clipboard");
      };

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


  if (loading || invitationsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard | ContractorPro</title>
      </Helmet>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back to your ContractorPro dashboard.
          </p>
        </div>
        <Button onClick={() => setIsAddAssetOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Asset
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <CountCard
          title="Total Assets"
          count={assetCount}
          isLoading={isLoadingAssetCount}
          icon={<Wrench className="h-8 w-8 text-primary" />}
        />
        <CountCard
          title="Vendors & Suppliers"
          count={vendorCount}
          isLoading={isLoadingVendorCount}
          icon={<Building2 className="h-8 w-8 text-primary" />}
        />
        <CountCard
          title="Documents"
          count={documentCount}
          isLoading={isLoadingDocumentCount}
          icon={<FileText className="h-8 w-8 text-primary" />}
        />
        <CountCard
          title="Tasks Due"
          count={0}
          isLoading={false}
          icon={<ClipboardCheck className="h-8 w-8 text-primary" />}
        />
        <CountCard
          title="Team Members"
          count={invitationUsers?.length || 0}
          isLoading={false}
          // icon={<ClipboardCheck className="h-8 w-8 text-primary" />}
          icon={<CircleUserRound className="h-8 w-8 text-primary" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <RecentItemsList
          title="Recent Assets"
          description="Your recently added equipment and tools"
          items={recentAssets.map((asset) => ({
            id: asset.id,
            name: asset.name,
            createdAt: new Date(asset.createdAt),
            type: asset.type,
            // Only Asset has status, so no description needed for Item type
          }))}
          isLoading={isLoadingRecentAssets}
          emptyMessage="No assets found. Add your first asset to get started."
          addItemLink="/assets/add"
          viewAllLink="/assets"
          addItemText="Add Asset"
        />

        <RecentItemsList
          title="Recent Vendors"
          description="Your recently added vendors and suppliers"
          items={recentVendors.map((vendor) => ({
            id: vendor.id,
            name: vendor.name,
            createdAt: new Date(vendor.createdAt),
            type: undefined, // Vendor does not have type
          }))}
          isLoading={isLoadingRecentVendors}
          emptyMessage="No vendors found. Add your first vendor to get started."
          addItemLink="/vendors/add"
          viewAllLink="/vendors"
          addItemText="Add Vendor"
        />

        <RecentItemsList
          title="Recent Documents"
          description="Your recently uploaded documents and files"
          items={recentDocuments.map((document) => ({
            id: document.id,
            name: document.name,
            createdAt: new Date(document.createdAt),
            type: undefined, // Document does not have type
          }))}
          isLoading={isLoadingRecentDocuments}
          emptyMessage="No documents found. Upload your first document to get started."
          addItemLink="/documents/add"
          viewAllLink="/documents"
          addItemText="Upload Document"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Maintenance Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-muted-foreground mb-4">
                Maintenance tracking coming soon
              </p>
              <Button variant="outline" disabled>
                <TrendingUp className="mr-2 h-4 w-4" /> Enable Maintenance
                Tracking
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Team Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-muted-foreground mb-4">
                Team activity tracking coming soon
              </p>
              <Button asChild variant="outline">
                <Link href="/team">
                  <Users className="mr-2 h-4 w-4" /> Manage Team
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Team Invitations Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center w-full">
              {invitationUsers.length === 0 ? (
                <p className="text-muted-foreground mb-4">
                  No team invitations sent yet.
                </p>
              ) : (
                <ul className="w-full space-y-2">
                  {invitationUsers.map((invitation) => (
                    <li
                      key={invitation.id}
                      className="flex items-center justify-between border rounded px-3 py-2"
                    >
                      <div>
                        <span className="font-medium">
                          {invitation.invitedEmail}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({invitation.invitedRole})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {invitation.status === "pending" && (
                          <>
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                              Pending
                            </span>
                          </>
                        )}
                        {invitation.status === "accepted" && (
                          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                            Accepted
                          </span>
                        )}
                        {invitation.status === "rejected" && (
                          <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                            Rejected
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Invitation sending form */}
            {/* <form
  onSubmit={async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const emailInput = form.elements.namedItem("inviteEmail") as HTMLInputElement;
    const email = emailInput.value.trim();
    if (!email) return;

    try {
      // Check if invitation already exists
      const userEmail = auth.currentUser?.email;
      if (!userEmail) return;

      // Query Firestore to check if the invitation is already pending for the user
      const q = query(
        collection(db, "user_invitations"),
        where("invitedEmail", "==", email),
        where("status", "==", "pending"),
        where("senderEmail", "==", userEmail)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        toast.error("Invitation already sent to this email.");
        return;
      }

      // Send the invitation to Firebase
      const invitationData = {
        senderEmail: userEmail,
        invitedEmail: email,
        invitedRole: "user",  // You can customize this to handle roles
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "user_invitations"), invitationData);
      
      // Optionally, send an email to the invited user with a link
      await fetch("http://localhost:5000/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await auth.currentUser?.getIdToken()}`, // Add the Authorization header
        },
        body: JSON.stringify({
          to: email,
          subject: `You have been invited to join our team`,
          text: `You have been invited to join our team. Please click the following link to accept the invitation.`,
        }),
      });
      

      toast.success("Invitation sent successfully!");
      emailInput.value = "";  // Clear the email input field

      // Refetch the invitations or update state as needed
      refetchInvitations();
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation.");
    } finally {
    }
  }}
  className="flex gap-2 mb-4"
>
  <input
    type="email"
    name="inviteEmail"
    placeholder="Enter email to invite"
    className="border rounded px-2 py-1 flex-1"
    required
  />
  <Button type="submit" variant="default" disabled={loading}>
    {loading ? "Sending..." : "Send Invite"}
  </Button>
</form> */}
<Button
      onClick={() => setShowInviteForm(true)}
      className="bg-gradient-to-br from-primary/90 via-primary-900 to-black hover:from-primary/80 hover:via-primary-800 hover:to-primary-900 transition-all"
    >
      <Plus className="mr-2 h-4 w-4" />
      Invite Team Member
    </Button>
            {/* List of invitations */}
            <ul className="space-y-2">
              {invitations.map((invitation: Invitation) => (
                <li key={invitation.id} className="flex items-center gap-2">
                  <span>{invitation.email}</span>
                  {invitation.status === "pending" ? (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      Pending
                    </span>
                  ) : invitation.status === "accepted" ? (
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      Accepted
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
          </DialogHeader>
          <EnhancedAssetForm
            onSuccess={handleAssetAdded}
            onCancel={() => setIsAddAssetOpen(false)}
          />
        </DialogContent>
      </Dialog>
      {showInviteForm && <InviteFormDialog />}
      <InvitationLinkDialog />
    </>
  );
};

export default Dashboard;
