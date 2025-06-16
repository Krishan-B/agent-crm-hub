
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
  user_id: string;
}
