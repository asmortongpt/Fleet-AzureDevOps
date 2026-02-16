import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Slider } from './slider';
import { Label } from './label';
import { Card } from './card';

const meta: Meta<typeof Slider> = {
  title: 'UI/Form/Slider',
  component: Slider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A multi-directional slider component built on Radix UI for selecting single or multiple values within a range.',
      },
    },
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 1,
  },
  render: (args) => (
    <div className="w-full max-w-xs">
      <Label className="mb-2 block">Volume: 50%</Label>
      <Slider {...args} />
    </div>
  ),
};

export const RangeSlider: Story = {
  render: () => {
    const [values, setValues] = useState<number[]>([20, 80]);
    return (
      <div className="w-full max-w-xs space-y-4">
        <Label>Price Range: ${values[0]} - ${values[1]}</Label>
        <Slider
          defaultValue={values}
          min={0}
          max={100}
          step={1}
          onValueChange={setValues}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Slider with two handles for selecting a range',
      },
    },
  },
};

export const WithSteps: Story = {
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 10,
  },
  render: (args) => (
    <div className="w-full max-w-xs space-y-4">
      <Label>Quality Level (10% intervals)</Label>
      <Slider {...args} />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Slider with larger step increments',
      },
    },
  },
};

export const MultiValue: Story = {
  render: () => {
    const [values, setValues] = useState<number[]>([30, 60, 90]);
    return (
      <div className="w-full max-w-xs space-y-4">
        <Label>Multi-value Selection</Label>
        <Slider
          defaultValue={values}
          min={0}
          max={100}
          step={1}
          onValueChange={setValues}
        />
        <div className="text-sm text-muted-foreground">
          Values: {values.join(', ')}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Slider with multiple handles for complex ranges',
      },
    },
  },
};

export const SpeedControl: Story = {
  render: () => {
    const [speed, setSpeed] = useState(50);
    const getSpeedLabel = (val: number) => {
      if (val < 33) return 'Slow';
      if (val < 67) return 'Medium';
      return 'Fast';
    };

    return (
      <Card className="p-6 w-full max-w-xs">
        <Label className="mb-4 block">Playback Speed</Label>
        <Slider
          defaultValue={[speed]}
          min={10}
          max={100}
          step={5}
          onValueChange={([val]) => setSpeed(val)}
        />
        <div className="mt-4 text-center">
          <div className="text-2xl font-bold">{speed}%</div>
          <div className="text-sm text-muted-foreground">
            {getSpeedLabel(speed)}
          </div>
        </div>
      </Card>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Speed control slider with visual feedback',
      },
    },
  },
};

export const TemperatureControl: Story = {
  render: () => {
    const [temp, setTemp] = useState(72);
    const getTempColor = (t: number) => {
      if (t < 65) return 'text-blue-500';
      if (t > 80) return 'text-red-500';
      return 'text-green-500';
    };

    return (
      <Card className="p-6 w-full max-w-xs">
        <Label className="mb-4 block">Temperature Control</Label>
        <Slider
          defaultValue={[temp]}
          min={55}
          max={90}
          step={1}
          onValueChange={([val]) => setTemp(val)}
        />
        <div className="mt-4 text-center">
          <div className={`text-3xl font-bold ${getTempColor(temp)}`}>
            {temp}°F
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {temp < 65 ? 'Cool' : temp > 80 ? 'Warm' : 'Comfortable'}
          </div>
        </div>
      </Card>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Temperature control with color feedback based on value',
      },
    },
  },
};

export const BrightnessControl: Story = {
  render: () => {
    const [brightness, setBrightness] = useState(75);
    return (
      <div className="w-full max-w-xs space-y-4">
        <Label>Screen Brightness: {brightness}%</Label>
        <Slider
          defaultValue={[brightness]}
          min={0}
          max={100}
          step={1}
          onValueChange={([val]) => setBrightness(val)}
        />
        <div
          className="w-full h-12 rounded border transition-colors"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${1 - brightness / 100})`,
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Brightness control with visual representation',
      },
    },
  },
};

export const TimeRangeSelector: Story = {
  render: () => {
    const [range, setRange] = useState<number[]>([480, 1020]); // 8 AM to 5 PM in minutes
    const minutesToTime = (mins: number) => {
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    return (
      <Card className="p-6 w-full max-w-xs">
        <Label className="mb-4 block">Working Hours</Label>
        <Slider
          defaultValue={range}
          min={0}
          max={1440}
          step={15}
          onValueChange={setRange}
        />
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Start Time:</span>
            <span className="font-semibold">{minutesToTime(range[0])}</span>
          </div>
          <div className="flex justify-between">
            <span>End Time:</span>
            <span className="font-semibold">{minutesToTime(range[1])}</span>
          </div>
        </div>
      </Card>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Time range selector using slider',
      },
    },
  },
};

export const FilteringPattern: Story = {
  render: () => {
    const [price, setPrice] = useState<number[]>([0, 100]);
    const [mileage, setMileage] = useState<number[]>([0, 200000]);

    return (
      <Card className="p-6 w-full max-w-sm space-y-6">
        <div>
          <Label className="mb-2 block">Price: ${price[0]} - ${price[1]}</Label>
          <Slider
            defaultValue={price}
            min={0}
            max={100}
            step={1}
            onValueChange={setPrice}
          />
        </div>
        <div>
          <Label className="mb-2 block">
            Mileage: {mileage[0].toLocaleString()} - {mileage[1].toLocaleString()} miles
          </Label>
          <Slider
            defaultValue={mileage}
            min={0}
            max={300000}
            step={10000}
            onValueChange={setMileage}
          />
        </div>
      </Card>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple sliders for filtering vehicles',
      },
    },
  },
};

export const Vertical: Story = {
  render: () => (
    <div className="h-64 w-full max-w-xs flex justify-center">
      <Slider
        defaultValue={[50]}
        min={0}
        max={100}
        step={1}
        orientation="vertical"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Vertical slider orientation',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="w-full max-w-xs space-y-4">
      <div>
        <Label className="mb-2 block opacity-50">Disabled Slider</Label>
        <Slider
          defaultValue={[50]}
          min={0}
          max={100}
          step={1}
          disabled
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Disabled slider state',
      },
    },
  },
};

export const Accessible: Story = {
  render: () => (
    <div className="w-full max-w-xs">
      <Label
        htmlFor="accessible-slider"
        className="mb-2 block"
      >
        Volume Control
      </Label>
      <Slider
        id="accessible-slider"
        defaultValue={[50]}
        min={0}
        max={100}
        step={1}
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
      />
      <p className="text-xs text-muted-foreground mt-2">
        Use arrow keys to adjust volume
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
        story: 'Slider with proper ARIA labels for screen readers',
      },
    },
  },
};

export const Responsive: Story = {
  render: () => (
    <div className="w-full space-y-4">
      <div>
        <Label className="mb-2 block text-sm">Single Slider</Label>
        <Slider defaultValue={[50]} min={0} max={100} step={1} />
      </div>
      <div>
        <Label className="mb-2 block text-sm">Range Slider</Label>
        <Slider defaultValue={[20, 80]} min={0} max={100} step={1} />
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Responsive slider layout for mobile',
      },
    },
  },
};
