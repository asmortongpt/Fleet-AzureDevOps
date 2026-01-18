import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import logger from '@/utils/logger';

interface CheckoutAssetModalProps {
  show: boolean;
  onHide: () => void;
  assetId: string;
  tenantId: string;
}

const CheckoutSchema = z.object({
  assignee: z.string().min(1, 'Assignee is required').max(100),
  dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  purpose: z.string().min(1, 'Purpose is required').max(255),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED']),
  signature: z.string().min(1, 'Signature is required'),
});

type CheckoutFormData = z.infer<typeof CheckoutSchema>;

const CheckoutAssetModal: React.FC<CheckoutAssetModalProps> = ({ show, onHide, assetId, tenantId }) => {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CheckoutFormData>({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: {
      condition: 'GOOD',
    },
  });

  const conditionValue = watch('condition');

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      // Using a simple base64 encoding as a placeholder since bcryptjs is not available in browser
      const signatureHash = btoa(data.signature);
      const response = await axios.post('/api/assets/checkout', {
        assetId,
        tenantId,
        assignee: data.assignee,
        dueDate: data.dueDate,
        purpose: data.purpose,
        condition: data.condition,
        signature: signatureHash,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
      });

      if (response?.status === 200) {
        // Audit logging for critical action
        logger.debug(`Asset ${assetId} checked out by ${data.assignee} for tenant ${tenantId}`);
        onHide();
      } else {
        throw new Error('Failed to checkout asset');
      }
    } catch (err) {
      logger.error('Error during asset checkout:', err);
      setError('An error occurred during checkout. Please try again.');
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Checkout Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="assignee">Assignee</Label>
            <Input id="assignee" {...register('assignee')} />
            {errors.assignee && (
              <p className="text-sm text-destructive">{errors.assignee.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" type="date" {...register('dueDate')} />
            {errors.dueDate && (
              <p className="text-sm text-destructive">{errors.dueDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input id="purpose" {...register('purpose')} />
            {errors.purpose && (
              <p className="text-sm text-destructive">{errors.purpose.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select
              value={conditionValue}
              onValueChange={(value) => setValue('condition', value as CheckoutFormData['condition'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXCELLENT">EXCELLENT</SelectItem>
                <SelectItem value="GOOD">GOOD</SelectItem>
                <SelectItem value="FAIR">FAIR</SelectItem>
                <SelectItem value="POOR">POOR</SelectItem>
                <SelectItem value="DAMAGED">DAMAGED</SelectItem>
              </SelectContent>
            </Select>
            {errors.condition && (
              <p className="text-sm text-destructive">{errors.condition.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signature">Signature</Label>
            <Input id="signature" {...register('signature')} />
            {errors.signature && (
              <p className="text-sm text-destructive">{errors.signature.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full">Checkout</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutAssetModal;
