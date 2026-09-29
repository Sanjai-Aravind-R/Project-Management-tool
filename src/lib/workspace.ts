import { db } from "@/db";
import { members, milestones, notifications, tasks } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

export function dateFromNow(days: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function seedWorkspace() {
  const existing = await db.select({ id: members.id }).from(members).limit(1);
  if (existing.length) return;

  const people = await db.insert(members).values([
    { name: "Olivia Rhye", email: "olivia@vertex.demo", role: "lead", title: "Project Lead", initials: "OR", color: "#d9c9bb" },
    { name: "Phoenix Baker", email: "phoenix@vertex.demo", role: "member", title: "Product Designer", initials: "PB", color: "#b9cde2" },
    { name: "Lana Steiner", email: "lana@vertex.demo", role: "member", title: "Frontend Developer", initials: "LS", color: "#e6c6c6" },
    { name: "Demi Wilkinson", email: "demi@vertex.demo", role: "member", title: "UX Researcher", initials: "DW", color: "#d5c8eb" },
    { name: "Candice Wu", email: "candice@vertex.demo", role: "member", title: "Brand Designer", initials: "CW", color: "#d4dfb8" },
  ]).returning();

  await db.insert(tasks).values([
    { title: "Discovery workshop & kickoff", category: "Planning", assigneeId: people[0].id, dueDate: dateFromNow(-27), status: "done", priority: "high", completedAt: new Date(Date.now() - 25 * 86400000) },
    { title: "Audit existing website experience", category: "Research", assigneeId: people[3].id, dueDate: dateFromNow(-22), status: "done", priority: "medium", completedAt: new Date(Date.now() - 21 * 86400000) },
    { title: "Define sitemap and user journeys", category: "Research", assigneeId: people[3].id, dueDate: dateFromNow(-18), status: "done", priority: "high", completedAt: new Date(Date.now() - 17 * 86400000) },
    { title: "Create visual moodboard", category: "Design", assigneeId: people[4].id, dueDate: dateFromNow(-16), status: "done", priority: "low", completedAt: new Date(Date.now() - 15 * 86400000) },
    { title: "Establish design system foundations", category: "Design", assigneeId: people[1].id, dueDate: dateFromNow(-13), status: "done", priority: "high", completedAt: new Date(Date.now() - 12 * 86400000) },
    { title: "Design homepage wireframes", category: "Design", assigneeId: people[1].id, dueDate: dateFromNow(-10), status: "done", priority: "medium", completedAt: new Date(Date.now() - 9 * 86400000) },
    { title: "Develop component library", category: "Development", assigneeId: people[2].id, dueDate: dateFromNow(-7), status: "done", priority: "high", completedAt: new Date(Date.now() - 5 * 86400000) },
    { title: "Review initial design concepts", category: "Design", assigneeId: people[0].id, dueDate: dateFromNow(-3), status: "done", priority: "medium", completedAt: new Date(Date.now() - 2 * 86400000) },
    { title: "Finalize high-fidelity page designs", description: "Prepare final responsive screens and handoff notes for development.", category: "Design", assigneeId: people[1].id, dueDate: dateFromNow(2), status: "in_progress", priority: "high" },
    { title: "Build responsive landing page", description: "Implement the approved landing page across desktop and mobile.", category: "Development", assigneeId: people[2].id, dueDate: dateFromNow(4), status: "in_progress", priority: "high" },
    { title: "Run usability testing sessions", description: "Test the prototype with users and summarize key findings.", category: "Research", assigneeId: people[3].id, dueDate: dateFromNow(7), status: "todo", priority: "medium" },
  ]);

  await db.insert(milestones).values([
    { title: "Discovery & research", description: "Understand goals and audience", dueDate: dateFromNow(-20), status: "completed" },
    { title: "Strategy & wireframes", description: "Structure the new experience", dueDate: dateFromNow(-9), status: "completed" },
    { title: "Visual design", description: "Bring the vision to life", dueDate: dateFromNow(3), status: "current" },
    { title: "Development", description: "Build and integrate pages", dueDate: dateFromNow(13), status: "upcoming" },
    { title: "Testing & launch", description: "Polish, test, and go live", dueDate: dateFromNow(25), status: "upcoming" },
  ]);

  await db.insert(notifications).values(people.flatMap((person) => [
    { title: "Design concepts approved", message: "Olivia completed Review initial design concepts.", type: "completion", recipientId: person.id },
    { title: "Component library complete", message: "Lana completed Develop component library.", type: "completion", recipientId: person.id },
  ]));
}

export async function getWorkspaceData(userId?: number | null) {
  await seedWorkspace();
  const [allMembers, allTasks, allMilestones, allNotifications] = await Promise.all([
    db.select().from(members).orderBy(asc(members.id)),
    db.select().from(tasks).orderBy(asc(tasks.dueDate), asc(tasks.id)),
    db.select().from(milestones).orderBy(asc(milestones.dueDate)),
    db.select().from(notifications).orderBy(desc(notifications.createdAt), desc(notifications.id)),
  ]);
  const user = allMembers.find((member) => member.id === userId) ?? null;
  const today = dateFromNow(0);
  const soon = dateFromNow(3);
  const deadlineAlerts = allTasks
    .filter((task) => task.status !== "done" && task.dueDate <= soon && (!user || user.role === "lead" || task.assigneeId === user.id))
    .map((task) => ({ id: `deadline-${task.id}`, title: task.dueDate < today ? "Task overdue" : "Deadline approaching", message: `${task.title} ${task.dueDate < today ? "was due" : "is due"} ${new Date(task.dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`, type: "deadline", read: false, createdAt: new Date().toISOString(), taskId: task.id }));
  const visibleNotifications = allNotifications.filter((item) => item.recipientId === (user?.id ?? allMembers[0]?.id));
  return {
    members: allMembers,
    tasks: allTasks,
    milestones: allMilestones,
    notifications: [...deadlineAlerts, ...visibleNotifications.map((item) => ({ ...item, id: String(item.id), createdAt: item.createdAt.toISOString() }))],
    user,
  };
}

export async function getMemberById(id: number) {
  const rows = await db.select().from(members).where(eq(members.id, id)).limit(1);
  return rows[0] ?? null;
}

export type WorkspaceData = Awaited<ReturnType<typeof getWorkspaceData>>;
