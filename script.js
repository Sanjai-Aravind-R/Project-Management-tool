// Vertex Project Management Workspace - Static Application Engine
(function() {
  'use strict';

  // Date helper functions
  function dateFromNow(days) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function dateLabel(value, options) {
    if (!value) return '';
    const date = new Date(value + 'T12:00:00');
    return date.toLocaleDateString('en-US', options || { month: 'short', day: 'numeric' });
  }

  // Initial Seed Data
  const INITIAL_MEMBERS = [
    { id: 1, name: "Olivia Rhye", email: "olivia@vertex.demo", role: "lead", title: "Project Lead", initials: "OR", color: "#d9c9bb" },
    { id: 2, name: "Phoenix Baker", email: "phoenix@vertex.demo", role: "member", title: "Product Designer", initials: "PB", color: "#b9cde2" },
    { id: 3, name: "Lana Steiner", email: "lana@vertex.demo", role: "member", title: "Frontend Developer", initials: "LS", color: "#e6c6c6" },
    { id: 4, name: "Demi Wilkinson", email: "demi@vertex.demo", role: "member", title: "UX Researcher", initials: "DW", color: "#d5c8eb" },
    { id: 5, name: "Candice Wu", email: "candice@vertex.demo", role: "member", title: "Brand Designer", initials: "CW", color: "#d4dfb8" }
  ];

  const INITIAL_TASKS = [
    { id: 1, title: "Discovery workshop & kickoff", description: "Align stakeholders on project scope and key objectives.", category: "Planning", assigneeId: 1, dueDate: dateFromNow(-27), status: "done", priority: "high", completedAt: dateFromNow(-25) },
    { id: 2, title: "Audit existing website experience", description: "Identify friction points and drop-offs across current user flows.", category: "Research", assigneeId: 4, dueDate: dateFromNow(-22), status: "done", priority: "medium", completedAt: dateFromNow(-21) },
    { id: 3, title: "Define sitemap and user journeys", description: "Map out clear information architecture and navigation paths.", category: "Research", assigneeId: 4, dueDate: dateFromNow(-18), status: "done", priority: "high", completedAt: dateFromNow(-17) },
    { id: 4, title: "Create visual moodboard", description: "Gather inspiration for typography, color palettes, and imagery.", category: "Design", assigneeId: 5, dueDate: dateFromNow(-16), status: "done", priority: "low", completedAt: dateFromNow(-15) },
    { id: 5, title: "Establish design system foundations", description: "Define atomic design tokens, grid styles, and basic component specs.", category: "Design", assigneeId: 2, dueDate: dateFromNow(-13), status: "done", priority: "high", completedAt: dateFromNow(-12) },
    { id: 6, title: "Design homepage wireframes", description: "Structure key homepage sections and hero messaging.", category: "Design", assigneeId: 2, dueDate: dateFromNow(-10), status: "done", priority: "medium", completedAt: dateFromNow(-9) },
    { id: 7, title: "Develop component library", description: "Code responsive foundational UI widgets in Tailwind CSS.", category: "Development", assigneeId: 3, dueDate: dateFromNow(-7), status: "done", priority: "high", completedAt: dateFromNow(-5) },
    { id: 8, title: "Review initial design concepts", description: "Gather stakeholder feedback on layout and visual hierarchy.", category: "Design", assigneeId: 1, dueDate: dateFromNow(-3), status: "done", priority: "medium", completedAt: dateFromNow(-2) },
    { id: 9, title: "Finalize high-fidelity page designs", description: "Prepare final responsive screens and handoff notes for development.", category: "Design", assigneeId: 2, dueDate: dateFromNow(2), status: "in_progress", priority: "high" },
    { id: 10, title: "Build responsive landing page", description: "Implement the approved landing page across desktop and mobile.", category: "Development", assigneeId: 3, dueDate: dateFromNow(4), status: "in_progress", priority: "high" },
    { id: 11, title: "Run usability testing sessions", description: "Test the prototype with users and summarize key findings.", category: "Research", assigneeId: 4, dueDate: dateFromNow(7), status: "todo", priority: "medium" }
  ];

  const INITIAL_MILESTONES = [
    { id: 1, title: "Discovery & research", description: "Understand goals and audience", dueDate: dateFromNow(-20), status: "completed" },
    { id: 2, title: "Strategy & wireframes", description: "Structure the new experience", dueDate: dateFromNow(-9), status: "completed" },
    { id: 3, title: "Visual design", description: "Bring the vision to life", dueDate: dateFromNow(3), status: "current" },
    { id: 4, title: "Development", description: "Build and integrate pages", dueDate: dateFromNow(13), status: "upcoming" },
    { id: 5, title: "Testing & launch", description: "Polish, test, and go live", dueDate: dateFromNow(25), status: "upcoming" }
  ];

  const INITIAL_NOTICES = [
    { id: "notice-1", title: "Design concepts approved", message: "Olivia completed Review initial design concepts.", type: "completion", recipientId: 1, taskId: 8, read: false, createdAt: new Date().toISOString() },
    { id: "notice-2", title: "Component library complete", message: "Lana completed Develop component library.", type: "completion", recipientId: 1, taskId: 7, read: false, createdAt: new Date().toISOString() }
  ];

  const STORAGE_KEY = "vertex_workspace_store_v1";

  // Application State
  const state = {
    members: INITIAL_MEMBERS,
    tasks: INITIAL_TASKS,
    milestones: INITIAL_MILESTONES,
    notifications: INITIAL_NOTICES,
    user: INITIAL_MEMBERS[0], // Olivia Rhye (Lead)
    section: "Overview",
    search: "",
    taskFilter: "All tasks",
    selectedTaskId: null,
    hiddenNoticeIds: [],
    toastTimeout: null
  };

  // Safe icons initializer
  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // Local Storage Persistence
  function loadPersistedState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.tasks && parsed.tasks.length) state.tasks = parsed.tasks;
        if (parsed.milestones && parsed.milestones.length) state.milestones = parsed.milestones;
        if (parsed.notifications) state.notifications = parsed.notifications;
        if (parsed.user !== undefined) state.user = parsed.user;
        if (parsed.hiddenNoticeIds) state.hiddenNoticeIds = parsed.hiddenNoticeIds;
      }
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    }
  }

  function savePersistedState() {
    try {
      const toSave = {
        tasks: state.tasks,
        milestones: state.milestones,
        notifications: state.notifications,
        user: state.user,
        hiddenNoticeIds: state.hiddenNoticeIds
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }

  // Toast Notification System
  function showToast(message) {
    const toast = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.style.display = 'flex';
    refreshIcons();

    if (state.toastTimeout) clearTimeout(state.toastTimeout);
    state.toastTimeout = setTimeout(() => {
      toast.style.display = 'none';
    }, 3500);
  }

  // Notification Generator (Dynamic Deadlines)
  function getComputedNotifications() {
    const today = todayStr();
    const soon = dateFromNow(3);
    const deadlineAlerts = state.tasks
      .filter(task => task.status !== "done" && task.dueDate <= soon && (!state.user || state.user.role === "lead" || task.assigneeId === state.user.id))
      .map(task => {
        const isOverdue = task.dueDate < today;
        return {
          id: `deadline-${task.id}`,
          title: isOverdue ? "Task overdue" : "Deadline approaching",
          message: `${task.title} ${isOverdue ? "was due" : "is due"} ${dateLabel(task.dueDate)}.`,
          type: "deadline",
          read: state.hiddenNoticeIds.includes(`deadline-${task.id}`),
          createdAt: new Date().toISOString(),
          taskId: task.id
        };
      });

    const userNotices = state.notifications.filter(n => !n.recipientId || !state.user || n.recipientId === state.user.id);
    return [...deadlineAlerts, ...userNotices];
  }

  // Switch Active Section
  function navigateTo(section) {
    state.section = section;
    state.search = "";
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = "";
    state.taskFilter = "All tasks";

    // Close mobile nav
    const sidebar = document.getElementById('sidebar');
    const scrim = document.getElementById('mobileScrim');
    if (sidebar) sidebar.classList.remove('sidebar-open');
    if (scrim) scrim.style.display = 'none';

    render();
  }

  // Render Functions
  function renderNav() {
    const sideNav = document.getElementById('sideNav');
    if (sideNav) {
      const buttons = sideNav.querySelectorAll('.nav-item');
      buttons.forEach(btn => {
        const sec = btn.getAttribute('data-section');
        btn.classList.toggle('active', sec === state.section);
      });
    }

    // Unread count
    const allNotices = getComputedNotifications();
    const unread = allNotices.filter(n => !n.read).length;

    const navBadge = document.getElementById('sideNavInboxBadge');
    if (navBadge) {
      navBadge.textContent = unread;
      navBadge.style.display = unread > 0 ? 'inline-block' : 'none';
    }

    const pip = document.getElementById('notificationPip');
    if (pip) {
      pip.style.display = unread > 0 ? 'block' : 'none';
    }

    const popoverUnread = document.getElementById('popoverUnreadCount');
    if (popoverUnread) popoverUnread.textContent = `${unread} new`;

    const inboxUnread = document.getElementById('inboxUnreadBadge');
    if (inboxUnread) inboxUnread.textContent = `${unread} unread`;

    // Sidebar User
    const userName = document.getElementById('sidebarUserName');
    const userRole = document.getElementById('sidebarUserRole');
    const userAvatar = document.getElementById('sidebarUserAvatar');
    const topAvatar = document.getElementById('topAvatar');
    const actionIcon = document.getElementById('sidebarUserActionIcon');
    const adminAccessBtn = document.getElementById('adminAccessBtn');

    if (state.user) {
      if (userName) userName.textContent = state.user.name;
      if (userRole) userRole.textContent = state.user.title;
      if (userAvatar) {
        userAvatar.textContent = state.user.initials;
        userAvatar.style.background = state.user.color;
      }
      if (topAvatar) {
        topAvatar.textContent = state.user.initials;
        topAvatar.style.background = state.user.color;
      }
      if (actionIcon) actionIcon.setAttribute('data-lucide', 'log-out');
      if (adminAccessBtn) adminAccessBtn.style.display = 'none';
    } else {
      if (userName) userName.textContent = "Guest preview";
      if (userRole) userRole.textContent = "Sign in to collaborate";
      if (userAvatar) {
        userAvatar.textContent = "?";
        userAvatar.style.background = "#e8e9ee";
      }
      if (topAvatar) {
        topAvatar.textContent = "?";
        topAvatar.style.background = "#e8e9ee";
      }
      if (actionIcon) actionIcon.setAttribute('data-lucide', 'chevron-right');
      if (adminAccessBtn) adminAccessBtn.style.display = 'inline-flex';
    }
  }

  function renderPageHeader() {
    const title = document.getElementById('pageTitle');
    const desc = document.getElementById('pageDescription');

    const meta = {
      "Overview": {
        title: "Project overview",
        desc: "Here’s what’s happening with your project today."
      },
      "My Tasks": {
        title: "My Tasks",
        desc: "Keep work organized and moving forward."
      },
      "Timeline": {
        title: "Timeline",
        desc: "A clear path from first idea to final launch."
      },
      "Team": {
        title: "Team",
        desc: "The people bringing this project to life."
      },
      "Inbox": {
        title: "Activity & alerts",
        desc: "Stay on top of the latest project updates."
      }
    };

    const current = meta[state.section] || meta["Overview"];
    if (title) title.textContent = current.title;
    if (desc) desc.textContent = current.desc;

    // Toggle Section visibility
    const sections = {
      "Overview": document.getElementById('sectionOverview'),
      "My Tasks": document.getElementById('sectionTasks'),
      "Timeline": document.getElementById('sectionTimeline'),
      "Team": document.getElementById('sectionTeam'),
      "Inbox": document.getElementById('sectionInbox')
    };

    Object.keys(sections).forEach(secKey => {
      const el = sections[secKey];
      if (el) el.style.display = (secKey === state.section) ? 'block' : 'none';
    });
  }

  function renderOverview() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.status === "done").length;
    const inProgress = state.tasks.filter(t => t.status === "in_progress").length;
    const progress = total ? Math.round((completed / total) * 100) : 0;
    const today = todayStr();
    const soon = dateFromNow(3);
    const dueSoon = state.tasks.filter(t => t.status !== "done" && t.dueDate <= soon).length;

    // Hero Section
    const heroProgressPercent = document.getElementById('heroProgressPercent');
    const heroProgressBar = document.getElementById('heroProgressBar');
    if (heroProgressPercent) heroProgressPercent.textContent = `${progress}%`;
    if (heroProgressBar) heroProgressBar.style.width = `${progress}%`;

    const chartProgressPercent = document.getElementById('chartProgressPercent');
    if (chartProgressPercent) chartProgressPercent.textContent = `${progress}%`;

    // Date range
    const firstMilestone = state.milestones[0];
    const lastMilestone = state.milestones[state.milestones.length - 1];
    const heroDateRange = document.getElementById('heroDateRange');
    if (heroDateRange && firstMilestone && lastMilestone) {
      heroDateRange.innerHTML = `<i data-lucide="calendar-days" style="width: 15px; height: 15px;"></i> ${dateLabel(firstMilestone.dueDate)} – ${dateLabel(lastMilestone.dueDate, { month: "short", day: "numeric", year: "numeric" })}`;
    }

    // Avatar stack
    const heroAvatarStack = document.getElementById('heroAvatarStack');
    if (heroAvatarStack) {
      const visibleMembers = state.members.slice(0, 4);
      const moreCount = Math.max(0, state.members.length - 4);
      heroAvatarStack.innerHTML = visibleMembers.map(m => `
        <span class="avatar avatar-small" style="background:${m.color}" title="${m.name}">${m.initials}</span>
      `).join('') + (moreCount > 0 ? `<span class="avatar-more">+${moreCount}</span>` : '');
    }

    // Stats Grid
    const statTotal = document.getElementById('statTotalTasks');
    const statCompleted = document.getElementById('statCompletedTasks');
    const statCompletedTrend = document.getElementById('statCompletedTrend');
    const statInProgress = document.getElementById('statInProgressTasks');
    const statDueSoon = document.getElementById('statDueSoonTasks');

    if (statTotal) statTotal.textContent = String(total).padStart(2, '0');
    if (statCompleted) statCompleted.textContent = String(completed).padStart(2, '0');
    if (statCompletedTrend) {
      statCompletedTrend.innerHTML = `<i data-lucide="arrow-up-right" style="width: 13px; height: 13px;"></i> ${progress}%`;
    }
    if (statInProgress) statInProgress.textContent = String(inProgress).padStart(2, '0');
    if (statDueSoon) statDueSoon.textContent = String(dueSoon).padStart(2, '0');

    // Upcoming Tasks
    const activeTasks = state.tasks.filter(t => t.status !== "done");
    const upcomingList = document.getElementById('upcomingTasksList');
    if (upcomingList) {
      if (activeTasks.length === 0) {
        upcomingList.innerHTML = `<div class="empty-inline">All caught up! Every task is complete.</div>`;
      } else {
        upcomingList.innerHTML = activeTasks.slice(0, 3).map(task => {
          const assignee = state.members.find(m => m.id === task.assigneeId);
          const isWorking = task.status === "in_progress";
          return `
            <button class="upcoming-row" data-task-id="${task.id}">
              <span class="task-check ${isWorking ? 'working' : ''}">
                ${isWorking ? '<span></span>' : ''}
              </span>
              <span class="upcoming-info">
                <strong>${task.title}</strong>
                <small>
                  <span class="category-dot ${(task.category || 'design').toLowerCase()}"></span>
                  ${task.category} <span class="middle-dot">·</span> Due ${dateLabel(task.dueDate)}
                </small>
              </span>
              <span class="avatar avatar-small" style="background:${assignee?.color || '#e8e9ee'}" title="${assignee?.name || 'Unassigned'}">
                ${assignee?.initials || '?'}
              </span>
              <i data-lucide="chevron-right" class="row-chevron" style="width: 17px; height: 17px;"></i>
            </button>
          `;
        }).join('');

        upcomingList.querySelectorAll('.upcoming-row').forEach(row => {
          row.addEventListener('click', () => {
            const id = Number(row.getAttribute('data-task-id'));
            openTaskDetail(id);
          });
        });
      }
    }

    // Timeline Preview
    const timelineList = document.getElementById('overviewTimelineList');
    if (timelineList) {
      timelineList.innerHTML = state.milestones.map((milestone, idx) => {
        const isDone = milestone.status === "completed";
        const isLast = idx === state.milestones.length - 1;
        return `
          <div class="timeline-item">
            <div class="timeline-rail">
              <span class="timeline-node ${milestone.status}">
                ${isDone ? '<i data-lucide="check" style="width: 11px; height: 11px; stroke-width: 3;"></i>' : ''}
              </span>
              ${!isLast ? `<span class="timeline-line ${isDone ? 'filled' : ''}"></span>` : ''}
            </div>
            <div class="timeline-body">
              <div>
                <strong>${milestone.title}</strong>
                <span>${dateLabel(milestone.dueDate)}</span>
              </div>
              <p>${milestone.description}</p>
            </div>
          </div>
        `;
      }).join('');
    }

    // Team Contribution
    const contribList = document.getElementById('overviewContributionList');
    if (contribList) {
      contribList.innerHTML = state.members.slice(0, 4).map(member => {
        const assigned = state.tasks.filter(t => t.assigneeId === member.id);
        const done = assigned.filter(t => t.status === "done").length;
        const pct = assigned.length ? Math.round((done / assigned.length) * 100) : 0;
        return `
          <div class="contribution-row">
            <span class="avatar avatar-small" style="background:${member.color}" title="${member.name}">${member.initials}</span>
            <span class="contribution-name">
              ${member.name.split(' ')[0]}
              <small>${done}/${assigned.length} tasks</small>
            </span>
            <div class="mini-progress">
              <span style="width: ${pct}%"></span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  function renderTasks() {
    const isLead = state.user?.role === "lead";
    const searchLower = state.search.toLowerCase().trim();

    const filtered = state.tasks.filter(task => {
      const assignee = state.members.find(m => m.id === task.assigneeId);
      const matchesSearch = !searchLower ||
        task.title.toLowerCase().includes(searchLower) ||
        (task.category && task.category.toLowerCase().includes(searchLower)) ||
        (assignee && assignee.name.toLowerCase().includes(searchLower));

      const matchesUser = !state.user || isLead || (task.assigneeId === state.user.id);
      return matchesSearch && matchesUser;
    });

    const visibleTasks = filtered.filter(task => {
      if (state.taskFilter === "All tasks") return true;
      if (state.taskFilter === "In progress") return task.status === "in_progress";
      if (state.taskFilter === "To do") return task.status === "todo";
      if (state.taskFilter === "Completed") return task.status === "done";
      return true;
    });

    const subtitle = document.getElementById('tasksCountSubtitle');
    if (subtitle) subtitle.textContent = `${state.tasks.length} tasks across your project`;

    const tableBody = document.getElementById('taskTableBody');
    if (tableBody) {
      if (visibleTasks.length === 0) {
        tableBody.innerHTML = `<div class="empty-state">No tasks match your search or filter.</div>`;
      } else {
        const today = todayStr();
        const statusMap = { todo: "To do", in_progress: "In progress", done: "Completed" };

        tableBody.innerHTML = visibleTasks.map(task => {
          const assignee = state.members.find(m => m.id === task.assigneeId);
          const isDone = task.status === "done";
          const isOverdue = task.dueDate < today && !isDone;

          return `
            <button class="task-table-row" data-task-id="${task.id}">
              <span class="task-title-cell">
                <span class="task-check ${isDone ? 'complete' : ''}">
                  ${isDone ? '<i data-lucide="check" style="width: 12px; height: 12px;"></i>' : ''}
                </span>
                <span>
                  <strong>${task.title}</strong>
                  <small>${task.category} · ${task.priority} priority</small>
                </span>
              </span>
              <span class="task-assignee">
                <span class="avatar avatar-small" style="background:${assignee?.color || '#e8e9ee'}">
                  ${assignee?.initials || '?'}
                </span>
                ${assignee?.name || 'Unassigned'}
              </span>
              <span class="${isOverdue ? 'overdue' : ''}">
                ${dateLabel(task.dueDate, { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span>
                <span class="table-status ${task.status}">${statusMap[task.status]}</span>
              </span>
            </button>
          `;
        }).join('');

        tableBody.querySelectorAll('.task-table-row').forEach(row => {
          row.addEventListener('click', () => {
            const id = Number(row.getAttribute('data-task-id'));
            openTaskDetail(id);
          });
        });
      }
    }
  }

  function renderTimeline() {
    const total = state.milestones.length;
    const completed = state.milestones.filter(m => m.status === "completed").length;

    const reachedCount = document.getElementById('milestonesReachedCount');
    if (reachedCount) reachedCount.textContent = `${completed}/${total}`;

    const list = document.getElementById('fullMilestoneList');
    if (list) {
      const isLead = state.user?.role === "lead";

      list.innerHTML = state.milestones.map((m, idx) => {
        const isDone = m.status === "completed";
        const isCurrent = m.status === "current";
        const statusDisplay = isCurrent ? "In progress" : (isDone ? "Completed" : "Upcoming");

        return `
          <div class="milestone-row" data-milestone-id="${m.id}">
            <div class="milestone-index">${String(idx + 1).padStart(2, '0')}</div>
            <span class="milestone-check ${m.status}">
              ${isDone ? '<i data-lucide="check" style="width: 18px; height: 18px;"></i>' : (isCurrent ? '<i data-lucide="circle" style="width: 13px; height: 13px;" fill="currentColor"></i>' : '<i data-lucide="circle" style="width: 16px; height: 16px;"></i>')}
            </span>
            <div class="milestone-details">
              <strong>${m.title}</strong>
              <p>${m.description}</p>
            </div>
            <span class="milestone-date">
              <i data-lucide="calendar-days" style="width: 15px; height: 15px;"></i>
              ${dateLabel(m.dueDate, { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span class="table-status milestone-status ${m.status}">${statusDisplay}</span>
            ${isLead ? `
              <select class="milestone-select" data-id="${m.id}" aria-label="Change ${m.title} status">
                <option value="upcoming" ${m.status === 'upcoming' ? 'selected' : ''}>Upcoming</option>
                <option value="current" ${m.status === 'current' ? 'selected' : ''}>In progress</option>
                <option value="completed" ${m.status === 'completed' ? 'selected' : ''}>Completed</option>
              </select>
            ` : ''}
          </div>
        `;
      }).join('');

      list.querySelectorAll('.milestone-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const id = Number(e.target.getAttribute('data-id'));
          const newStatus = e.target.value;
          const milestone = state.milestones.find(m => m.id === id);
          if (milestone) {
            milestone.status = newStatus;
            savePersistedState();
            render();
            showToast("Milestone status updated.");
          }
        });
      });
    }
  }

  function renderTeam() {
    const totalMembers = state.members.length;
    const completedTasks = state.tasks.filter(t => t.status === "done").length;
    const progress = state.tasks.length ? Math.round((completedTasks / state.tasks.length) * 100) : 0;

    const summaryMembers = document.getElementById('teamSummaryMembersCount');
    const summaryCompleted = document.getElementById('teamSummaryCompletedTasks');
    const summaryProgress = document.getElementById('teamSummaryProgressPercent');

    if (summaryMembers) summaryMembers.textContent = totalMembers;
    if (summaryCompleted) summaryCompleted.textContent = completedTasks;
    if (summaryProgress) summaryProgress.textContent = `${progress}%`;

    const grid = document.getElementById('teamMemberGrid');
    if (grid) {
      grid.innerHTML = state.members.map(member => {
        const assigned = state.tasks.filter(t => t.assigneeId === member.id);
        const done = assigned.filter(t => t.status === "done").length;
        const pct = assigned.length ? Math.round((done / assigned.length) * 100) : 0;

        return `
          <div class="member-card">
            <div class="member-top">
              <span class="avatar avatar-large" style="background:${member.color}">${member.initials}</span>
              ${member.role === 'lead' ? `
                <span class="lead-badge">
                  <i data-lucide="shield-check" style="width: 12px; height: 12px;"></i> Project lead
                </span>
              ` : ''}
            </div>
            <h3>${member.name}</h3>
            <p>${member.title}</p>
            <div class="member-stats">
              <span><strong>${assigned.length}</strong> assigned</span>
              <span><strong>${done}</strong> completed</span>
            </div>
            <div class="member-progress">
              <span style="width: ${pct}%"></span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  function renderInbox() {
    const notices = getComputedNotifications();
    const inboxList = document.getElementById('inboxList');
    if (!inboxList) return;

    if (notices.length === 0) {
      inboxList.innerHTML = `<div class="empty-state">You're all caught up. No updates yet.</div>`;
    } else {
      inboxList.innerHTML = notices.map(notice => {
        const isRead = notice.read || state.hiddenNoticeIds.includes(notice.id);
        const iconName = notice.type === "completion" ? "check-circle-2" : (notice.type === "deadline" ? "clock-3" : "bell");

        return `
          <button class="inbox-row ${isRead ? 'read' : ''}" data-notice-id="${notice.id}">
            <span class="inbox-icon ${notice.type}">
              <i data-lucide="${iconName}" style="width: 20px; height: 20px;"></i>
            </span>
            <span>
              <strong>${notice.title}</strong>
              <small>${notice.message}</small>
            </span>
            <span class="inbox-time">${notice.type === "deadline" ? "Upcoming" : "Team update"}</span>
            ${!isRead ? '<i></i>' : ''}
          </button>
        `;
      }).join('');

      inboxList.querySelectorAll('.inbox-row').forEach(row => {
        row.addEventListener('click', () => {
          const id = row.getAttribute('data-notice-id');
          handleNoticeClick(id);
        });
      });
    }
  }

  function renderNotificationPopover() {
    const notices = getComputedNotifications();
    const list = document.getElementById('popoverNoticeList');
    if (!list) return;

    list.innerHTML = notices.slice(0, 5).map(notice => {
      const isRead = notice.read || state.hiddenNoticeIds.includes(notice.id);
      return `
        <button class="popover-notice ${isRead ? 'is-read' : ''}" data-notice-id="${notice.id}">
          <span class="notice-icon ${notice.type}">
            <i data-lucide="bell" style="width: 15px; height: 15px;"></i>
          </span>
          <span>
            <strong>${notice.title}</strong>
            <small>${notice.message}</small>
          </span>
        </button>
      `;
    }).join('');

    list.querySelectorAll('.popover-notice').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-notice-id');
        handleNoticeClick(id);
        const popover = document.getElementById('notificationPopover');
        if (popover) popover.style.display = 'none';
      });
    });
  }

  function handleNoticeClick(noticeId) {
    if (noticeId.startsWith("deadline-")) {
      if (!state.hiddenNoticeIds.includes(noticeId)) {
        state.hiddenNoticeIds.push(noticeId);
      }
    } else {
      const notice = state.notifications.find(n => n.id === noticeId);
      if (notice) notice.read = true;
    }

    savePersistedState();
    render();

    // If related to task, open task modal
    const notices = getComputedNotifications();
    const targetNotice = notices.find(n => n.id === noticeId);
    if (targetNotice && targetNotice.taskId) {
      openTaskDetail(targetNotice.taskId);
    }
  }

  function render() {
    renderNav();
    renderPageHeader();

    if (state.section === "Overview") renderOverview();
    else if (state.section === "My Tasks") renderTasks();
    else if (state.section === "Timeline") renderTimeline();
    else if (state.section === "Team") renderTeam();
    else if (state.section === "Inbox") renderInbox();

    renderNotificationPopover();
    refreshIcons();
  }

  // Modals Management
  function openAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'flex';
  }

  function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
  }

  function openNewTaskModal() {
    if (!state.user) {
      openAuthModal();
      return;
    }
    if (state.user.role !== "lead") {
      showToast("Only the project lead can create tasks.");
      return;
    }

    const select = document.getElementById('newTaskAssignee');
    if (select) {
      select.innerHTML = state.members.map(m => `
        <option value="${m.id}" ${m.id === 2 ? 'selected' : ''}>${m.name}</option>
      `).join('');
    }

    const dueInput = document.getElementById('newTaskDueDate');
    if (dueInput) dueInput.value = dateFromNow(7);

    const titleInput = document.getElementById('newTaskTitle');
    const descInput = document.getElementById('newTaskDescription');
    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';

    const modal = document.getElementById('newTaskModal');
    if (modal) modal.style.display = 'flex';
    refreshIcons();
  }

  function closeNewTaskModal() {
    const modal = document.getElementById('newTaskModal');
    if (modal) modal.style.display = 'none';
  }

  function openTaskDetail(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    state.selectedTaskId = taskId;
    const isLead = state.user?.role === "lead";
    const isAssignee = state.user && task.assigneeId === state.user.id;

    const modal = document.getElementById('taskDetailModal');
    const title = document.getElementById('taskDetailTitle');
    const desc = document.getElementById('taskDetailDescription');
    const catDot = document.getElementById('taskDetailCategoryDot');
    const catText = document.getElementById('taskDetailCategoryText');
    const idText = document.getElementById('taskDetailIdText');

    const editId = document.getElementById('editTaskId');
    const editTitle = document.getElementById('editTaskTitle');
    const editAssignee = document.getElementById('editTaskAssignee');
    const editDueDate = document.getElementById('editTaskDueDate');
    const editStatus = document.getElementById('editTaskStatus');
    const editPriority = document.getElementById('editTaskPriority');
    const deleteBtn = document.getElementById('deleteTaskBtn');
    const saveBtn = document.getElementById('saveTaskBtn');

    if (editId) editId.value = task.id;
    if (title) title.textContent = task.title;
    if (desc) desc.textContent = task.description || "Manage the details and keep your team up to date.";
    if (catDot) catDot.className = `category-dot ${(task.category || 'design').toLowerCase()}`;
    if (catText) catText.textContent = task.category || "General";
    if (idText) idText.textContent = `Task #${task.id}`;

    if (editTitle) {
      editTitle.value = task.title;
      editTitle.disabled = !isLead;
    }

    if (editAssignee) {
      editAssignee.innerHTML = state.members.map(m => `
        <option value="${m.id}" ${m.id === task.assigneeId ? 'selected' : ''}>${m.name}</option>
      `).join('');
      editAssignee.disabled = !isLead;
    }

    if (editDueDate) {
      editDueDate.value = task.dueDate;
      editDueDate.disabled = !isLead;
    }

    if (editStatus) {
      editStatus.value = task.status;
      editStatus.disabled = !state.user || (!isLead && !isAssignee);
    }

    if (editPriority) {
      editPriority.value = task.priority;
      editPriority.disabled = !isLead;
    }

    if (deleteBtn) {
      deleteBtn.style.display = isLead ? 'inline-flex' : 'none';
    }

    if (saveBtn) {
      if (!state.user) {
        saveBtn.textContent = "Sign in to edit";
        saveBtn.disabled = false;
      } else if (isLead || isAssignee) {
        saveBtn.textContent = "Save changes";
        saveBtn.disabled = false;
      } else {
        saveBtn.textContent = "View only";
        saveBtn.disabled = true;
      }
    }

    if (modal) modal.style.display = 'flex';
    refreshIcons();
  }

  function closeTaskDetailModal() {
    const modal = document.getElementById('taskDetailModal');
    if (modal) modal.style.display = 'none';
    state.selectedTaskId = null;
  }

  // Setup Event Listeners
  function initEvents() {
    // Current year in footer
    const currentYear = document.getElementById('currentYear');
    if (currentYear) currentYear.textContent = new Date().getFullYear();

    // Side Navigation
    const sideNav = document.getElementById('sideNav');
    if (sideNav) {
      sideNav.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const sec = btn.getAttribute('data-section');
          if (sec) navigateTo(sec);
        });
      });
    }

    // Projects nav button
    document.querySelectorAll('.project-nav').forEach(btn => {
      btn.addEventListener('click', () => navigateTo('Overview'));
    });

    // New task trigger buttons
    const sidebarNewTaskBtn = document.getElementById('sidebarNewTaskBtn');
    if (sidebarNewTaskBtn) sidebarNewTaskBtn.addEventListener('click', openNewTaskModal);

    const newTaskBtn = document.getElementById('newTaskBtn');
    if (newTaskBtn) newTaskBtn.addEventListener('click', openNewTaskModal);

    const tasksAddBtn = document.getElementById('tasksAddBtn');
    if (tasksAddBtn) tasksAddBtn.addEventListener('click', openNewTaskModal);

    // Timeline view triggers
    const viewTimelineHelpBtn = document.getElementById('viewTimelineHelpBtn');
    if (viewTimelineHelpBtn) viewTimelineHelpBtn.addEventListener('click', () => navigateTo('Timeline'));

    const overviewTimelineDotsBtn = document.getElementById('overviewTimelineDotsBtn');
    if (overviewTimelineDotsBtn) overviewTimelineDotsBtn.addEventListener('click', () => navigateTo('Timeline'));

    const overviewTimelineBottomBtn = document.getElementById('overviewTimelineBottomBtn');
    if (overviewTimelineBottomBtn) overviewTimelineBottomBtn.addEventListener('click', () => navigateTo('Timeline'));

    // Team view triggers
    const heroViewTeamBtn = document.getElementById('heroViewTeamBtn');
    if (heroViewTeamBtn) heroViewTeamBtn.addEventListener('click', () => navigateTo('Team'));

    const overviewTeamViewBtn = document.getElementById('overviewTeamViewBtn');
    if (overviewTeamViewBtn) overviewTeamViewBtn.addEventListener('click', () => navigateTo('Team'));

    // Tasks view all
    const upcomingViewAllBtn = document.getElementById('upcomingViewAllBtn');
    if (upcomingViewAllBtn) upcomingViewAllBtn.addEventListener('click', () => navigateTo('My Tasks'));

    // Task Filter Tabs
    const taskFilterBar = document.getElementById('taskFilterBar');
    if (taskFilterBar) {
      taskFilterBar.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          taskFilterBar.querySelectorAll('button').forEach(b => b.classList.remove('filter-active'));
          btn.classList.add('filter-active');
          state.taskFilter = btn.getAttribute('data-filter') || 'All tasks';
          renderTasks();
          refreshIcons();
        });
      });
    }

    // Search Box
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.search = e.target.value;
        if (state.search && state.section !== "My Tasks") {
          state.section = "My Tasks";
          renderNav();
          renderPageHeader();
        }
        renderTasks();
        refreshIcons();
      });
    }

    // Notifications Button & Popover
    const notificationBtn = document.getElementById('notificationBtn');
    const popover = document.getElementById('notificationPopover');
    if (notificationBtn && popover) {
      notificationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        popover.style.display = (popover.style.display === 'block') ? 'none' : 'block';
      });
    }

    const popoverViewAllBtn = document.getElementById('popoverViewAllBtn');
    if (popoverViewAllBtn) {
      popoverViewAllBtn.addEventListener('click', () => {
        if (popover) popover.style.display = 'none';
        navigateTo('Inbox');
      });
    }

    // Close popover when clicking outside
    document.addEventListener('click', (e) => {
      if (popover && !popover.contains(e.target) && e.target !== notificationBtn) {
        popover.style.display = 'none';
      }
    });

    // Mobile Navigation Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileScrim = document.getElementById('mobileScrim');
    const sidebar = document.getElementById('sidebar');

    if (mobileMenuBtn && sidebar && mobileScrim) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.add('sidebar-open');
        mobileScrim.style.display = 'block';
      });

      mobileScrim.addEventListener('click', () => {
        sidebar.classList.remove('sidebar-open');
        mobileScrim.style.display = 'none';
      });
    }

    // User Profile Actions
    const sidebarUserBtn = document.getElementById('sidebarUserBtn');
    if (sidebarUserBtn) {
      sidebarUserBtn.addEventListener('click', () => {
        if (state.user) {
          state.user = null;
          savePersistedState();
          render();
          showToast("Signed out successfully.");
        } else {
          openAuthModal();
        }
      });
    }

    const topAvatarBtn = document.getElementById('topAvatarBtn');
    if (topAvatarBtn) {
      topAvatarBtn.addEventListener('click', () => {
        if (state.user) {
          state.user = null;
          savePersistedState();
          render();
          showToast("Signed out successfully.");
        } else {
          openAuthModal();
        }
      });
    }

    const adminAccessBtn = document.getElementById('adminAccessBtn');
    if (adminAccessBtn) adminAccessBtn.addEventListener('click', openAuthModal);

    // Auth Modal Handlers
    const authCloseBtn = document.getElementById('authModalCloseBtn');
    if (authCloseBtn) authCloseBtn.addEventListener('click', closeAuthModal);

    const demoLeadBtn = document.getElementById('demoLeadBtn');
    if (demoLeadBtn) {
      demoLeadBtn.addEventListener('click', () => {
        state.user = state.members[0]; // Olivia Rhye
        savePersistedState();
        closeAuthModal();
        render();
        showToast("Welcome back, Olivia!");
      });
    }

    const demoMemberBtn = document.getElementById('demoMemberBtn');
    if (demoMemberBtn) {
      demoMemberBtn.addEventListener('click', () => {
        state.user = state.members[1]; // Phoenix Baker
        savePersistedState();
        closeAuthModal();
        render();
        showToast("Welcome back, Phoenix!");
      });
    }

    const authForm = document.getElementById('authForm');
    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('authEmailInput')?.value.trim();
        const matched = state.members.find(m => m.email.toLowerCase() === email?.toLowerCase());
        state.user = matched || state.members[0];
        savePersistedState();
        closeAuthModal();
        render();
        showToast(`Welcome back, ${state.user.name.split(' ')[0]}!`);
      });
    }

    // New Task Form
    const newTaskCloseBtn = document.getElementById('newTaskModalCloseBtn');
    if (newTaskCloseBtn) newTaskCloseBtn.addEventListener('click', closeNewTaskModal);

    const newTaskCancelBtn = document.getElementById('newTaskCancelBtn');
    if (newTaskCancelBtn) newTaskCancelBtn.addEventListener('click', closeNewTaskModal);

    const newTaskForm = document.getElementById('newTaskForm');
    if (newTaskForm) {
      newTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('newTaskTitle')?.value.trim();
        const description = document.getElementById('newTaskDescription')?.value.trim();
        const assigneeId = Number(document.getElementById('newTaskAssignee')?.value);
        const dueDate = document.getElementById('newTaskDueDate')?.value;
        const category = document.getElementById('newTaskCategory')?.value;
        const priority = document.getElementById('newTaskPriority')?.value;

        if (!title || !dueDate) return;

        const nextId = state.tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
        const newTask = {
          id: nextId,
          title,
          description,
          assigneeId,
          dueDate,
          category,
          priority,
          status: "todo",
          createdAt: new Date().toISOString()
        };

        state.tasks.unshift(newTask);

        // Add notice
        const assignee = state.members.find(m => m.id === assigneeId);
        state.notifications.unshift({
          id: `notice-${Date.now()}`,
          title: "New task assigned",
          message: `${title} was assigned to ${assignee ? assignee.name : 'you'}.`,
          type: "completion",
          recipientId: assigneeId,
          taskId: nextId,
          read: false,
          createdAt: new Date().toISOString()
        });

        savePersistedState();
        closeNewTaskModal();
        render();
        showToast("Task created and teammate notified.");
      });
    }

    // Task Detail / Edit Form
    const taskDetailCloseBtn = document.getElementById('taskDetailCloseBtn');
    if (taskDetailCloseBtn) taskDetailCloseBtn.addEventListener('click', closeTaskDetailModal);

    const taskDetailCancelBtn = document.getElementById('taskDetailCancelBtn');
    if (taskDetailCancelBtn) taskDetailCancelBtn.addEventListener('click', closeTaskDetailModal);

    const deleteTaskBtn = document.getElementById('deleteTaskBtn');
    if (deleteTaskBtn) {
      deleteTaskBtn.addEventListener('click', () => {
        if (!state.selectedTaskId) return;
        if (confirm("Delete this task?")) {
          state.tasks = state.tasks.filter(t => t.id !== state.selectedTaskId);
          savePersistedState();
          closeTaskDetailModal();
          render();
          showToast("Task deleted.");
        }
      });
    }

    const taskDetailForm = document.getElementById('taskDetailForm');
    if (taskDetailForm) {
      taskDetailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!state.user) {
          closeTaskDetailModal();
          openAuthModal();
          return;
        }

        const taskId = Number(document.getElementById('editTaskId')?.value);
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return;

        const isLead = state.user.role === "lead";
        const isAssignee = task.assigneeId === state.user.id;

        if (isLead) {
          task.title = document.getElementById('editTaskTitle')?.value.trim() || task.title;
          task.assigneeId = Number(document.getElementById('editTaskAssignee')?.value);
          task.dueDate = document.getElementById('editTaskDueDate')?.value || task.dueDate;
          task.priority = document.getElementById('editTaskPriority')?.value || task.priority;
        }

        if (isLead || isAssignee) {
          const oldStatus = task.status;
          const newStatus = document.getElementById('editTaskStatus')?.value || task.status;
          task.status = newStatus;
          if (newStatus === "done" && oldStatus !== "done") {
            task.completedAt = new Date().toISOString();
            state.notifications.unshift({
              id: `notice-${Date.now()}`,
              title: "Task completed",
              message: `${state.user.name.split(' ')[0]} completed ${task.title}.`,
              type: "completion",
              recipientId: 1, // Notify lead
              taskId: task.id,
              read: false,
              createdAt: new Date().toISOString()
            });
          }
        }

        savePersistedState();
        closeTaskDetailModal();
        render();
        showToast("Task updated successfully.");
      });
    }

    // Toast Close Button
    const toastCloseBtn = document.getElementById('toastCloseBtn');
    if (toastCloseBtn) {
      toastCloseBtn.addEventListener('click', () => {
        const toast = document.getElementById('toastNotification');
        if (toast) toast.style.display = 'none';
      });
    }

    // Keyboard Shortcuts (Cmd/Ctrl + K, Escape)
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      } else if (e.key === 'Escape') {
        closeAuthModal();
        closeNewTaskModal();
        closeTaskDetailModal();
        if (popover) popover.style.display = 'none';
      }
    });

    // Close modals when clicking backdrop
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.style.display = 'none';
        }
      });
    });
  }

  // Application Startup
  function init() {
    loadPersistedState();
    initEvents();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
