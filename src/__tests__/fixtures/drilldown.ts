import { DrilldownConfig, DrilldownData, DrilldownLevel } from '../../types/drilldown';

export const mockDrilldownData: DrilldownData = {
  id: 'root',
  name: 'Total Sales',
  value: 1000000,
  children: [
    {
      id: 'north',
      name: 'North Region',
      value: 400000,
      children: [
        {
          id: 'north-q1',
          name: 'Q1',
          value: 100000,
          children: [
            { id: 'north-q1-jan', name: 'January', value: 30000 },
            { id: 'north-q1-feb', name: 'February', value: 35000 },
            { id: 'north-q1-mar', name: 'March', value: 35000 }
          ]
        },
        {
          id: 'north-q2',
          name: 'Q2',
          value: 120000,
          children: [
            { id: 'north-q2-apr', name: 'April', value: 40000 },
            { id: 'north-q2-may', name: 'May', value: 40000 },
            { id: 'north-q2-jun', name: 'June', value: 40000 }
          ]
        },
        {
          id: 'north-q3',
          name: 'Q3',
          value: 90000,
          children: [
            { id: 'north-q3-jul', name: 'July', value: 30000 },
            { id: 'north-q3-aug', name: 'August', value: 30000 },
            { id: 'north-q3-sep', name: 'September', value: 30000 }
          ]
        },
        {
          id: 'north-q4',
          name: 'Q4',
          value: 90000,
          children: [
            { id: 'north-q4-oct', name: 'October', value: 30000 },
            { id: 'north-q4-nov', name: 'November', value: 30000 },
            { id: 'north-q4-dec', name: 'December', value: 30000 }
          ]
        }
      ]
    },
    {
      id: 'south',
      name: 'South Region',
      value: 350000,
      children: [
        {
          id: 'south-q1',
          name: 'Q1',
          value: 80000,
          children: [
            { id: 'south-q1-jan', name: 'January', value: 25000 },
            { id: 'south-q1-feb', name: 'February', value: 25000 },
            { id: 'south-q1-mar', name: 'March', value: 30000 }
          ]
        },
        {
          id: 'south-q2',
          name: 'Q2',
          value: 90000,
          children: [
            { id: 'south-q2-apr', name: 'April', value: 30000 },
            { id: 'south-q2-may', name: 'May', value: 30000 },
            { id: 'south-q2-jun', name: 'June', value: 30000 }
          ]
        },
        {
          id: 'south-q3',
          name: 'Q3',
          value: 90000,
          children: [
            { id: 'south-q3-jul', name: 'July', value: 30000 },
            { id: 'south-q3-aug', name: 'August', value: 30000 },
            { id: 'south-q3-sep', name: 'September', value: 30000 }
          ]
        },
        {
          id: 'south-q4',
          name: 'Q4',
          value: 90000,
          children: [
            { id: 'south-q4-oct', name: 'October', value: 30000 },
            { id: 'south-q4-nov', name: 'November', value: 30000 },
            { id: 'south-q4-dec', name: 'December', value: 30000 }
          ]
        }
      ]
    },
    {
      id: 'east',
      name: 'East Region',
      value: 150000,
      children: [
        {
          id: 'east-q1',
          name: 'Q1',
          value: 35000,
          children: [
            { id: 'east-q1-jan', name: 'January', value: 10000 },
            { id: 'east-q1-feb', name: 'February', value: 12000 },
            { id: 'east-q1-mar', name: 'March', value: 13000 }
          ]
        },
        {
          id: 'east-q2',
          name: 'Q2',
          value: 40000,
          children: [
            { id: 'east-q2-apr', name: 'April', value: 13000 },
            { id: 'east-q2-may', name: 'May', value: 13000 },
            { id: 'east-q2-jun', name: 'June', value: 14000 }
          ]
        },
        {
          id: 'east-q3',
          name: 'Q3',
          value: 37500,
          children: [
            { id: 'east-q3-jul', name: 'July', value: 12500 },
            { id: 'east-q3-aug', name: 'August', value: 12500 },
            { id: 'east-q3-sep', name: 'September', value: 12500 }
          ]
        },
        {
          id: 'east-q4',
          name: 'Q4',
          value: 37500,
          children: [
            { id: 'east-q4-oct', name: 'October', value: 12500 },
            { id: 'east-q4-nov', name: 'November', value: 12500 },
            { id: 'east-q4-dec', name: 'December', value: 12500 }
          ]
        }
      ]
    },
    {
      id: 'west',
      name: 'West Region',
      value: 100000,
      children: [
        {
          id: 'west-q1',
          name: 'Q1',
          value: 25000,
          children: [
            { id: 'west-q1-jan', name: 'January', value: 8000 },
            { id: 'west-q1-feb', name: 'February', value: 8000 },
            { id: 'west-q1-mar', name: 'March', value: 9000 }
          ]
        },
        {
          id: 'west-q2',
          name: 'Q2',
          value: 25000,
          children: [
            { id: 'west-q2-apr', name: 'April', value: 8000 },
            { id: 'west-q2-may', name: 'May', value: 8000 },
            { id: 'west-q2-jun', name: 'June', value: 9000 }
          ]
        },
        {
          id: 'west-q3',
          name: 'Q3',
          value: 25000,
          children: [
            { id: 'west-q3-jul', name: 'July', value: 8000 },
            { id: 'west-q3-aug', name: 'August', value: 8000 },
            { id: 'west-q3-sep', name: 'September', value: 9000 }
          ]
        },
        {
          id: 'west-q4',
          name: 'Q4',
          value: 25000,
          children: [
            { id: 'west-q4-oct', name: 'October', value: 8000 },
            { id: 'west-q4-nov', name: 'November', value: 8000 },
            { id: 'west-q4-dec', name: 'December', value: 9000 }
          ]
        }
      ]
    }
  ]
};

