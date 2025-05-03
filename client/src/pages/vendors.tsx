import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  PlusCircle,
  Building2,
  Search,
  Loader2,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VendorOperations } from '@/lib/firestore';
import { toast } from 'sonner';
import VendorForm from '@/components/forms/VendorForm';
import VendorDetails from '@/components/VendorDetails';

// Define the Vendor interface to match the Firestore data structure
export interface Vendor {
  id: string;
  companyName: string;
  abn: string;
  industry: string;
  type: 'contractor' | 'supplier' | 'consultant';
  website?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  accountName?: string;
  bankName?: string;
  bsb?: string;
  bankAccount?: string;
  licenseNumber?: string;
  insuranceExpiry?: string;
  complianceStatus: 'compliant' | 'non-compliant' | 'pending';
  paymentTerms: string;
  rating: number;
  approvalStatus: 'Approved' | 'Pending' | 'Rejected';
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const VendorsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVendor, setActiveVendor] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddVendorDialogOpen, setIsAddVendorDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'view' | 'edit' | null>(null);

  // Handle opening/closing the actions menu
  const handleActionClick = (vendorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveVendor(prev => prev === vendorId ? null : vendorId);
  };

  // Handle vendor deletion
  const handleDeleteVendor = async (vendorId: string) => {
    if (window.confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      try {
        await VendorOperations.deleteVendor(vendorId);
        toast.success('Vendor deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['vendors'] });
        setActiveVendor(null);
      } catch (error) {
        console.error('Error deleting vendor:', error);
        toast.error('Failed to delete vendor');
      }
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setActiveVendor(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch all vendors
  const {
    data: vendors = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<Vendor[]>({
    queryKey: ['vendors'],
    queryFn: async () => {
      try {
        const data = await VendorOperations.getVendors();
        return data as Vendor[];
      } catch (err) {
        console.error('Error in query function:', err);
        throw err;
      }
    },
    retry: 2,
    retryDelay: 1000
  });

  // Filter vendors based on search query
  const filteredVendors = vendors.filter((vendor: Vendor) =>
    (vendor.companyName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (vendor.industry?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (vendor.contactEmail?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (vendor.contactName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredVendors.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentVendors = filteredVendors.slice(startIndex, endIndex);

  const handleViewVendor = (vendor: Vendor, viewMode: 'view' | 'edit', e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedVendor(vendor);
    setIsDialogOpen(true);
    setMode(viewMode);
  };

  const handleRetry = () => {
    refetch();
  };

  const handlePageSizeChange = (value: string) => {
    const newSize = parseInt(value);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  return (
    <>
      <Helmet>
        <title>Vendors & Suppliers | ContractorPro</title>
      </Helmet>

      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
            <p className="text-muted-foreground">Manage your vendors and suppliers</p>
          </div>
          <Button onClick={() => setIsAddVendorDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Vendor
          </Button>
        </div>

        <Card>
          <CardHeader className="py-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Vendor Management
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search vendors..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={pageSize.toString()}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select page size" />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} vendors per page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <h3 className="text-lg font-medium">Loading vendors...</h3>
                <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <AlertCircle className="h-8 w-8 text-destructive mb-4" />
                <h3 className="text-lg font-medium mb-2">Error loading vendors</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  {error instanceof Error ? error.message : 'An unexpected error occurred'}
                </p>
                <Button onClick={handleRetry} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Retry
                </Button>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No vendors found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "No vendors match your search criteria" : "You haven't added any vendors yet"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsAddVendorDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Vendor
                  </Button>
                )}
              </div>
            ) : (
              <div className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[20%]">Company Name</TableHead>
                      <TableHead className="w-[12%]">Industry</TableHead>
                      <TableHead className="w-[12%]">Contact Person</TableHead>
                      <TableHead className="w-[15%]">Email</TableHead>
                      <TableHead className="w-[12%]">Phone</TableHead>
                      <TableHead className="w-[12%]">Status</TableHead>
                      <TableHead className="w-[10%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentVendors.map((vendor: Vendor) => (
                      <TableRow
                        key={vendor.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setMode('view');
                          setIsDialogOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">{vendor.companyName}</TableCell>
                        <TableCell>{vendor.industry}</TableCell>
                        <TableCell>{vendor.contactName || '-'}</TableCell>
                        <TableCell>{vendor.contactEmail || '-'}</TableCell>
                        <TableCell>{vendor.contactPhone || '-'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            vendor.approvalStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                            vendor.approvalStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {vendor.approvalStatus || 'Pending'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="relative">
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={(e) => handleActionClick(vendor.id, e)}
                            >
                              <span className="sr-only">Open menu</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </Button>
                            {activeVendor === vendor.id && (
                              <div
                                className="absolute right-0 mt-1 w-36 bg-white shadow-lg ring-1 ring-black ring-opacity-5 rounded-md z-50"
                              >
                                <div className="py-1">
                                  <button
                                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={(e) => handleViewVendor(vendor, 'view', e)}
                                  >
                                    View
                                  </button>
                                  <button
                                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={(e) => handleViewVendor(vendor, 'edit', e)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteVendor(vendor.id);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {currentPage < totalPages && (
                  <div className="flex items-center justify-center py-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="px-4"
                    >
                      Load More Vendors
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View/Edit Vendor Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogTitle>
              {selectedVendor && mode === 'edit' ? `Edit ${selectedVendor.companyName}` : 'Vendor Details'}
            </DialogTitle>
            {mode === 'edit' ? (
              <VendorForm
                vendor={selectedVendor}
                mode="edit"
                onClose={() => setIsDialogOpen(false)}
              />
            ) : (
              <VendorDetails vendor={selectedVendor} />
            )}
          </DialogContent>
        </Dialog>

        {/* Add Vendor Dialog */}
        <Dialog open={isAddVendorDialogOpen} onOpenChange={setIsAddVendorDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogTitle>Add New Vendor</DialogTitle>
            <VendorForm
              mode="create"
              onClose={() => setIsAddVendorDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default VendorsPage;