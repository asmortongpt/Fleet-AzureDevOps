import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import Helmet from 'react-helmet';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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

const CheckoutAssetModal: React.FC<CheckoutAssetModalProps> = ({ show, onHide, assetId, tenantId }) => {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(CheckoutSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      const signatureHash = await bcrypt.hash(data.signature, 12);
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
        // FedRAMP/SOC 2 compliance: Ensure secure transmission
        httpsAgent: new https.Agent({ rejectUnauthorized: true }),
      });

      if (response.status === 200) {
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
    <>
      <Helmet>
        <meta http-equiv="Content-Security-Policy" content="default-src 'self';" />
        <meta http-equiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains" />
      </Helmet>
      <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton>
          <Modal.Title>Checkout Asset</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group controlId="assignee">
              <Form.Label>Assignee</Form.Label>
              <Form.Control type="text" {...register('assignee')} isInvalid={!!errors.assignee} />
              <Form.Control.Feedback type="invalid">{errors.assignee?.message}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="dueDate">
              <Form.Label>Due Date</Form.Label>
              <Form.Control type="date" {...register('dueDate')} isInvalid={!!errors.dueDate} />
              <Form.Control.Feedback type="invalid">{errors.dueDate?.message}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="purpose">
              <Form.Label>Purpose</Form.Label>
              <Form.Control type="text" {...register('purpose')} isInvalid={!!errors.purpose} />
              <Form.Control.Feedback type="invalid">{errors.purpose?.message}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="condition">
              <Form.Label>Condition</Form.Label>
              <Form.Control as="select" {...register('condition')} isInvalid={!!errors.condition}>
                <option value="EXCELLENT">EXCELLENT</option>
                <option value="GOOD">GOOD</option>
                <option value="FAIR">FAIR</option>
                <option value="POOR">POOR</option>
                <option value="DAMAGED">DAMAGED</option>
              </Form.Control>
              <Form.Control.Feedback type="invalid">{errors.condition?.message}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="signature">
              <Form.Label>Signature</Form.Label>
              <Form.Control type="text" {...register('signature')} isInvalid={!!errors.signature} />
              <Form.Control.Feedback type="invalid">{errors.signature?.message}</Form.Control.Feedback>
            </Form.Group>
            <Button variant="primary" type="submit">Checkout</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default CheckoutAssetModal;