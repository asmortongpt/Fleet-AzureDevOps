/**
 * DocumentSharing - Share dialog with permissions
 * Features: Share with users, permission levels, link sharing
 */

import { useState } from 'react';
import { Share2, Link, Mail, Copy, Check, Globe, Lock, Eye, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DocumentMetadata, Collaborator } from '@/lib/documents/types';

interface DocumentSharingProps {
  document: DocumentMetadata;
  collaborators: Collaborator[];
  isOpen: boolean;
  onClose: () => void;
  onShare: (emails: string[], role: string) => void;
  onRemoveCollaborator: (userId: string) => void;
  onUpdateRole: (userId: string, role: string) => void;
}

export function DocumentSharing({
  document,
  collaborators,
  isOpen,
  onClose,
  onShare,
  onRemoveCollaborator,
  onUpdateRole
}: DocumentSharingProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [linkSharing, setLinkSharing] = useState(document.isShared);
  const [copied, setCopied] = useState(false);

  const shareLink = `${window.location?.origin}/documents/${document.id}`;

  const handleShare = () => {
    if (email.trim()) {
      onShare([email], role);
      setEmail('');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share "{document.name}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share with people */}
          <div className="space-y-3">
            <Label>Share with people</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleShare();
                }}
              />
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex items-center">
                      <Eye className="mr-2 h-4 w-4" />
                      Viewer
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center">
                      <Edit3 className="mr-2 h-4 w-4" />
                      Editor
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleShare} disabled={!email.trim()}>
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Collaborators list */}
          {collaborators.length > 0 && (
            <div className="space-y-2">
              <Label>People with access</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.userId}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={collaborator.userAvatar} />
                        <AvatarFallback>
                          {collaborator.userName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{collaborator.userName}</div>
                        <div className="text-xs text-muted-foreground">
                          {collaborator.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {collaborator.role === 'owner' ? (
                        <Badge variant="secondary">Owner</Badge>
                      ) : (
                        <Select
                          value={collaborator.role}
                          onValueChange={(v) => onUpdateRole(collaborator.userId, v)}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {collaborator.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveCollaborator(collaborator.userId)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Link sharing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Link sharing</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Anyone with the link can access
                </p>
              </div>
              <Switch checked={linkSharing} onCheckedChange={setLinkSharing} />
            </div>

            {linkSharing && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={shareLink} readOnly className="flex-1" />
                  <Button variant="outline" onClick={handleCopyLink}>
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  {linkSharing ? (
                    <>
                      <Globe className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-500">
                        Anyone with the link can view
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Only invited people can access</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
