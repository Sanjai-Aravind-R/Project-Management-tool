import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { members, milestones, notifications, tasks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { getWorkspaceData } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json(await getWorkspaceData(user?.id));
  } catch {
    return NextResponse.json({ error: "Could not load workspace." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in to make changes." }, { status: 401 });
    const body = await request.json();
    const lead = user.role === "lead";

    if (body.action === "createTask") {
      if (!lead) return NextResponse.json({ error: "Only the project lead can create tasks." }, { status: 403 });
      const title = String(body.title ?? "").trim();
      const dueDate = String(body.dueDate ?? "");
      const assigneeId = Number(body.assigneeId);
      if (!title || title.length > 240 || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return NextResponse.json({ error: "Enter a task title and valid deadline." }, { status: 400 });
      const [assignee] = await db.select().from(members).where(eq(members.id, assigneeId)).limit(1);
      if (!assignee) return NextResponse.json({ error: "Choose a team member." }, { status: 400 });
      const [task] = await db.insert(tasks).values({ title, description: String(body.description ?? "").slice(0, 2000), dueDate, assigneeId, category: ["Design", "Development", "Research", "Planning"].includes(body.category) ? body.category : "Design", priority: ["low", "medium", "high"].includes(body.priority) ? body.priority : "medium", status: "todo" }).returning();
      await db.insert(notifications).values({ title: "New task assigned", message: `${user.name} assigned you “${task.title}”. Due ${new Date(task.dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`, type: "assignment", recipientId: assigneeId, taskId: task.id });
    } else if (body.action === "updateTask") {
      const taskId = Number(body.taskId);
      const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
      if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
      if (!lead && task.assigneeId !== user.id) return NextResponse.json({ error: "You can only update your own tasks." }, { status: 403 });
      const nextStatus = String(body.status ?? task.status);
      if (!["todo", "in_progress", "done"].includes(nextStatus)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      const assigneeId = lead && body.assigneeId ? Number(body.assigneeId) : task.assigneeId;
      if (lead && assigneeId !== task.assigneeId) {
        const [assignee] = await db.select().from(members).where(eq(members.id, assigneeId!)).limit(1);
        if (!assignee) return NextResponse.json({ error: "Invalid assignee." }, { status: 400 });
      }
      const title = lead && typeof body.title === "string" ? body.title.trim().slice(0, 240) : task.title;
      const dueDate = lead && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate ?? "") ? String(body.dueDate) : task.dueDate;
      if (!title) return NextResponse.json({ error: "Task title is required." }, { status: 400 });
      await db.update(tasks).set({ title, dueDate, assigneeId, status: nextStatus, completedAt: nextStatus === "done" ? (task.completedAt ?? new Date()) : null, priority: lead && ["low", "medium", "high"].includes(body.priority) ? body.priority : task.priority }).where(eq(tasks.id, taskId));
      if (nextStatus === "done" && task.status !== "done") {
        const teammates = await db.select({ id: members.id }).from(members);
        await db.insert(notifications).values(teammates.map((teammate) => ({ title: "Task completed", message: `${user.name} completed “${title}”.`, type: "completion", recipientId: teammate.id, taskId })));
      }
      if (lead && assigneeId !== task.assigneeId && assigneeId) await db.insert(notifications).values({ title: "Task assigned to you", message: `${user.name} assigned you “${title}”.`, type: "assignment", recipientId: assigneeId, taskId });
    } else if (body.action === "deleteTask") {
      if (!lead) return NextResponse.json({ error: "Only the project lead can delete tasks." }, { status: 403 });
      const taskId = Number(body.taskId);
      await db.delete(notifications).where(eq(notifications.taskId, taskId));
      await db.delete(tasks).where(eq(tasks.id, taskId));
    } else if (body.action === "updateMilestone") {
      if (!lead) return NextResponse.json({ error: "Only the project lead can update the timeline." }, { status: 403 });
      const status = String(body.status);
      if (!["completed", "current", "upcoming"].includes(status)) return NextResponse.json({ error: "Invalid milestone status." }, { status: 400 });
      await db.update(milestones).set({ status }).where(eq(milestones.id, Number(body.milestoneId)));
    } else if (body.action === "readNotification") {
      const notificationId = Number(body.notificationId);
      if (Number.isInteger(notificationId)) await db.update(notifications).set({ read: true }).where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, user.id)));
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
    return NextResponse.json(await getWorkspaceData(user.id));
  } catch (error) {
    console.error("Workspace action failed", error);
    return NextResponse.json({ error: "Could not save changes. Please try again." }, { status: 500 });
  }
}
