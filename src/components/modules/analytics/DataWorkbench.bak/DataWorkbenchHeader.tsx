import { Button } from "@/components/ui/button";

interface DataWorkbenchHeaderProps {
  title: string;
  onExport: () => void;
}

export function DataWorkbenchHeader({ title, onExport }: DataWorkbenchHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      <Button onClick={onExport}>Export Data</Button>
    </div>
  );
}