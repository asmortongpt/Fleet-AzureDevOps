import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';
import { Search, Mail, Lock, User, Phone, Calendar } from 'lucide-react';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'date'],
    },
    disabled: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Text: Story = {
  args: {
    type: 'text',
    placeholder: 'Enter text...',
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'email@example.com',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password...',
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: '0',
  },
};

export const Disabled: Story = {
  args: {
    type: 'text',
    placeholder: 'Disabled input',
    disabled: true,
    value: 'Cannot edit',
  },
};

export const WithIcon: Story = {
  render: () => (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder="Search vehicles..." className="pl-9" />
    </div>
  ),
};

export const FleetFormInputs: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <div>
        <label className="text-sm font-medium mb-1 block">VIN</label>
        <Input placeholder="1HGCM82633A123456" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">License Plate</label>
        <Input placeholder="ABC-1234" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Mileage</label>
        <Input type="number" placeholder="0" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Driver Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="email" placeholder="driver@example.com" className="pl-9" />
        </div>
      </div>
    </div>
  ),
};

export const AllTypes: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="email@example.com" />
      <Input type="password" placeholder="Password" />
      <Input type="number" placeholder="Number" />
      <Input type="tel" placeholder="(555) 123-4567" />
      <Input type="url" placeholder="https://example.com" />
      <Input type="date" />
      <Input type="time" />
    </div>
  ),
};

export const WithValidation: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <div>
        <Input placeholder="Valid input" className="border-green-500" />
        <p className="text-sm text-green-600 mt-1">✓ Looks good!</p>
      </div>
      <div>
        <Input placeholder="Invalid input" className="border-red-500" aria-invalid="true" />
        <p className="text-sm text-red-600 mt-1">✗ This field is required</p>
      </div>
    </div>
  ),
};

export const SearchVariants: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search vehicles..." className="pl-9" />
      </div>
      <div className="relative">
        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search drivers..." className="pl-9" />
      </div>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="date" className="pl-9" />
      </div>
    </div>
  ),
};
