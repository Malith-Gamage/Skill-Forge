-- Extend notifications type ENUM with session booking/confirmation/rejection events
ALTER TABLE notifications
  MODIFY COLUMN type ENUM(
    'TASK_REMINDER',
    'ACHIEVEMENT',
    'COMMUNITY',
    'SESSION_REMINDER',
    'SYSTEM',
    'SESSION_BOOKING',
    'SESSION_CONFIRMED',
    'SESSION_REJECTED'
  ) NOT NULL;