export const mockDrilldownLevels: DrilldownLevel[] = [
  { id: 'region', name: 'Region', depth: 0 },
  { id: 'quarter', name: 'Quarter', depth: 1 },
  { id: 'month', name: 'Month', depth: 2 }
];

export const mockDrilldownConfig: DrilldownConfig = {
  data: mockDrilldownData,
  levels: mockDrilldownLevels,
  onDrill: jest.fn(),
  onBack: jest.fn()
};

export const simpleDrilldownData: DrilldownData = {
  id: 'simple-root',
  name: 'Root',
  value: 100,
  children: [
    {
      id: 'child-1',
      name: 'Child 1',
      value: 60,
      children: [
        { id: 'grandchild-1-1', name: 'Grandchild 1-1', value: 30 },
        { id: 'grandchild-1-2', name: 'Grandchild 1-2', value: 30 }
      ]
    },
    {
      id: 'child-2',
      name: 'Child 2',
      value: 40,
      children: [
        { id: 'grandchild-2-1', name: 'Grandchild 2-1', value: 20 },
        { id: 'grandchild-2-2', name: 'Grandchild 2-2', value: 20 }
      ]
    }
  ]
};

export const emptyDrilldownData: DrilldownData = {
  id: 'empty-root',
  name: 'Empty Root',
  value: 0
};

export const singleLevelData: DrilldownData = {
  id: 'single-root',
  name: 'Single Level',
  value: 100,
  children: [
    { id: 'item-1', name: 'Item 1', value: 25 },
    { id: 'item-2', name: 'Item 2', value: 25 },
    { id: 'item-3', name: 'Item 3', value: 25 },
    { id: 'item-4', name: 'Item 4', value: 25 }
  ]
};

export const unevenDrilldownData: DrilldownData = {
  id: 'uneven-root',
  name: 'Uneven Tree',
  value: 100,
  children: [
    {
      id: 'deep-branch',
      name: 'Deep Branch',
      value: 50,
      children: [
        {
          id: 'level-2',
          name: 'Level 2',
          value: 50,
          children: [
            {
              id: 'level-3',
              name: 'Level 3',
              value: 50,
              children: [
                { id: 'level-4', name: 'Level 4', value: 50 }
              ]
            }
          ]
        }
      ]
    },
    { id: 'shallow-branch', name: 'Shallow Branch', value: 50 }
  ]
};

export const largeDrilldownData: DrilldownData = {
  id: 'large-root',
  name: 'Large Dataset',
  value: 10000,
  children: Array.from({ length: 20 }, (_, i) => ({
    id: `category-${i}`,
    name: `Category ${i + 1}`,
    value: 500,
    children: Array.from({ length: 10 }, (_, j) => ({
      id: `category-${i}-item-${j}`,
      name: `Item ${j + 1}`,
      value: 50
    }))
  }))
};