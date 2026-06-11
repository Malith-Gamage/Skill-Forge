'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Notification {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  reference_id: string | null;
  created_at: string;
}

type ActionMode = 'idle' | 'confirming' | 'processing' | 'done' | 'error';
interface ActionState {
  mode: ActionMode;
  meetingLink: string;
  resultMessage?: string;
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
  const ref = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(() => {
    apiFetch('/api/notifications').then(setNotifications).catch(() => {});
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30_000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unread = notifications.filter((n) => !n.is_read).length;

  function getActionState(notifId: string): ActionState {
    return actionStates[notifId] ?? { mode: 'idle', meetingLink: '' };
  }

  function setActionMode(notifId: string, patch: Partial<ActionState>) {
    setActionStates((prev) => ({
      ...prev,
      [notifId]: { ...getActionState(notifId), ...patch },
    }));
  }

  async function handleBookingAction(
    notif: Notification,
    action: 'confirm' | 'reject',
    meetingLink?: string,
  ) {
    if (!notif.reference_id) return;
    setActionMode(notif.id, { mode: 'processing' });

    try {
      const res = await fetch(`/api/expert/booking-requests/${notif.reference_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, meetingLink: meetingLink || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMode(notif.id, { mode: 'error', resultMessage: data.error ?? 'Failed' });
        return;
      }
      const msg = action === 'confirm' ? 'Booking confirmed!' : 'Booking declined.';
      setActionMode(notif.id, { mode: 'done', resultMessage: msg });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
      );
    } catch {
      setActionMode(notif.id, { mode: 'error', resultMessage: 'Network error — please try again' });
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Notifications</h3>
            {unread > 0 && (
              <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-semibold px-2 py-0.5 rounded-full">
                {unread} new
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">No notifications yet</div>
          ) : (
            <div className="max-h-104 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
              {notifications.map((n) => {
                const isBooking = n.type === 'SESSION_BOOKING';
                const as = getActionState(n.id);

                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 text-sm ${
                      n.is_read
                        ? 'text-gray-500 dark:text-gray-400'
                        : 'text-gray-800 dark:text-gray-100 bg-blue-50/40 dark:bg-blue-900/10 font-medium'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      {isBooking && (
                        <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                          <svg className="w-3 h-3 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                          </svg>
                        </span>
                      )}
                      <p className="leading-snug">{n.message}</p>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                      {new Date(n.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </p>

                    {isBooking && (
                      <div className="mt-1">
                        {as.mode === 'idle' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setActionMode(n.id, { mode: 'confirming' })}
                              className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleBookingAction(n, 'reject')}
                              className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-700 transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        )}

                        {as.mode === 'confirming' && (
                          <div className="space-y-2">
                            <input
                              type="url"
                              value={as.meetingLink}
                              onChange={(e) => setActionMode(n.id, { meetingLink: e.target.value })}
                              placeholder="Meeting link (optional)"
                              className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleBookingAction(n, 'confirm', as.meetingLink)}
                                className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                              >
                                Confirm booking
                              </button>
                              <button
                                onClick={() => setActionMode(n.id, { mode: 'idle' })}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              >
                                Back
                              </button>
                            </div>
                          </div>
                        )}

                        {as.mode === 'processing' && (
                          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Processing…
                          </div>
                        )}

                        {as.mode === 'done' && (
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                            {as.resultMessage}
                          </p>
                        )}

                        {as.mode === 'error' && (
                          <div className="space-y-1.5">
                            <p className="text-xs text-red-600 dark:text-red-400">{as.resultMessage}</p>
                            <button
                              onClick={() => setActionMode(n.id, { mode: 'idle' })}
                              className="text-xs text-indigo-600 dark:text-indigo-400 underline"
                            >
                              Try again
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
