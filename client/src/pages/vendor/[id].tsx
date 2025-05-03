
import React, { useState } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Edit, 
  Trash2, 
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { VendorForm } from '@/components/forms/VendorForm';
import { VendorOperations } from '@/lib/firestore';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const VendorDetailPage = () => {
  const { id } = useParams();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [location, navigate] = useLocation();

  const { 
    data: vendor, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['vendor', id],
    queryFn: async () => {
      try {
        if (!id) throw new Error('Vendor ID is required');
        return await VendorOperations.getVendor(id);
      } catch (err) {
        console.error('Error fetching vendor:', err);
        throw err;
      }
    },
    retry: 1,
    enabled: !!id,
    onError: (err) => {
      toast.error(`Failed to load vendor: ${err.message || 'Unknown error'}`);
    }
  });

  const handleDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      await VendorOperations.deleteVendor(id);
      toast.success('Vendor deleted successfully');
      navigate('/vendors');
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete vendor');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRetry = () => {
    refetch();
  };

  return (
    <>
      <Helmet>
        <title>{vendor?.name || 'Vendor Detail'} | ContractorPro</title>
      </Helmet>

      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/vendors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Vendors
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <h3 className="text-lg font-medium">Loading vendor details...</h3>
          <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <AlertCircle className="h-8 w-8 text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">Error loading vendor</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <Button onClick={handleRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      ) : vendor ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold tracking-tight">{vendor.name}</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Vendor</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete {vendor.name}? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {}}>Cancel</Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Vendor Info Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Vendor Information
                </CardTitle>
                <CardDescription>Detailed information about this vendor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Industry</h3>
                    <p className="text-base">{vendor.industry || 'N/A'}</p>
                  </div>
                  
                  {vendor.description && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                      <p className="text-base">{vendor.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {vendor.contactName && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Contact Person</h3>
                        <p className="text-base">{vendor.contactName}</p>
                      </div>
                    )}
                    
                    {vendor.email && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Mail className="h-4 w-4" /> Email
                        </h3>
                        <p className="text-base">
                          <a href={`mailto:${vendor.email}`} className="text-primary hover:underline">
                            {vendor.email}
                          </a>
                        </p>
                      </div>
                    )}
                    
                    {vendor.phone && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Phone className="h-4 w-4" /> Phone
                        </h3>
                        <p className="text-base">
                          <a href={`tel:${vendor.phone}`} className="text-primary hover:underline">
                            {vendor.phone}
                          </a>
                        </p>
                      </div>
                    )}
                    
                    {vendor.website && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Globe className="h-4 w-4" /> Website
                        </h3>
                        <p className="text-base">
                          <a 
                            href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {vendor.website}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {(vendor.address || vendor.city || vendor.state || vendor.zipCode || vendor.country) && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> Address
                      </h3>
                      <p className="text-base">
                        {vendor.address && `${vendor.address}, `}
                        {vendor.city && `${vendor.city}, `}
                        {vendor.state && `${vendor.state} `}
                        {vendor.zipCode && `${vendor.zipCode}, `}
                        {vendor.country && vendor.country}
                      </p>
                    </div>
                  )}
                  
                  {vendor.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                      <p className="text-base whitespace-pre-line">{vendor.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Approval Status</h3>
                    <div className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      vendor.approvalStatus === 'Approved' 
                        ? 'bg-green-100 text-green-800' 
                        : vendor.approvalStatus === 'Pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {vendor.approvalStatus || 'Not Set'}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Added On</h3>
                    <p className="text-base">
                      {vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  
                  {vendor.updatedAt && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                      <p className="text-base">
                        {new Date(vendor.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Vendor Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Edit Vendor</DialogTitle>
                <DialogDescription>
                  Update the information for {vendor.name}
                </DialogDescription>
              </DialogHeader>
              <VendorForm vendor={vendor} mode="edit" />
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Vendor not found or you do not have permission to view this vendor.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default VendorDetailPage;
