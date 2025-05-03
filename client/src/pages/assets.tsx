import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  FileSpreadsheet,
  PlusCircle,
  Search,
  Loader2,
  RefreshCw,
  AlertCircle,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
  Package,
  Tag,
  Wrench,
  Truck,
  Building,
  CircleDollarSign,
  FileText
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { AssetOperations } from '@/lib/firestore';
import { EnhancedAssetForm } from '@/components/forms/EnhancedAssetForm';
import { Asset } from '@/lib/types';
import {Helmet} from 'react-helmet-async';
import { formatDate, toSafeDate } from '@/lib/utils';


import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return 'bg-green-500';
    case 'in_use':
      return 'bg-blue-500';
    case 'maintenance':
      return 'bg-yellow-500';
    case 'retired':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'available':
      return 'Available';
    case 'in_use':
      return 'In Use';
    case 'maintenance':
      return 'Maintenance';
    case 'retired':
      return 'Retired';
    default:
      return 'Unknown';
  }
};

const AssetDetails = ({ asset, open, onClose }: { asset: Asset | null; open: boolean; onClose: () => void }) => {
  if (!asset) return null;
console.log('AssetDetails', asset);
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[85vw] md:max-w-[75vw] lg:max-w-[65vw] xl:max-w-[55vw] max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
          <Wrench className="h-6 w-6" />
          Asset Details
        </DialogTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Asset Image Section */}
          <div className="col-span-1 md:col-span-2 flex justify-center">
            {asset.assetPhotoURL ? (
              <img
                src={asset.assetPhotoURL}
                alt={asset.assetName}
                className="rounded-lg max-h-[300px] object-cover shadow-lg"
              />
            ) : (
              <div className="w-full max-w-[500px] h-[200px] bg-muted rounded-lg flex items-center justify-center">
                <Package className="h-20 w-20 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Basic Information
              </h3>
              <div className="mt-2 space-y-2">
                <p><strong>Asset Name:</strong> {asset.assetName}</p>
                <p><strong>Category:</strong> {asset.category}</p>
                <div className="flex items-center gap-2">
                  <strong>Status:</strong>
                  <Badge variant={asset.status === 'available' ? 'success' :
                    asset.status === 'in_use' ? 'info' :
                      asset.status === 'maintenance' ? 'warning' : 'destructive'}>
                    {getStatusLabel(asset.status)}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                Location Details
              </h3>
              <div className="mt-2">
                <p><strong>Location:</strong> {asset.location || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Technical Details
              </h3>
              <div className="mt-2 space-y-2">
                <p><strong>Manufacturer:</strong> {asset.manufacturer || 'Not specified'}</p>
                <p><strong>Model:</strong> {asset.model || 'Not specified'}</p>
                <p><strong>Serial Number:</strong> {asset.serialNumber || 'Not specified'}</p>
                <p><strong>Condition:</strong> {asset.condition || 'Not specified'}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4" />
                Purchase Information
              </h3>
              <div className="mt-2 space-y-2">
                <p><strong>Purchase Date:</strong> {asset.purchaseDate ? formatDate(toSafeDate(asset.purchaseDate)) : 'Not specified'}</p>
                  <p><strong>Purchase Price:</strong>
                    {asset.purchasePrice !== undefined && asset.purchasePrice !== null
                      ? `$${Number(asset.purchasePrice).toFixed(2)}`
                      : 'Not specified'}
                  </p>
              </div>
            </div>
          </div>

          {/* Notes Section - Full Width */}
          {asset.internalNotes && (
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                Notes
              </h3>
              <div className="bg-muted p-4 rounded-lg">
                {asset.internalNotes}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Assets = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isViewingAsset, setIsViewingAsset] = useState(false);
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const {
    data: assets = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: AssetOperations.getAssets,
    retry: 2,
    retryDelay: 1000
  });

  const filteredAssets = assets.filter((asset: Asset) =>
    (asset.assetName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (asset.category?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (asset.location?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAssets.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentAssets = filteredAssets.slice(startIndex, endIndex);

  const handleDeleteAsset = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await AssetOperations.deleteAsset(id);
        toast.success('Asset deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['assets'] });
      } catch (error) {
        console.error('Error deleting asset:', error);
        toast.error('Failed to delete asset');
      }
    }
  };

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setMode('edit');
    setIsAddAssetOpen(true);
  };

  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsViewingAsset(true);
  };

  const handleFormSuccess = () => {
    setIsAddAssetOpen(false);
    setSelectedAsset(null);
    setMode(null);
    queryClient.invalidateQueries({ queryKey: ['assets'] });
    toast.success(selectedAsset ? 'Asset updated successfully' : 'Asset created successfully');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const [mode, setMode] = useState<'view' | 'edit' | null>(null);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>Assets | ContractorPro</title>
      </Helmet>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Assets</h1>
          <div className="flex gap-2 mt-4 md:mt-0">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search assets..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsAddAssetOpen(true)} className="whitespace-nowrap">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Asset Management</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading assets...</span>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <AlertCircle className="h-8 w-8 text-destructive mb-4" />
                <h3 className="text-lg font-medium mb-2">Error loading assets</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  {error instanceof Error ? error.message : 'An unexpected error occurred'}
                </p>
                <Button onClick={() => refetch()} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Retry
                </Button>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium">No assets found</h3>
                <p className="text-muted-foreground mt-1 mb-4 max-w-md">
                  {searchQuery ? "No assets match your search criteria" : "You haven't added any assets yet."}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsAddAssetOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Your First Asset
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.assetName}</TableCell>
                        <TableCell>{asset.category}</TableCell>
                        <TableCell>{asset.location}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`h-2.5 w-2.5 rounded-full mr-2 ${getStatusColor(asset.status)}`}></div>
                            {getStatusLabel(asset.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewAsset(asset)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditAsset(asset)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAsset(asset.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <AssetDetails
                  asset={selectedAsset}
                  open={isViewingAsset}
                  onClose={() => setIsViewingAsset(false)}
                />
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex items-center justify-between p-4 border-t">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{Math.min(filteredAssets.length, pageSize)}</span>{" "}
              of <span className="font-medium">{filteredAssets.length}</span> assets
            </p>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    isActive={currentPage === i + 1}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

      </div>

      <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
        <DialogContent className="sm:max-w-[85vw] md:max-w-[75vw] lg:max-w-[65vw] xl:max-w-[55vw] max-h-[90vh] overflow-y-auto">
          <DialogTitle>
            {mode === 'view' ? 'Asset Details' : mode === 'edit' ? 'Edit Asset' : 'Add New Asset'}
          </DialogTitle>
          <div className="py-2 px-1">
            <EnhancedAssetForm
              initialData={selectedAsset}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setIsAddAssetOpen(false);
                setMode(null);
              }}
              readOnly={mode === 'view'}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Assets;