
import { X } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';
import { formatDate } from '@/lib/utils';

// Asset interface based on the schema we saw
interface Asset {
  id: string;
  assetName: string;
  category: string;
  type: string;
  status: string;
  location: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  condition?: string;
  purchasePrice?: string;
  assignedTo?: string;
  usageType?: string;
  notes?: string;
  purchaseDate?: string | Date;
  warrantyExpiry?: string | Date;
  lastMaintenanceDate?: string | Date;
  nextMaintenanceDate?: string | Date;
  createdAt?: string;
  updatedAt?: string;
  assetPhotoURL?: string;
}

interface AssetDetailsProps {
  asset: Asset | null;
  open: boolean;
  onClose: () => void;
}

export function AssetDetails({ asset, open, onClose }: AssetDetailsProps) {
  if (!asset) return null;

  // Map type to a more readable format
  const typeLabels: Record<string, string> = {
    'heavy_equipment': 'Heavy Equipment',
    'tools': 'Tools',
    'vehicles': 'Vehicles',
    'other': 'Other'
  };

  // Map status to a more readable format
  const statusLabels: Record<string, string> = {
    'available': 'Available',
    'in_use': 'In Use',
    'maintenance': 'Maintenance',
    'retired': 'Retired'
  };

  // Map condition to a more readable format
  const conditionLabels: Record<string, string> = {
    'new': 'New',
    'good': 'Good',
    'fair': 'Fair',
    'poor': 'Poor',
    'needs_repair': 'Needs Repair',
    'decommissioned': 'Decommissioned'
  };

  // Map usage type to a more readable format
  const usageTypeLabels: Record<string, string> = {
    'company_owned': 'Company Owned',
    'rented': 'Rented',
    'leased': 'Leased'
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl sm:max-w-[600px]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <h2 className="text-xl font-semibold mb-2 flex items-center">
          {asset.assetPhotoURL && (
            <img 
              src={asset.assetPhotoURL} 
              alt={asset.assetName} 
              className="w-10 h-10 object-cover rounded-md mr-2"
            />
          )}
          <div>{asset.assetName}</div>
          <div className={`ml-auto text-sm px-2 py-1 rounded-full ${
            asset.status === 'available' ? 'bg-green-100 text-green-800' :
            asset.status === 'in_use' ? 'bg-blue-100 text-blue-800' :
            asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {statusLabels[asset.status] || asset.status}
          </div>
        </h2>
        
        <div className="text-sm text-muted-foreground mb-4">
          {typeLabels[asset.type] || asset.type} • {asset.category}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
            
            {asset.serialNumber && (
              <div className="flex mb-2">
                <span className="text-muted-foreground w-36">Serial Number:</span>
                <span>{asset.serialNumber}</span>
              </div>
            )}
            
            {asset.model && (
              <div className="flex mb-2">
                <span className="text-muted-foreground w-36">Model:</span>
                <span>{asset.model}</span>
              </div>
            )}
            
            {asset.manufacturer && (
              <div className="flex mb-2">
                <span className="text-muted-foreground w-36">Manufacturer:</span>
                <span>{asset.manufacturer}</span>
              </div>
            )}
            
            <div className="flex mb-2">
              <span className="text-muted-foreground w-36">Location:</span>
              <span>{asset.location}</span>
            </div>
            
            {asset.condition && (
              <div className="flex mb-2">
                <span className="text-muted-foreground w-36">Condition:</span>
                <span>{conditionLabels[asset.condition] || asset.condition}</span>
              </div>
            )}

            {asset.assignedTo && (
              <div className="flex mb-2">
                <span className="text-muted-foreground w-36">Assigned To:</span>
                <span>{asset.assignedTo}</span>
              </div>
            )}

            {asset.usageType && (
              <div className="flex mb-2">
                <span className="text-muted-foreground w-36">Usage Type:</span>
                <span>{usageTypeLabels[asset.usageType] || asset.usageType}</span>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Financial & Maintenance</h3>
            
            {asset.purchaseDate && (
              <div className="flex mb-2">
                <span className="text-muted-foreground w-36">Purchase Date:</span>
                <span>{formatDate(new Date(asset.purchaseDate))}</span>
              </div>
            )}
            
            {asset.purchasePrice && (
              <div className="flex mb-2">
                <span className="text-muted-foreground w-36">Purchase Price:</span>
                <span>${asset.purchasePrice}</span>
              </div>
            )}
            
            {asset.warrantyExpiry && (
              <div className="flex mb-2">
                <span className="text-muted-foreground w-36">Warranty Expiry:</span>
                <span>{formatDate(new Date(asset.warrantyExpiry))}</span>
              </div>
            )}
            
            {asset.lastMaintenanceDate && (
              <div className="flex mb-2">
                <span className="text-muted-foreground w-36">Last Maintenance:</span>
                <span>{formatDate(new Date(asset.lastMaintenanceDate))}</span>
              </div>
            )}
            
            {asset.nextMaintenanceDate && (
              <div className="flex mb-2">
                <span className="text-muted-foreground w-36">Next Maintenance:</span>
                <span>{formatDate(new Date(asset.nextMaintenanceDate))}</span>
              </div>
            )}
          </div>
        </div>

        {asset.notes && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Notes</h3>
            <p className="text-sm">{asset.notes}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground flex justify-between mt-8">
          <div>Created: {formatDate(new Date(asset.createdAt || new Date()))}</div>
          {asset.updatedAt && (
            <div>Last Updated: {formatDate(new Date(asset.updatedAt))}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
