import { apiClient } from "@/lib/api-client";
import { MyNotificationsResponse } from "@/types/my-notification";

export async function getMyNotificationsApi(
  params: {
    unreadOnly?: boolean;
    take?: number;
  } = {},
): Promise<MyNotificationsResponse> {
  const res = await apiClient.get<MyNotificationsResponse>(
    "/my/notifications",
    { params },
  );
  return res.data;
}

/**
 * Passing no ids marks the lab's whole inbox as read — that is what the
 * bell's "Mark all read" action does.
 */
export async function markMyNotificationsReadApi(
  notificationIds: string[] = [],
): Promise<{ updated: number }> {
  const res = await apiClient.post<{ updated: number }>(
    "/my/notifications/read",
    { notificationIds },
  );
  return res.data;
}
