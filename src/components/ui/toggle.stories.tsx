import type { Meta, StoryObj } from '@storybook/react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Copy, Share2, Heart } from 'lucide-react';
import { Toggle } from './toggle';

const meta: Meta<typeof Toggle> = {
  title: 'UI/Form/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A toggle button component built on Radix UI for switching between on/off states. Supports size variants and icon-only layouts.',
      },
    },
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  args: {
    children: 'Toggle',
  },
};

export const WithIcon: Story = {
  render: () => (
    <Toggle>
      <Bold className="h-4 w-4" />
    </Toggle>
  ),
};

export const Pressed: Story = {
  args: {
    'aria-pressed': true,
    children: 'Pressed',
  },
};

export const PressedWithIcon: Story = {
  render: () => (
    <Toggle defaultPressed>
      <Bold className="h-4 w-4 mr-2" />
      Bold
    </Toggle>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-2 items-center">
      <Toggle size="sm">
        <Bold className="h-3 w-3" />
      </Toggle>
      <Toggle>
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle size="lg">
        <Bold className="h-5 w-5" />
      </Toggle>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};

export const DisabledPressed: Story = {
  args: {
    disabled: true,
    defaultPressed: true,
    children: 'Disabled',
  },
};

export const TextFormattingToolbar: Story = {
  render: () => (
    <div className="flex gap-2 border rounded-lg p-2 bg-muted">
      <Toggle aria-label="Bold" title="Bold">
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle aria-label="Italic" title="Italic">
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle aria-label="Underline" title="Underline">
        <Underline className="h-4 w-4" />
      </Toggle>
      <div className="w-px bg-border mx-2" />
      <Toggle aria-label="Align Left" title="Align Left">
        <AlignLeft className="h-4 w-4" />
      </Toggle>
      <Toggle aria-label="Align Center" title="Align Center">
        <AlignCenter className="h-4 w-4" />
      </Toggle>
      <Toggle aria-label="Align Right" title="Align Right">
        <AlignRight className="h-4 w-4" />
      </Toggle>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Text formatting toolbar with multiple toggles',
      },
    },
  },
};

export const LikeButton: Story = {
  render: () => (
    <Toggle aria-label="Like post" className="gap-2">
      <Heart className="h-4 w-4" />
      <span className="text-sm">Like</span>
    </Toggle>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Like/favorite toggle button',
      },
    },
  },
};

export const ShareButton: Story = {
  render: () => (
    <Toggle aria-label="Share post">
      <Share2 className="h-4 w-4" />
    </Toggle>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <div className="w-full max-w-xs space-y-2">
      <Toggle className="w-full justify-center gap-2">
        <Copy className="h-4 w-4" />
        Copy Link
      </Toggle>
      <Toggle className="w-full justify-center gap-2">
        <Share2 className="h-4 w-4" />
        Share
      </Toggle>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full-width toggle buttons',
      },
    },
  },
};

export const StrokeWeight: Story = {
  render: () => (
    <div className="flex gap-2">
      <Toggle variant="outline" defaultPressed aria-label="Light">
        L
      </Toggle>
      <Toggle variant="outline" aria-label="Medium">
        M
      </Toggle>
      <Toggle variant="outline" aria-label="Heavy">
        H
      </Toggle>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Outline variant toggles for selection groups',
      },
    },
  },
};

export const ViewOptions: Story = {
  render: () => (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-2">Display Mode</p>
        <div className="flex gap-2 border rounded-lg p-2 bg-muted">
          <Toggle defaultPressed aria-label="Grid view">
            Grid
          </Toggle>
          <Toggle aria-label="List view">
            List
          </Toggle>
          <Toggle aria-label="Card view">
            Cards
          </Toggle>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'View mode selection toggles',
      },
    },
  },
};

export const FeatureToggle: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent">
        <span className="text-sm font-medium">Enable Preview</span>
        <Toggle defaultPressed aria-label="Toggle preview" />
      </div>
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent">
        <span className="text-sm font-medium">Show Details</span>
        <Toggle aria-label="Toggle details" />
      </div>
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent bg-muted/50">
        <span className="text-sm font-medium opacity-50">Coming Soon</span>
        <Toggle disabled aria-label="Coming soon" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Feature toggles in a settings-like pattern',
      },
    },
  },
};

export const Accessible: Story = {
  render: () => (
    <div className="space-y-4">
      <Toggle
        aria-label="Enable notifications"
        aria-describedby="toggle-desc"
      >
        Notifications
      </Toggle>
      <p id="toggle-desc" className="text-xs text-muted-foreground">
        Controls whether you receive push notifications
      </p>
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
    docs: {
      description: {
        story: 'Toggle with proper ARIA labels and descriptions',
      },
    },
  },
};

export const Responsive: Story = {
  render: () => (
    <div className="w-full flex flex-col sm:flex-row gap-2">
      <Toggle className="flex-1">Small</Toggle>
      <Toggle className="flex-1">Medium</Toggle>
      <Toggle className="flex-1">Large</Toggle>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Responsive toggle layout',
      },
    },
  },
};

export const Loading: Story = {
  render: () => (
    <Toggle disabled>
      <span className="animate-spin mr-2">⏳</span>
      Loading...
    </Toggle>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading state toggle',
      },
    },
  },
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Default</p>
        <Toggle>Toggle</Toggle>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Outline</p>
        <Toggle variant="outline">Toggle</Toggle>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different toggle variants',
      },
    },
  },
};
