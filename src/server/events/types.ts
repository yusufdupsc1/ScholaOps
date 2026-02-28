export type DomainEventType =
  | "AttendanceMarked"
  | "AnnouncementPublished"
  | "NotificationCreated";

interface BaseDomainEvent<T extends DomainEventType, P> {
  id: string;
  type: T;
  timestamp: string;
  institutionId: string;
  payload: P;
}

export type AttendanceMarkedEvent = BaseDomainEvent<
  "AttendanceMarked",
  {
    classId: string;
    date: string;
    entriesCount: number;
    markedBy: string;
  }
>;

export type AnnouncementPublishedEvent = BaseDomainEvent<
  "AnnouncementPublished",
  {
    announcementId: string;
    title: string;
    priority: string;
    publishedBy: string;
  }
>;

export type NotificationCreatedEvent = BaseDomainEvent<
  "NotificationCreated",
  {
    channel: "attendance" | "announcement" | "finance" | "system";
    title: string;
    body: string;
    actorId: string;
    entityId?: string;
  }
>;

export type DomainEvent =
  | AttendanceMarkedEvent
  | AnnouncementPublishedEvent
  | NotificationCreatedEvent;
