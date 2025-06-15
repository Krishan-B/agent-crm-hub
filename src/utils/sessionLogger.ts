
import { supabase } from '@/integrations/supabase/client';

export const logSession = async (userId: string, action: 'login' | 'logout') => {
  try {
    if (action === 'login') {
      await supabase
        .from('login_sessions')
        .insert({
          user_id: userId,
          login_time: new Date().toISOString(),
          ip_address: null, // Could be enhanced with actual IP detection
          user_agent: navigator.userAgent
        });
    } else {
      // Update the latest session with logout time
      const { data: sessions } = await supabase
        .from('login_sessions')
        .select('*')
        .eq('user_id', userId)
        .is('logout_time', null)
        .order('login_time', { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        const logoutTime = new Date();
        const sessionDuration = Math.floor(
          (logoutTime.getTime() - new Date(session.login_time).getTime()) / 1000
        );

        await supabase
          .from('login_sessions')
          .update({
            logout_time: logoutTime.toISOString(),
            session_duration: sessionDuration
          })
          .eq('id', session.id);
      }
    }
  } catch (error) {
    console.error('Error logging session:', error);
  }
};
