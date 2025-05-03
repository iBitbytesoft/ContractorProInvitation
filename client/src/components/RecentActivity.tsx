import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Building2, Truck } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import VendorDetails from "@/components/VendorDetails";
import { VendorOperations } from "@/lib/firestore";
import { Vendor as FullVendor } from "@/lib/types";

interface Asset {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
  createdAt: string;
}

interface Vendor {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
}

interface RecentActivityProps {
  recentVendors: Vendor[];
  recentAssets: Asset[];
}

export function RecentActivity({
  recentVendors,
  recentAssets,
}: RecentActivityProps) {
  const [selectedVendor, setSelectedVendor] = useState<FullVendor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleVendorClick = async (vendor: Vendor) => {
    try {
      // Fetch full vendor details when clicking
      const fullVendorDetails = await VendorOperations.getVendor(vendor.id);
      setSelectedVendor(fullVendorDetails as FullVendor);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error fetching vendor details:", error);
    }
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Recent Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentVendors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">No recent vendors</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex items-center justify-between p-3 rounded-md border hover:bg-muted cursor-pointer"
                    onClick={() => handleVendorClick(vendor)}
                  >
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.type} • {vendor.status}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVendorClick(vendor);
                      }}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link
                to="/vendors"
                className="flex items-center text-sm font-medium text-primary"
              >
                View all vendors
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Recent Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{asset.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {asset.location}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {recentAssets.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No recent assets
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedVendor?.companyName}
            </div>
            <div className="flex items-center gap-2">
              {selectedVendor?.approvalStatus && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    selectedVendor.approvalStatus === "Approved"
                      ? "bg-green-100 text-green-800"
                      : selectedVendor.approvalStatus === "Rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {selectedVendor.approvalStatus}
                </span>
              )}
            </div>
          </DialogTitle>
          <VendorDetails vendor={selectedVendor} />
        </DialogContent>
      </Dialog>
    </>
  );
}
