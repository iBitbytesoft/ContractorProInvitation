import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  File, Image, Archive, FileText, Plus, Search, Download, FileSpreadsheet, 
  Info, Trash2, Eye, Filter, Tag, Building, CalendarDays, SlidersHorizontal, 
  RefreshCw, FileCheck
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import UploadDocumentForm from "@/components/forms/UploadDocumentForm";
import DocumentOperations from "@/lib/operations/DocumentOperations";
import VendorOperations from "@/lib/operations/VendorOperations";
import { Document, Vendor } from "@/lib/types";
import { Helmet } from "react-helmet-async";
import { formatBytes } from "@/lib/utils";

type ViewMode = "grid" | "table";
type FilterType = "all" | "byVendor" | "byCategory";

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  
  // Helper function for setting document to delete
  const handleSetDocumentToDelete = (id: string | undefined) => {
    if (id) setDocumentToDelete(id);
  };

  // Fetch all documents
  const { 
    data: documents = [], 
    isLoading: isLoadingDocuments,
    refetch: refetchDocuments 
  } = useQuery({
    queryKey: ["documents"],
    queryFn: () => DocumentOperations.getAllDocuments(),
  });

  // Fetch all vendors for filtering
  const { 
    data: vendors = [], 
    isLoading: isLoadingVendors 
  } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => VendorOperations.getAllVendors(),
  });

  // Extract unique categories from documents
  const uniqueCategories = Array.from(
    new Set(documents.map(doc => doc.category))
  ).sort();

  // Filter documents based on search query and filters
  const filteredDocuments = documents.filter(document => {
    const matchesSearch = 
      document.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      document.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      document.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      document.vendorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      document.fileName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "byVendor" && selectedVendorId) {
      return document.vendorId === selectedVendorId;
    }
    
    if (filterType === "byCategory" && selectedCategory) {
      return document.category === selectedCategory;
    }

    return true;
  });

  // Clear filters
  const clearFilters = () => {
    setFilterType("all");
    setSelectedVendorId("");
    setSelectedCategory("");
  };

  // Handle document deletion
  const handleDeleteDocument = async (documentId: string) => {
    try {
      await DocumentOperations.deleteDocument(documentId);
      refetchDocuments();
      setIsDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  // Open document in new tab
  const openDocument = (url: string) => {
    window.open(url, '_blank');
  };

  // Get icon based on file type
  function getDocumentIcon(type: string | undefined) {
    if (!type) return <FileText className="h-5 w-5 text-blue-500" />;
    
    switch (type.toLowerCase()) {
      case "pdf":
        return <File className="h-5 w-5 text-red-500" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "svg":
        return <Image className="h-5 w-5 text-green-500" />;
      case "zip":
      case "rar":
      case "7z":
        return <Archive className="h-5 w-5 text-orange-500" />;
      case "doc":
      case "docx":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "xls":
      case "xlsx":
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  }

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mt-6 text-2xl font-semibold">No Documents Uploaded Yet</h2>
      <p className="mt-2 text-center text-muted-foreground max-w-md">
        Start organizing your important documents. Upload contracts, licenses, certifications, and other business documents to keep them secure and easily accessible.
      </p>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="mt-6 bg-gradient-to-br from-primary/90 via-primary-900 to-black hover:from-primary/80 hover:via-primary-800 hover:to-primary-900 transition-all">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Document
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Upload New Document</DialogTitle>
          </DialogHeader>
          <UploadDocumentForm 
            onSuccess={() => {
              document.querySelector<HTMLButtonElement>('[role="dialog"] button[data-state="open"]')?.click();
              refetchDocuments();
            }} 
          />
        </DialogContent>
      </Dialog>
      <div className="mt-8 flex items-start gap-2 max-w-lg text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p className="text-left">
          <span className="font-semibold">Pro Tip:</span> Keep your documents organized by using categories when uploading. 
          This helps track important paperwork like vendor agreements, compliance certificates, and asset documentation in one place.
        </p>
      </div>
    </div>
  );

  // Loading state
  if (isLoadingDocuments) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Documents</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-muted rounded w-full mb-4"></div>
          <div className="h-8 bg-muted rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Documents | ContractorPro</title>
      </Helmet>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Documents</h1>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
                  >
                    {viewMode === "grid" ? (
                      <SlidersHorizontal className="h-4 w-4" />
                    ) : (
                      <FileCheck className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Switch to {viewMode === "grid" ? "table" : "grid"} view</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-br from-primary/90 via-primary-900 to-black hover:from-primary/80 hover:via-primary-800 hover:to-primary-900 transition-all">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Upload New Document</DialogTitle>
                </DialogHeader>
                <UploadDocumentForm 
                  onSuccess={() => {
                    document.querySelector<HTMLButtonElement>('[role="dialog"] button[data-state="open"]')?.click();
                    refetchDocuments();
                  }} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1">
                  <Filter className="h-4 w-4" />
                  {filterType === "byVendor" ? "Vendor" : filterType === "byCategory" ? "Category" : "Filter"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter Documents</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    setFilterType("all");
                    setSelectedVendorId("");
                    setSelectedCategory("");
                  }}
                >
                  Show all documents
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="flex items-center gap-1">
                  <Building className="h-4 w-4" /> By Vendor
                </DropdownMenuLabel>
                {vendors.map(vendor => (
                  <DropdownMenuItem 
                    key={vendor.id}
                    onClick={() => {
                      setFilterType("byVendor");
                      setSelectedVendorId(vendor.id || "");
                      setSelectedCategory("");
                    }}
                  >
                    {vendor.companyName}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="flex items-center gap-1">
                  <Tag className="h-4 w-4" /> By Category
                </DropdownMenuLabel>
                {uniqueCategories.map(category => (
                  <DropdownMenuItem 
                    key={category}
                    onClick={() => {
                      setFilterType("byCategory");
                      setSelectedCategory(category);
                      setSelectedVendorId("");
                    }}
                  >
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {filterType !== "all" && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="h-9"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
          
          {documents.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredDocuments.length} of {documents.length} documents
            </div>
          )}
        </div>

        {(!documents || documents.length === 0) ? (
          <EmptyState />
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-muted/30 border rounded-lg p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No matching documents</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find any documents matching your search or filters.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((document) => (
              <Card key={document.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="relative flex flex-col items-center justify-center p-6">
                  {getDocumentIcon(document.fileType)}
                  <div className="absolute top-4 right-4 flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => openDocument(document.fileURL)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => window.open(document.fileURL, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <AlertDialog open={isDeleteDialogOpen && documentToDelete === document.id} onOpenChange={setIsDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          onClick={() => handleSetDocumentToDelete(document.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the document from your account.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDocumentToDelete(null)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => document.id && handleDeleteDocument(document.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <div className="mt-4 space-y-4 text-center w-full">
                    <div>
                      <h3 className="font-semibold truncate">{document.documentName}</h3>
                      {document.vendorName && (
                        <p className="text-sm text-muted-foreground">
                          <span className="flex items-center justify-center gap-1">
                            <Building className="h-3 w-3" />
                            {document.vendorName}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="capitalize">
                        {document.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(document.createdAt)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      {getDocumentIcon(document.fileType)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="max-w-[200px] truncate">
                        {document.documentName}
                      </div>
                      {document.description && (
                        <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {document.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {document.vendorName ? (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {document.vendorName}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className="capitalize bg-primary/10 hover:bg-primary/20 text-primary border-primary/20">
                        {document.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 text-muted-foreground" />
                        <span>{formatDate(document.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {document.fileSize ? formatBytes(document.fileSize) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDocument(document.fileURL)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(document.fileURL, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <AlertDialog open={isDeleteDialogOpen && documentToDelete === document.id} onOpenChange={setIsDeleteDialogOpen}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleSetDocumentToDelete(document.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the document from your account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDocumentToDelete(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => document.id && handleDeleteDocument(document.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}