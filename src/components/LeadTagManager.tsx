
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, X } from 'lucide-react';
import { useLeadTags, LeadTagAssignment } from '../hooks/useLeadTags';
import { useToast } from '@/hooks/use-toast';

interface LeadTagManagerProps {
  leadId: string;
}

const LeadTagManager: React.FC<LeadTagManagerProps> = ({ leadId }) => {
  const [assignedTags, setAssignedTags] = useState<LeadTagAssignment[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { tags, assignTagToLead, removeTagFromLead, getLeadTags } = useLeadTags();
  const { toast } = useToast();

  const fetchAssignedTags = async () => {
    const leadTags = await getLeadTags(leadId);
    setAssignedTags(leadTags);
  };

  const handleAssignTag = async (tagId: string) => {
    try {
      await assignTagToLead(leadId, tagId);
      await fetchAssignedTags();
      toast({
        title: "Tag Assigned",
        description: "Tag has been successfully assigned to the lead.",
      });
    } catch (error) {
      console.error('Error assigning tag:', error);
      toast({
        title: "Error",
        description: "Failed to assign tag. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await removeTagFromLead(leadId, tagId);
      await fetchAssignedTags();
      toast({
        title: "Tag Removed",
        description: "Tag has been successfully removed from the lead.",
      });
    } catch (error) {
      console.error('Error removing tag:', error);
      toast({
        title: "Error",
        description: "Failed to remove tag. Please try again.",
        variant: "destructive",
      });
    }
  };

  const assignedTagIds = assignedTags.map(at => at.tag_id);
  const availableTags = tags.filter(tag => !assignedTagIds.includes(tag.id));

  useEffect(() => {
    fetchAssignedTags();
  }, [leadId]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {assignedTags.map((assignment) => (
          <Badge
            key={assignment.id}
            className="pr-1"
            style={{
              backgroundColor: assignment.tag?.color,
              color: 'white'
            }}
          >
            {assignment.tag?.name}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1 hover:bg-white/20"
              onClick={() => handleRemoveTag(assignment.tag_id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        
        {availableTags.length > 0 && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-6">
                <Plus className="h-3 w-3 mr-1" />
                Add Tag
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">Available Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-100"
                      style={{ borderColor: tag.color }}
                      onClick={() => {
                        handleAssignTag(tag.id);
                        setIsOpen(false);
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};

export default LeadTagManager;
