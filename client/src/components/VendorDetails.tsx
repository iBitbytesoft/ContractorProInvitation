import React from 'react';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
  Shield,
  Scale,
  Star,
  Calendar,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface VendorDetailsProps {
  vendor: any;
}

const VendorDetails = ({ vendor }: VendorDetailsProps) => {
  const formatDate = (date: any) => {
    if (!date) return '-';
    try {
      // Check if it's a Firestore timestamp
      if (date && typeof date.toDate === 'function') {
        return format(date.toDate(), 'dd MMM yyyy');
      }
      // Check if it's a valid date string or timestamp
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return '-';
      }
      return format(parsedDate, 'dd MMM yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return '-';
    }
  };

  const StatusBadge = ({ status, className }: { status: string, className: string }) => (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );

  const InfoRow = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | number | null }) => (
    <div className="flex items-center gap-2 py-2">
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="font-medium min-w-[120px]">{label}:</span>
      <span className="text-muted-foreground">{value || '-'}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {vendor.companyName}
          </h2>
          <p className="text-muted-foreground mt-1">{vendor.type} • {vendor.industry}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {vendor.approvalStatus && (
            <StatusBadge
              status={vendor.approvalStatus}
              className={
                vendor.approvalStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                vendor.approvalStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }
            />
          )}
          {vendor.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="font-medium">{vendor.rating}/5</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Basic Information</h3>
            <InfoRow icon={Building2} label="ABN" value={vendor.abn} />
            <InfoRow icon={Globe} label="Website" value={vendor.website} />
            <InfoRow icon={Clock} label="Created" value={formatDate(vendor.createdAt)} />
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Contact Information</h3>
            <InfoRow icon={Building2} label="Contact" value={vendor.contactName} />
            <InfoRow icon={Mail} label="Email" value={vendor.contactEmail} />
            <InfoRow icon={Phone} label="Phone" value={vendor.contactPhone} />
            <InfoRow icon={MapPin} label="Address" value={vendor.address} />
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Banking Information</h3>
            <InfoRow icon={CreditCard} label="Account Name" value={vendor.accountName} />
            <InfoRow icon={CreditCard} label="Bank Name" value={vendor.bankName} />
            <InfoRow icon={CreditCard} label="BSB" value={vendor.bsb} />
            <InfoRow icon={CreditCard} label="Account" value={vendor.bankAccount} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Compliance & Licensing</h3>
            <InfoRow icon={Shield} label="License" value={vendor.licenseNumber} />
            <InfoRow icon={Calendar} label="Insurance Expiry" value={formatDate(vendor.insuranceExpiry)} />
            <div className="flex items-center gap-2 py-2">
              <Scale className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium min-w-[120px]">Compliance:</span>
              <StatusBadge
                status={vendor.complianceStatus}
                className={
                  vendor.complianceStatus === 'compliant' ? 'bg-green-100 text-green-800' :
                  vendor.complianceStatus === 'non-compliant' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Payment & Rating</h3>
            <InfoRow icon={CreditCard} label="Payment Terms" value={vendor.paymentTerms} />
            <div className="flex items-center gap-2 py-2">
              <Star className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium min-w-[120px]">Rating:</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < (vendor.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {vendor.internalNotes && (
            <div className="space-y-2">
              <h3 className="font-semibold">Internal Notes</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">{vendor.internalNotes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer with timestamps */}
      <div className="border-t pt-4 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Created: {formatDate(vendor.createdAt)}</span>
          <span>Last Updated: {formatDate(vendor.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default VendorDetails;