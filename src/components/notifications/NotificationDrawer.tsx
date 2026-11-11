import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Bell, CheckCheck, X, Clock, ExternalLink } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { notifications, refreshNotifications } = useAuth();

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      refreshNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleItemClick = async (notif: any) => {
    try {
      await api.markNotificationRead(notif.id);
      refreshNotifications();
      if (notif.link?.includes('applications')) {
        onNavigate('applicant-dashboard');
      } else if (notif.link?.includes('payments')) {
        onNavigate('applicant-dashboard');
      } else if (notif.link?.includes('support')) {
        // Chat handled
      }
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">Application Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              className={`p-3.5 rounded-lg text-xs cursor-pointer transition-colors ${
                n.isRead ? 'hover:bg-slate-50 opacity-80' : 'bg-amber-50/50 font-medium hover:bg-amber-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900">{n.title}</span>
                <time className="text-[10px] text-slate-400 font-mono tabular-nums">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px] mb-1.5">{n.message}</p>
              <span className="text-[10px] text-slate-400">
                {new Date(n.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="p-12 text-center text-xs text-slate-400">
              No notifications yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
