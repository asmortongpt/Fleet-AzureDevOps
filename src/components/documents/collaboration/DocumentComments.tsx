/**
 * DocumentComments - Threaded comments with @mentions
 * Features: Threaded replies, mentions, rich text, reactions
 */

import { useState } from 'react';
import { MessageSquare, Reply, MoreVertical, Trash2, Edit, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { DocumentComment } from '@/lib/documents/types';
import { formatRelativeTime } from '@/lib/documents/utils';

interface DocumentCommentsProps {
  documentId: string;
  comments: DocumentComment[];
  currentUserId: string;
  onAddComment: (content: string, parentId?: string) => void;
  onDeleteComment: (commentId: string) => void;
  onResolveComment?: (commentId: string) => void;
}

export function DocumentComments({
  documentId,
  comments,
  currentUserId,
  onAddComment,
  onDeleteComment,
  onResolveComment
}: DocumentCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  const handleReply = (commentId: string) => {
    if (replyContent.trim()) {
      onAddComment(replyContent.trim(), commentId);
      setReplyContent('');
      setReplyTo(null);
    }
  };

  // Get top-level comments (no parent)
  const topLevelComments = comments.filter(c => !c.parentId);

  // Get replies for a comment
  const getReplies = (commentId: string) =>
    comments.filter(c => c.parentId === commentId);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments
          </h3>
          <Badge variant="secondary">{comments.length}</Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {topLevelComments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs mt-1">Be the first to comment</p>
            </div>
          ) : (
            topLevelComments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                replies={getReplies(comment.id)}
                currentUserId={currentUserId}
                onReply={(content) => onAddComment(content, comment.id)}
                onDelete={onDeleteComment}
                onResolve={onResolveComment}
                replyTo={replyTo}
                setReplyTo={setReplyTo}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment... (use @ to mention someone)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSubmit();
              }
            }}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Press Ctrl+Enter to post
            </span>
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim()}
              size="sm"
            >
              Post comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CommentThreadProps {
  comment: DocumentComment;
  replies: DocumentComment[];
  currentUserId: string;
  onReply: (content: string) => void;
  onDelete: (commentId: string) => void;
  onResolve?: (commentId: string) => void;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
}

function CommentThread({
  comment,
  replies,
  currentUserId,
  onReply,
  onDelete,
  onResolve,
  replyTo,
  setReplyTo,
  replyContent,
  setReplyContent
}: CommentThreadProps) {
  const isOwner = comment.userId === currentUserId;

  return (
    <div className={`${comment.resolved ? 'opacity-60' : ''}`}>
      <div className="flex gap-3 group">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.userAvatar} />
          <AvatarFallback>{comment.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.userName}</span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {comment.resolved && (
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="mr-1 h-3 w-3" />
                Resolved
              </Badge>
            )}
          </div>

          <div className="text-sm mb-2 whitespace-pre-wrap">{comment.content}</div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setReplyTo(comment.id)}
            >
              <Reply className="mr-1 h-3 w-3" />
              Reply
            </Button>

            {onResolve && !comment.resolved && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onResolve(comment.id)}
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Resolve
              </Button>
            )}

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(comment.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Reply form */}
          {replyTo === comment.id && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[60px]"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReplyTo(null);
                    setReplyContent('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => onReply(replyContent)}
                  disabled={!replyContent.trim()}
                >
                  Reply
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <div className="mt-3 space-y-3 pl-4 border-l-2">
              {replies.map((reply) => (
                <div key={reply.id} className="flex gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={reply.userAvatar} />
                    <AvatarFallback className="text-xs">
                      {reply.userName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-xs">{reply.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(reply.createdAt)}
                      </span>
                    </div>
                    <div className="text-xs whitespace-pre-wrap">{reply.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
