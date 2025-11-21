/**
 * DocumentProperties - Metadata editor
 * Features: Edit metadata, custom fields, version history, permissions
 */

import { useState } from 'react';
import {
  FileText,
  Calendar,
  HardDrive,
  User,
  Tag,
  MapPin,
  Clock,
  Share2,
  Edit,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DocumentMetadata, FileCategory } from '@/lib/documents/types';
import { formatFileSize, formatRelativeTime } from '@/lib/documents/utils';

interface DocumentPropertiesProps {
  document: DocumentMetadata;
  onUpdate: (updates: Partial<DocumentMetadata>) => void;
  onClose: () => void;
}

export function DocumentProperties({ document, onUpdate, onClose }: DocumentPropertiesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(document.name);
  const [category, setCategory] = useState(document.category);
  const [tags, setTags] = useState(document.tags);
  const [newTag, setNewTag] = useState('');

  const handleSave = () => {
    onUpdate({ name, category, tags });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(document.name);
    setCategory(document.category);
    setTags(document.tags);
    setIsEditing(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h3 className="font-semibold">Properties</h3>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <Tabs defaultValue="details" className="p-4">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
            <TabsTrigger value="metadata" className="flex-1">Metadata</TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label>File name</Label>
                {isEditing ? (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-sm font-medium">{document.name}</p>
                )}
              </div>

              <div>
                <Label>Type</Label>
                <div className="mt-2">
                  <Badge variant="outline">{document.type}</Badge>
                </div>
              </div>

              <div>
                <Label>Category</Label>
                {isEditing ? (
                  <Select value={category} onValueChange={(v: FileCategory) => setCategory(v)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incident-reports">Incident Reports</SelectItem>
                      <SelectItem value="evidence">Evidence</SelectItem>
                      <SelectItem value="vehicle-docs">Vehicle Documents</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="contracts">Contracts</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-2">
                    <Badge variant="secondary" className="capitalize">
                      {document.category.replace(/-/g, ' ')}
                    </Badge>
                  </div>
                )}
              </div>

              <Separator />

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTag();
                        }}
                      />
                      <Button size="sm" onClick={handleAddTag} disabled={!newTag.trim()}>
                        Add
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {document.tags.length > 0 ? (
                      document.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No tags</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4 mt-4">
            <PropertyRow icon={HardDrive} label="Size" value={formatFileSize(document.size)} />
            <PropertyRow icon={FileText} label="MIME type" value={document.mimeType} />
            <PropertyRow
              icon={Calendar}
              label="Created"
              value={formatRelativeTime(document.createdAt)}
            />
            <PropertyRow
              icon={Calendar}
              label="Modified"
              value={formatRelativeTime(document.modifiedAt)}
            />
            <PropertyRow icon={User} label="Uploaded by" value={document.uploadedBy} />

            {document.dimensions && (
              <PropertyRow
                icon={FileText}
                label="Dimensions"
                value={`${document.dimensions.width} × ${document.dimensions.height}`}
              />
            )}

            {document.duration && (
              <PropertyRow
                icon={Clock}
                label="Duration"
                value={`${Math.floor(document.duration / 60)}:${(document.duration % 60).toString().padStart(2, '0')}`}
              />
            )}

            {document.pageCount && (
              <PropertyRow icon={FileText} label="Pages" value={document.pageCount.toString()} />
            )}

            {document.location && (
              <PropertyRow
                icon={MapPin}
                label="Location"
                value={`${document.location?.lat.toFixed(6)}, ${document.location?.lng.toFixed(6)}`}
              />
            )}

            <Separator />

            <PropertyRow
              icon={Share2}
              label="Sharing"
              value={document.isShared ? 'Shared' : 'Private'}
            />

            {document.sharedWith && document.sharedWith.length > 0 && (
              <PropertyRow
                icon={User}
                label="Shared with"
                value={`${document.sharedWith.length} ${document.sharedWith.length === 1 ? 'person' : 'people'}`}
              />
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-4">
            <PropertyRow icon={Clock} label="Views" value={document.viewCount.toString()} />
            <PropertyRow
              icon={Clock}
              label="Downloads"
              value={document.downloadCount.toString()}
            />
            {document.lastViewedAt && (
              <PropertyRow
                icon={Calendar}
                label="Last viewed"
                value={formatRelativeTime(document.lastViewedAt)}
              />
            )}

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-2">Version History</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">v{document.version}</Badge>
                    <span className="text-sm">Current version</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(document.modifiedAt)}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
}

function PropertyRow({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between py-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
