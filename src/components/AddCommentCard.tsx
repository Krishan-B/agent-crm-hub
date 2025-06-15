
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface AddCommentCardProps {
  newComment: string;
  setNewComment: (comment: string) => void;
  handleAddComment: () => void;
}

const AddCommentCard: React.FC<AddCommentCardProps> = ({ 
  newComment, 
  setNewComment, 
  handleAddComment 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Comment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button onClick={handleAddComment} className="w-full">
          Add Comment
        </Button>
      </CardContent>
    </Card>
  );
};

export default AddCommentCard;
