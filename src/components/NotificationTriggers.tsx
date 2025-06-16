
import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useEdgeFunctions } from '../hooks/useEdgeFunctions';

// This component provides utility functions for triggering notifications
// It's used throughout the app to send notifications when certain events occur

export const useNotificationTriggers = () => {
  const { createNotification } = useNotifications();
  const { executeFunction } = useEdgeFunctions();

  const triggerLeadAssignedNotification = async (agentId: string, leadId: string, leadName: string) => {
    try {
      await createNotification(
        agentId,
        'New Lead Assigned',
        `You have been assigned a new lead: ${leadName}`,
        'lead_assigned',
        'medium',
        { leadId, leadName },
        'lead',
        leadId
      );

      // Also send email notification if enabled
      await executeFunction('send-notification-email', {
        userId: agentId,
        notificationType: 'lead_assigned',
        data: { leadName, leadId }
      });
    } catch (error) {
      console.error('Failed to trigger lead assigned notification:', error);
    }
  };

  const triggerKycSubmittedNotification = async (agentId: string, leadId: string, leadName: string) => {
    try {
      await createNotification(
        agentId,
        'KYC Documents Submitted',
        `${leadName} has submitted KYC documents for review`,
        'kyc_submitted',
        'high',
        { leadId, leadName },
        'lead',
        leadId
      );

      await executeFunction('send-notification-email', {
        userId: agentId,
        notificationType: 'kyc_submitted',
        data: { leadName, leadId }
      });
    } catch (error) {
      console.error('Failed to trigger KYC submitted notification:', error);
    }
  };

  const triggerBalanceUpdatedNotification = async (agentId: string, leadId: string, leadName: string, newBalance: number) => {
    try {
      await createNotification(
        agentId,
        'Balance Updated',
        `${leadName}'s balance has been updated to $${newBalance.toLocaleString()}`,
        'balance_updated',
        'medium',
        { leadId, leadName, newBalance },
        'lead',
        leadId
      );

      await executeFunction('send-notification-email', {
        userId: agentId,
        notificationType: 'balance_updated',
        data: { leadName, leadId, newBalance }
      });
    } catch (error) {
      console.error('Failed to trigger balance updated notification:', error);
    }
  };

  const triggerAppointmentReminderNotification = async (agentId: string, appointmentId: string, appointmentTitle: string, scheduledAt: string) => {
    try {
      await createNotification(
        agentId,
        'Appointment Reminder',
        `Upcoming appointment: ${appointmentTitle}`,
        'appointment_reminder',
        'high',
        { appointmentId, appointmentTitle, scheduledAt },
        'appointment',
        appointmentId
      );

      await executeFunction('send-notification-email', {
        userId: agentId,
        notificationType: 'appointment_reminder',
        data: { appointmentTitle, appointmentId, scheduledAt }
      });
    } catch (error) {
      console.error('Failed to trigger appointment reminder notification:', error);
    }
  };

  const triggerCommunicationReceivedNotification = async (agentId: string, communicationId: string, senderName: string, subject: string) => {
    try {
      await createNotification(
        agentId,
        'New Communication',
        `New message from ${senderName}: ${subject}`,
        'communication_received',
        'medium',
        { communicationId, senderName, subject },
        'communication',
        communicationId
      );

      await executeFunction('send-notification-email', {
        userId: agentId,
        notificationType: 'communication_received',
        data: { senderName, subject, communicationId }
      });
    } catch (error) {
      console.error('Failed to trigger communication received notification:', error);
    }
  };

  const triggerSystemAlertNotification = async (userId: string, title: string, message: string, priority: string = 'medium') => {
    try {
      await createNotification(
        userId,
        title,
        message,
        'system_alert',
        priority,
        {},
        'system',
        null
      );

      await executeFunction('send-notification-email', {
        userId,
        notificationType: 'system_alert',
        data: { title, message }
      });
    } catch (error) {
      console.error('Failed to trigger system alert notification:', error);
    }
  };

  return {
    triggerLeadAssignedNotification,
    triggerKycSubmittedNotification,
    triggerBalanceUpdatedNotification,
    triggerAppointmentReminderNotification,
    triggerCommunicationReceivedNotification,
    triggerSystemAlertNotification
  };
};

// Export as a component for consistency
const NotificationTriggers: React.FC = () => {
  return null; // This is a utility component that doesn't render anything
};

export default NotificationTriggers;
