import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Building2, Save, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VendorOperations } from '@/lib/firestore';
import { useQueryClient } from '@tanstack/react-query';

const vendorSchema = z.object({
  companyName: z.string().min(2, { message: 'Company name must be at least 2 characters' }),
  abn: z.string().min(11, { message: 'ABN must be at least 11 characters' }),
  industry: z.string().min(2, { message: 'Industry must be at least 2 characters' }),
  type: z.string().default('contractor'),
  website: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),

  // Contact Information
  contactName: z.string().min(2, { message: 'Contact name is required' }),
  contactEmail: z.string().email({ message: 'Please enter a valid email' }),
  contactPhone: z.string().min(8, { message: 'Please enter a valid phone number' }),
  address: z.string().min(2, { message: 'Address is required' }),

  // Banking Information
  accountName: z.string().optional(),
  bankName: z.string().optional(),
  bsb: z.string().optional(),
  bankAccount: z.string().optional(),

  // Compliance & Licensing
  licenseNumber: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  complianceStatus: z.enum(['compliant', 'non-compliant', 'pending']).default('pending'),

  // Payment & Rating
  paymentTerms: z.string().default('Net 30 Days'),
  rating: z.number().min(0).max(5).default(0),

  // Additional Information
  approvalStatus: z.enum(['Approved', 'Pending', 'Rejected']).default('Pending'),
  internalNotes: z.string().optional(),
});

interface VendorFormProps {
  vendor?: any;
  mode?: 'create' | 'edit';
  onClose?: () => void;
}

const VendorForm = ({ vendor, mode = 'create', onClose }: VendorFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof vendorSchema>>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      companyName: vendor?.companyName || '',
      abn: vendor?.abn || '',
      industry: vendor?.industry || '',
      type: vendor?.type || 'contractor',
      website: vendor?.website || '',

      contactName: vendor?.contactName || '',
      contactEmail: vendor?.contactEmail || '',
      contactPhone: vendor?.contactPhone || '',
      address: vendor?.address || '',

      accountName: vendor?.accountName || '',
      bankName: vendor?.bankName || '',
      bsb: vendor?.bsb || '',
      bankAccount: vendor?.bankAccount || '',

      licenseNumber: vendor?.licenseNumber || '',
      insuranceExpiry: vendor?.insuranceExpiry || '',
      complianceStatus: vendor?.complianceStatus || 'pending',

      paymentTerms: vendor?.paymentTerms || 'Net 30 Days',
      rating: vendor?.rating || 0,

      approvalStatus: vendor?.approvalStatus || 'Pending',
      internalNotes: vendor?.internalNotes || '',
    },
  });

  const onSubmit = async (data: z.infer<typeof vendorSchema>) => {
    setIsSubmitting(true);
    try {
      if (mode === 'edit' && vendor?.id) {
        await VendorOperations.updateVendor(vendor.id, {
          ...data,
          updatedAt: new Date(),
        });
        toast.success('Vendor updated successfully');
      } else {
        await VendorOperations.addVendor({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        toast.success('Vendor added successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      onClose?.();
    } catch (error) {
      console.error('Error submitting vendor form:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred while saving the vendor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Accordion type="single" collapsible defaultValue="basic-info" className="w-full">
          <AccordionItem value="basic-info">
            <AccordionTrigger>Basic Information</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="abn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ABN*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter ABN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry*</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Construction" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vendor type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="contractor">Contractor</SelectItem>
                            <SelectItem value="supplier">Supplier</SelectItem>
                            <SelectItem value="consultant">Consultant</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="contact">
            <AccordionTrigger>Contact Information</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email*</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="banking">
            <AccordionTrigger>Banking Information</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter account name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter bank name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bsb"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BSB</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter BSB" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter account number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="compliance">
            <AccordionTrigger>Compliance & Licensing</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter license number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="insuranceExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Expiry</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="complianceStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compliance Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select compliance status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="compliant">Compliant</SelectItem>
                          <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="payment">
            <AccordionTrigger>Payment & Rating</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment terms" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Net 30 Days">Net 30 Days</SelectItem>
                          <SelectItem value="Net 60 Days">Net 60 Days</SelectItem>
                          <SelectItem value="Net 90 Days">Net 90 Days</SelectItem>
                          <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating (0-5)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="5"
                          step="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="additional">
            <AccordionTrigger>Additional Information</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="approvalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approval Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select approval status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="internalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any internal notes about this vendor"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'edit' ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === 'edit' ? 'Update Vendor' : 'Save Vendor'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default VendorForm;