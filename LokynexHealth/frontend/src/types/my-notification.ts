export interface MyNotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  /** True when the message went to every lab rather than this one specifically. */
  isBroadcast: boolean;
  createdAt: string;
}

export interface MyNotificationsResponse {
  unreadCount: number;
  items: MyNotificationItem[];
}
