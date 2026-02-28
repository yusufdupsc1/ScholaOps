import { describe, expect, it } from "vitest";
import {
  createDomainEvent,
  getRecentDomainEvents,
  publishDomainEvent,
} from "@/server/events/publish";

describe("domain event bus", () => {
  it("publishes and retrieves institution scoped events", () => {
    const event = createDomainEvent("NotificationCreated", "inst-1", {
      channel: "system",
      title: "Test",
      body: "Test event",
      actorId: "user-1",
      entityId: "entity-1",
    });

    publishDomainEvent(event);

    const inst1 = getRecentDomainEvents("inst-1", ["NotificationCreated"]);
    const inst2 = getRecentDomainEvents("inst-2", ["NotificationCreated"]);

    expect(inst1.some((item) => item.id === event.id)).toBe(true);
    expect(inst2.some((item) => item.id === event.id)).toBe(false);
  });
});
