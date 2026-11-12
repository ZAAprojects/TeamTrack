const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyghV6K2dlimv3H5QECTk3b8EItZ3HpoHJvSc5PwCMV7gXQMoqgdNgUDzUcTG3OfjlU/exec";



let teamMembers = JSON.parse(
    localStorage.getItem("teamTrackMembers") || "[]"
);

let tasks = JSON.parse(
    localStorage.getItem("teamTrackTasks") || "[]"
);

let logs = JSON.parse(
    localStorage.getItem("teamTrackLogs") || "[]"
);

let reviews = JSON.parse(
    localStorage.getItem("teamTrackReviews") || "[]"
);

let meetings = JSON.parse(
    localStorage.getItem("teamTrackMeetings") || "[]"
);

let attendance = JSON.parse(
    localStorage.getItem("teamTrackAttendance") || "[]"
);

let mom = JSON.parse(
    localStorage.getItem("teamTrackMOM") || "[]"
);

let currentUser = JSON.parse(
    localStorage.getItem("teamTrackUser") || "null"
);

let selectedRole = "member";

let attendanceDraft = {};


function saveMembers() {
    localStorage.setItem(
        "teamTrackMembers",
        JSON.stringify(teamMembers)
    );
}

function saveTasks() {
    localStorage.setItem(
        "teamTrackTasks",
        JSON.stringify(tasks)
    );
}

function saveLogs() {
    localStorage.setItem(
        "teamTrackLogs",
        JSON.stringify(logs)
    );
}

function saveReviews() {
    localStorage.setItem(
        "teamTrackReviews",
        JSON.stringify(reviews)
    );
}

function saveMeetings() {
    localStorage.setItem(
        "teamTrackMeetings",
        JSON.stringify(meetings)
    );
}

function saveAttendance() {
    localStorage.setItem(
        "teamTrackAttendance",
        JSON.stringify(attendance)
    );
}

function saveMOM() {
    localStorage.setItem(
        "teamTrackMOM",
        JSON.stringify(mom)
    );
}



function escapeHTML(value) {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function generateId(prefix) {
    return (
        prefix +
        "_" +
        Date.now() +
        "_" +
        Math.random().toString(36).substring(2, 8)
    );
}

function formatDate(dateString) {
    if (!dateString) return "—";

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function formatDateTime(dateString) {
    if (!dateString) return "—";

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

function calculateTimeSpent(start, end) {
    if (!start || !end) return "";
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "";
    const totalMinutes = Math.max(0, Math.round((endDate - startDate) / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} hr`;
    return `${hours} hr ${minutes} min`;
}

function getInitials(name) {
    return name
        .split(" ")
        .map(word => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
}

function getStatusClass(status) {
    if (status === "Completed") return "green";
    if (status === "In Progress") return "orange";
    if (status === "Flagged") return "red";
    return "";
}

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


function sendToSheet(payload) {

    fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload)
    })
    .catch(error => {
        console.error("Google Sheet error:", error);
    });
}



document.addEventListener("DOMContentLoaded", () => {

    setupRoleButtons();
    setupNavigation();
    setupForms();
    populateMemberLogin();
    updateTodayDate();

    if (currentUser) {
        startApp();
    }
});


function setupRoleButtons() {

    document
        .getElementById("memberRoleBtn")
        .addEventListener("click", () => {

            selectedRole = "member";

            document
                .getElementById("memberRoleBtn")
                .classList.add("active");

            document
                .getElementById("leaderRoleBtn")
                .classList.remove("active");

            document
                .getElementById("memberLogin")
                .classList.remove("hidden");

            document
                .getElementById("leaderLogin")
                .classList.add("hidden");
        });


    document
        .getElementById("leaderRoleBtn")
        .addEventListener("click", () => {

            selectedRole = "leader";

            document
                .getElementById("leaderRoleBtn")
                .classList.add("active");

            document
                .getElementById("memberRoleBtn")
                .classList.remove("active");

            document
                .getElementById("leaderLogin")
                .classList.remove("hidden");

            document
                .getElementById("memberLogin")
                .classList.add("hidden");
        });
}


document
    .getElementById("loginForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        let name = "";

        if (selectedRole === "leader") {

            name = document
                .getElementById("leaderName")
                .value
                .trim();

            if (!name) {
                showToast("Please enter your name.");
                return;
            }

        } else {

            name = document
                .getElementById("memberName")
                .value;

            if (!name) {
                showToast("Please select your name.");
                return;
            }
        }


        currentUser = {
            name: name,
            role: selectedRole
        };

        localStorage.setItem(
            "teamTrackUser",
            JSON.stringify(currentUser)
        );



        if (
            currentUser.role === "leader" &&
            !teamMembers.some(
                member =>
                    member.toLowerCase() === currentUser.name.toLowerCase()
            )
        ) {

            teamMembers.push(currentUser.name);
            saveMembers();

            sendToSheet({
                action: "addMember",
                name: currentUser.name,
                addedBy: currentUser.name
            });
        }


        startApp();
    });


function startApp() {

    document
        .getElementById("loginPage")
        .classList.add("hidden");

    document
        .getElementById("app")
        .classList.remove("hidden");


    document.getElementById("sidebarUserName").textContent =
        currentUser.name;

    document.getElementById("sidebarUserRole").textContent =
        currentUser.role === "leader" ? "Leader" : "Member";

    document.getElementById("topbarUserName").textContent =
        currentUser.name;

    document.getElementById("welcomeName").textContent =
        currentUser.name.split(" ")[0];

    document.getElementById("userAvatar").textContent =
        getInitials(currentUser.name);


    document
        .querySelectorAll(".leader-only")
        .forEach(element => {

            if (currentUser.role === "leader") {
                element.classList.remove("hidden");
            } else {
                element.classList.add("hidden");
            }
        });


    populateAssignee();
    populateMeetingSelects();
    renderAll();
}


function setupNavigation() {

    document
        .querySelectorAll(".nav-item")
        .forEach(button => {

            button.addEventListener("click", () => {

                const sectionId =
                    button.dataset.section;

                showSection(sectionId);

            });
        });


    document
        .querySelectorAll("[data-go]")
        .forEach(button => {

            button.addEventListener("click", () => {
                showSection(button.dataset.go);
            });

        });
}


function showSection(sectionId) {

    document
        .querySelectorAll(".page-section")
        .forEach(section => {
            section.classList.remove("active");
        });


    const section =
        document.getElementById(sectionId);

    if (!section) return;

    section.classList.add("active");


    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.section === sectionId
            );

        });


    const titles = {
        dashboard: "Overview",
        tasks: "Tasks",
        create: "Create Task",
        teamSetup: "Team Setup",
        meetings: "Meetings & Notes",
        review: "Review Logs"
    };

    document.getElementById("pageTitle").textContent =
        titles[sectionId] || "TeamTrack";
}


function populateMemberLogin() {

    const select =
        document.getElementById("memberName");

    const message =
        document.getElementById("noMembersMessage");


    select.innerHTML =
        `<option value="">Select member</option>`;


    if (teamMembers.length === 0) {

        message.classList.remove("hidden");

        return;
    }


    message.classList.add("hidden");


    teamMembers.forEach(member => {

        const option =
            document.createElement("option");

        option.value = member;
        option.textContent = member;

        select.appendChild(option);
    });
}


function populateAssignee() {

    const select =
        document.getElementById("taskAssignee");

    if (!select) return;

    select.innerHTML =
        `<option value="">Select team member</option>`;


    teamMembers.forEach(member => {

        const option =
            document.createElement("option");

        option.value = member;
        option.textContent = member;

        select.appendChild(option);
    });
}


function renderTeamSetup() {

    const list =
        document.getElementById("teamMembersList");

    const count =
        document.getElementById("memberCountLabel");

    const dashboardMembers =
        document.getElementById("dashboardMembers");


    count.textContent = teamMembers.length;


    if (teamMembers.length === 0) {

        list.innerHTML =
            `<div class="empty-state">
                No team members added yet.
            </div>`;

        dashboardMembers.innerHTML =
            `<div class="empty-state">
                No team members added yet.
            </div>`;

        return;
    }


    list.innerHTML =
        teamMembers.map((member, index) => {

            return `
                <div class="team-member-row">

                    <div class="member-info">

                        <div class="member-avatar">
                            ${escapeHTML(getInitials(member))}
                        </div>

                        <strong>
                            ${escapeHTML(member)}
                        </strong>

                    </div>

                    <button
                        class="remove-member"
                        onclick="removeMember(${index})"
                    >
                        Remove
                    </button>

                </div>
            `;

        }).join("");


    dashboardMembers.innerHTML =
        teamMembers.map(member => {

            return `
                <div class="member-chip">
                    ${escapeHTML(member)}
                </div>
            `;

        }).join("");
}


function addMember(name) {

    name = name.trim();

    if (!name) {
        showToast("Enter a member name.");
        return;
    }


    const exists =
        teamMembers.some(
            member =>
                member.toLowerCase() === name.toLowerCase()
        );


    if (exists) {
        showToast("This member is already added.");
        return;
    }


    teamMembers.push(name);

    saveMembers();

    sendToSheet({
        action: "addMember",
        name: name,
        addedBy: currentUser.name
    });


    populateMemberLogin();
    populateAssignee();

    renderTeamSetup();

    showToast("Team member added.");
}


function removeMember(index) {

    const member =
        teamMembers[index];

    if (!member) return;


    const hasTasks =
        tasks.some(
            task => task.assignedTo === member
        );


    if (hasTasks) {

        const confirmRemove =
            confirm(
                `${member} has assigned tasks. Remove this member anyway?`
            );

        if (!confirmRemove) {
            return;
        }
    }


    teamMembers.splice(index, 1);

    saveMembers();

    sendToSheet({
        action: "removeMember",
        name: member,
        removedBy: currentUser.name
    });


    populateMemberLogin();
    populateAssignee();

    renderTeamSetup();

    showToast("Team member removed.");
}


function createTask(event) {

    event.preventDefault();


    const task = {

        taskId: generateId("TASK"),

        taskName:
            document.getElementById("taskName").value.trim(),

        description:
            document.getElementById("taskDescription").value.trim(),

        assignedTo:
            document.getElementById("taskAssignee").value,

        deadline:
            document.getElementById("taskDeadline").value,

        complexity:
            document.getElementById("taskComplexity").value,

        startDateTime:
            document.getElementById("taskStart").value,

        endDateTime:
            document.getElementById("taskEnd").value,

        status: "Pending",

        progress: 0,

        createdBy:
            currentUser.name,

        createdAt:
            new Date().toISOString()
    };


    tasks.push(task);

    saveTasks();


    sendToSheet({
        action: "createTask",
        taskId: task.taskId,
        taskName: task.taskName,
        description: task.description,
        assignedTo: task.assignedTo,
        deadline: task.deadline,
        complexity: task.complexity,
        startDateTime: task.startDateTime,
        endDateTime: task.endDateTime,
        status: task.status,
        progress: task.progress,
        createdBy: task.createdBy,
        createdAt: task.createdAt
    });


    document.getElementById("taskForm").reset();

    renderAll();

    showToast("Task created successfully.");

    showSection("tasks");
}


function renderTasks() {

    const yourTasks =
        document.getElementById("yourTasks");

    const teamTasks =
        document.getElementById("teamTasks");


    const own =
        tasks.filter(
            task => task.assignedTo === currentUser.name
        );


    const others =
        tasks.filter(
            task => task.assignedTo !== currentUser.name
        );


    if (own.length === 0) {

        yourTasks.innerHTML =
            `<div class="empty-state">
                No tasks assigned to you.
            </div>`;

    } else {

        yourTasks.innerHTML =
            own.map(taskCard).join("");
    }


    if (others.length === 0) {

        teamTasks.innerHTML =
            `<div class="empty-state">
                No team tasks available.
            </div>`;

    } else {

        teamTasks.innerHTML =
            others.map(taskCard).join("");
    }
}


function taskCard(task) {

    const canLog =
        task.assignedTo === currentUser.name;


    return `
        <div class="task-card">

            <div class="task-top">

                <div>
                    <h4>
                        ${escapeHTML(task.taskName)}
                    </h4>

                    <p class="card-subtitle">
                        Assigned to ${escapeHTML(task.assignedTo)}
                    </p>
                </div>

                <span class="badge ${getStatusClass(task.status)}">
                    ${escapeHTML(task.status)}
                </span>

            </div>


            <p class="task-description">
                ${escapeHTML(task.description)}
            </p>


            <div class="task-meta">

                <span class="badge">
                    ${escapeHTML(task.complexity)}
                </span>

                <span class="badge">
                    Due ${formatDate(task.deadline)}
                </span>

            </div>


            <div class="task-footer">

                <div class="task-progress">

                    <span>
                        Progress ${task.progress || 0}%
                    </span>

                    <div class="progress-bar">
                        <div
                            class="progress-fill"
                            style="width:${task.progress || 0}%"
                        ></div>
                    </div>

                </div>


                ${
                    canLog
                    ?
                    `<button
                        class="secondary-btn"
                        onclick="openProgressModal('${task.taskId}')"
                    >
                        Log Progress
                    </button>`
                    :
                    `<span class="card-subtitle">
                        View only
                    </span>`
                }

                ${
                    currentUser.role === "leader"
                    ? `<button
                        class="secondary-btn"
                        onclick="removeTask('${task.taskId}')"
                    >
                        Remove Task
                    </button>`
                    : ""
                }
            </div>
        </div>
    `;
}


function openProgressModal(taskId) {

    const task =
        tasks.find(
            item => item.taskId === taskId
        );

    if (!task) return;


    document.getElementById("progressTask").value =
        taskId;

    document.getElementById("progressTaskName").textContent =
        task.taskName;


    document.getElementById("progressDescription").value = "";
    document.getElementById("evidence").value = "";
    document.getElementById("effortRemaining").value = 50;
    document.getElementById("effortValue").textContent = 50;
    document.getElementById("workStart").value = "";
    document.getElementById("workEnd").value = "";
    document.getElementById("progressStatus").value =
        "In Progress";


    document
        .getElementById("logModal")
        .classList.remove("hidden");
}


function closeProgressModal() {

    document
        .getElementById("logModal")
        .classList.add("hidden");
}


function submitProgress(event) {

    event.preventDefault();


    const taskId =
        document.getElementById("progressTask").value;


    const task =
        tasks.find(
            item => item.taskId === taskId
        );


    if (!task) return;


    const status =
        document.getElementById("progressStatus").value;


    const effort =
        Number(
            document.getElementById("effortRemaining").value
        );


    const progress =
        Math.max(0, Math.min(100, 100 - effort));


    const log = {

        logId: generateId("LOG"),

        taskId: task.taskId,

        taskName: task.taskName,

        member: currentUser.name,

        description:
            document.getElementById("progressDescription").value.trim(),

        evidence:
            document.getElementById("evidence").value.trim(),

        effortRemaining: effort,

        workStart:
            document.getElementById("workStart").value,

        workEnd:
            document.getElementById("workEnd").value,

        timeSpent:
            calculateTimeSpent(
                document.getElementById("workStart").value,
                document.getElementById("workEnd").value
            ),

        timestamp:
            new Date().toISOString(),

        reviewStatus: "Pending Review",

        feedback: ""
    };


    logs.push(log);

    saveLogs();


    task.progress = progress;
    task.status = status;

    saveTasks();


    sendToSheet({
        action: "logProgress",
        ...log,
        progress: progress,
        taskStatus: status
    });


    closeProgressModal();

    renderAll();

    showToast("Progress submitted for review.");
}


function renderReviews() {

    const container =
        document.getElementById("reviewLogs");


    /* Every team member can review every submitted log. */
    const visibleLogs = logs;


    if (visibleLogs.length === 0) {

        container.innerHTML =
            `<div class="empty-state">
                No progress logs submitted yet.
            </div>`;

        return;
    }


    container.innerHTML =
        visibleLogs
            .slice()
            .reverse()
            .map(reviewCard)
            .join("");
}


function reviewCard(log) {

    return `
        <div class="review-card">

            <div class="review-header">

                <div>
                    <h3>
                        ${escapeHTML(log.taskName)}
                    </h3>

                    <p class="review-member">
                        Submitted by ${escapeHTML(log.member)}
                    </p>
                </div>

                ${(() => {
                    const myReview = reviews.find(
                        item => item.reviewKey === getReviewKey(log.logId, currentUser.name)
                    );
                    const status = myReview?.reviewStatus || "Pending Review";
                    return `<span class="badge ${getStatusClass(status)}">${escapeHTML(status)}</span>`;
                })()}

            </div>


            <div class="review-details">

                <div class="review-detail">
                    <span>Effort Remaining</span>
                    <strong>${log.effortRemaining}%</strong>
                </div>

                <div class="review-detail">
                    <span>Work Start</span>
                    <strong>${formatDateTime(log.workStart)}</strong>
                </div>

                <div class="review-detail">
                    <span>Work End</span>
                    <strong>${formatDateTime(log.workEnd)}</strong>
                </div>

                <div class="review-detail">
                    <span>Time Spent</span>
                    <strong>${escapeHTML(log.timeSpent || calculateTimeSpent(log.workStart, log.workEnd) || "—")}</strong>
                </div>

            </div>


            <div class="review-description">
                <strong>Description</strong>
                <br><br>
                ${escapeHTML(log.description)}
            </div>


            ${
                log.evidence
                ?
                `<div class="review-description">
                    <strong>Evidence</strong>
                    <br><br>
                    <a
                        href="${escapeHTML(log.evidence)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View Evidence
                    </a>
                </div>`
                :
                ""
            }


            ${(() => {
                const myReview = reviews.find(
                    item => item.reviewKey === getReviewKey(log.logId, currentUser.name)
                );
                const feedback = myReview?.feedback || "";
                return feedback
                    ? `<div class="review-feedback">
                        <strong>Your Feedback:</strong>
                        ${escapeHTML(feedback)}
                    </div>`
                    : "";
            })()}


            <div class="review-actions">
                <button class="review-btn confirm" onclick="updateReviewStatus('${log.logId}', 'Confirmed')">Confirm</button>
                <button class="review-btn flag" onclick="updateReviewStatus('${log.logId}', 'Flagged')">Flag</button>
                <button class="review-btn feedback" onclick="sendFeedback('${log.logId}')">Send Feedback</button>
            </div>

        </div>
    `;
}


function getReviewKey(logId, reviewer) {
    return `${logId}__${reviewer}`;
}

function saveLocalReview(review) {
    const key = getReviewKey(review.logId, review.reviewedBy);
    const index = reviews.findIndex(item => item.reviewKey === key);
    if (index >= 0) reviews[index] = { ...reviews[index], ...review, reviewKey: key };
    else reviews.push({ ...review, reviewKey: key });
    saveReviews();
}

function updateReviewStatus(logId, status) {
    const log = logs.find(item => item.logId === logId);
    if (!log) return;
    const existing = reviews.find(item => item.reviewKey === getReviewKey(logId, currentUser.name));
    const review = {
        reviewId: getReviewKey(logId, currentUser.name),
        logId: log.logId,
        taskId: log.taskId,
        taskName: log.taskName,
        submittedBy: log.member,
        reviewedBy: currentUser.name,
        reviewStatus: status,
        feedback: existing?.feedback || "",
        reviewedAt: new Date().toISOString()
    };
    saveLocalReview(review);
    sendToSheet({ action: "saveReview", ...review });
    renderReviews();
    showToast(`Your review is ${status}.`);
}

function sendFeedback(logId) {
    const feedback = prompt("Enter feedback for this submission:");
    if (feedback === null) return;
    const cleanFeedback = feedback.trim();
    if (!cleanFeedback) { showToast("Feedback cannot be empty."); return; }
    const log = logs.find(item => item.logId === logId);
    if (!log) return;
    const existing = reviews.find(item => item.reviewKey === getReviewKey(logId, currentUser.name));
    const review = {
        reviewId: getReviewKey(logId, currentUser.name),
        logId: log.logId,
        taskId: log.taskId,
        taskName: log.taskName,
        submittedBy: log.member,
        reviewedBy: currentUser.name,
        reviewStatus: existing?.reviewStatus || "Pending Review",
        feedback: cleanFeedback,
        reviewedAt: new Date().toISOString()
    };
    saveLocalReview(review);
    sendToSheet({ action: "saveReview", ...review });
    renderReviews();
    showToast("Your feedback was saved.");
}

function removeTask(taskId) {
    if (currentUser.role !== "leader") { showToast("Only the leader can remove tasks."); return; }
    const task = tasks.find(item => item.taskId === taskId);
    if (!task) return;
    if (!confirm(`Remove the task "${task.taskName}"?\n\nExisting progress logs will be kept.`)) return;
    tasks = tasks.filter(item => item.taskId !== taskId);
    saveTasks();
    sendToSheet({ action: "removeTask", taskId, removedBy: currentUser.name, removedAt: new Date().toISOString() });
    renderAll();
    showToast("Task removed. Existing logs were kept.");
}


function createMeeting(event) {

    event.preventDefault();


    const meeting = {

        meetingId:
            generateId("MEET"),

        meetingName:
            document.getElementById("meetingName").value.trim(),

        date:
            document.getElementById("meetingDate").value,

        time:
            document.getElementById("meetingTime").value,

        agenda:
            document.getElementById("meetingAgenda").value.trim(),

        createdBy:
            currentUser.name,

        createdAt:
            new Date().toISOString()
    };


    meetings.push(meeting);

    saveMeetings();


    sendToSheet({
        action: "createMeeting",
        ...meeting
    });


    document
        .getElementById("meetingForm")
        .reset();

    document
        .getElementById("meetingFormContainer")
        .classList.add("hidden");


    renderAll();

    showToast("Meeting scheduled.");
}


function renderMeetings() {

    const container =
        document.getElementById("meetingsList");


    const sorted =
        meetings
            .slice()
            .sort(
                (a, b) =>
                    new Date(`${a.date}T${a.time}`) -
                    new Date(`${b.date}T${b.time}`)
            );


    if (sorted.length === 0) {

        container.innerHTML =
            `<div class="empty-state">
                No meetings scheduled.
            </div>`;

        return;
    }


    container.innerHTML =
        sorted.map(meeting => {

            return `
                <div class="meeting-card">

                    <h4>
                        ${escapeHTML(meeting.meetingName)}
                    </h4>

                    <p class="meeting-date">
                        ${formatDate(meeting.date)}
                        ·
                        ${escapeHTML(meeting.time)}
                    </p>

                    <p class="meeting-agenda">
                        ${escapeHTML(meeting.agenda)}
                    </p>

                    <p class="card-subtitle" style="margin-top:12px;">
                        Created by ${escapeHTML(meeting.createdBy)}
                    </p>

                </div>
            `;

        }).join("");
}


function populateMeetingSelects() {

    const attendanceSelect =
        document.getElementById("attendanceMeeting");

    const momSelect =
        document.getElementById("momMeeting");


    if (!attendanceSelect || !momSelect) {
        return;
    }


    attendanceSelect.innerHTML =
        `<option value="">Select meeting</option>`;

    momSelect.innerHTML =
        `<option value="">Select meeting</option>`;


    meetings.forEach(meeting => {

        const label =
            `${meeting.meetingName} — ${formatDate(meeting.date)}`;


        const option1 =
            document.createElement("option");

        option1.value =
            meeting.meetingId;

        option1.textContent =
            label;

        attendanceSelect.appendChild(option1);


        const option2 =
            document.createElement("option");

        option2.value =
            meeting.meetingId;

        option2.textContent =
            label;

        momSelect.appendChild(option2);

    });
}


function loadAttendanceRegister() {

    const meetingId =
        document.getElementById("attendanceMeeting").value;

    const container =
        document.getElementById("attendanceRegister");


    if (!meetingId) {

        container.innerHTML =
            `<div class="empty-state">
                Select a meeting to mark attendance.
            </div>`;

        attendanceDraft = {};

        return;
    }


    attendanceDraft = {};


    teamMembers.forEach(member => {

        const existing =
            attendance.find(
                item =>
                    item.meetingId === meetingId &&
                    item.member === member
            );


        attendanceDraft[member] =
            existing
                ? existing.present
                : true;
    });


    container.innerHTML =
        teamMembers.map(member => {

            const present =
                attendanceDraft[member] !== false;


            return `
                <div class="attendance-row">

                    <span class="attendance-member">
                        ${escapeHTML(member)}
                    </span>

                    <div class="attendance-buttons">

                        <button
                            type="button"
                            class="attendance-btn present ${present ? "active" : ""}"
                            onclick="setAttendance('${escapeHTML(member)}', true)"
                        >
                            Present
                        </button>

                        <button
                            type="button"
                            class="attendance-btn absent ${!present ? "active" : ""}"
                            onclick="setAttendance('${escapeHTML(member)}', false)"
                        >
                            Absent
                        </button>

                    </div>

                </div>
            `;

        }).join("");
}


function setAttendance(member, present) {

    attendanceDraft[member] =
        present;


    loadAttendanceRegister();
}


function saveAttendanceRecords() {

    const meetingId =
        document.getElementById("attendanceMeeting").value;


    if (!meetingId) {
        showToast("Select a meeting first.");
        return;
    }


    const meeting =
        meetings.find(
            item => item.meetingId === meetingId
        );


    if (!meeting) return;


    teamMembers.forEach(member => {

        const present =
            attendanceDraft[member] !== false;


        const existingIndex =
            attendance.findIndex(
                item =>
                    item.meetingId === meetingId &&
                    item.member === member
            );


        const record = {

            attendanceId:
                existingIndex >= 0
                    ? attendance[existingIndex].attendanceId
                    : generateId("ATT"),

            meetingId:
                meetingId,

            meetingName:
                meeting.meetingName,

            date:
                meeting.date,

            member:
                member,

            present:
                present,

            markedBy:
                currentUser.name,

            timestamp:
                new Date().toISOString()
        };


        if (existingIndex >= 0) {

            attendance[existingIndex] =
                record;

        } else {

            attendance.push(record);
        }


        sendToSheet({
            action: "saveAttendance",
            ...record
        });

    });


    saveAttendance();

    renderAttendanceHistory();

    showToast("Attendance saved.");
}


function renderAttendanceHistory() {

    const container =
        document.getElementById("attendanceHistory");


    if (attendance.length === 0) {

        container.innerHTML =
            `<div class="empty-state">
                No attendance records yet.
            </div>`;

        return;
    }


    const grouped = {};


    attendance.forEach(record => {

        if (!grouped[record.meetingId]) {
            grouped[record.meetingId] = [];
        }

        grouped[record.meetingId].push(record);
    });


    container.innerHTML =
        Object.values(grouped)
            .reverse()
            .map(records => {

                const first =
                    records[0];

                const present =
                    records.filter(
                        record => record.present
                    ).length;


                return `
                    <div class="attendance-history-row">

                        <div>
                            <strong>
                                ${escapeHTML(first.meetingName)}
                            </strong>

                            <span>
                                ${formatDate(first.date)}
                            </span>
                        </div>

                        <div>
                            <strong>
                                ${present}/${records.length} Present
                            </strong>
                        </div>

                    </div>
                `;

            })
            .join("");
}


function saveMeetingNotes(event) {

    event.preventDefault();


    const meetingId =
        document.getElementById("momMeeting").value;


    const notes =
        document.getElementById("momNotes").value.trim();


    if (!meetingId || !notes) {
        showToast("Please complete the meeting notes.");
        return;
    }


    const meeting =
        meetings.find(
            item => item.meetingId === meetingId
        );


    if (!meeting) return;


    const record = {

        momId:
            generateId("MOM"),

        meetingId:
            meetingId,

        meetingName:
            meeting.meetingName,

        notes:
            notes,

        author:
            currentUser.name,

        date:
            new Date().toISOString()
    };


    mom.push(record);

    saveMOM();


    sendToSheet({
        action: "saveMOM",
        ...record
    });


    document
        .getElementById("momForm")
        .reset();


    renderMOM();

    showToast("Meeting notes saved.");
}


function renderMOM() {

    const container =
        document.getElementById("momList");


    if (mom.length === 0) {

        container.innerHTML =
            `<div class="empty-state">
                No meeting notes available.
            </div>`;

        return;
    }


    container.innerHTML =
        mom
            .slice()
            .reverse()
            .map(record => {

                return `
                    <div class="mom-card">

                        <div class="mom-card-header">

                            <div>
                                <h4>
                                    ${escapeHTML(record.meetingName)}
                                </h4>

                                <p class="card-subtitle">
                                    By ${escapeHTML(record.author)}
                                </p>
                            </div>

                            <span class="mom-date">
                                ${formatDateTime(record.date)}
                            </span>

                        </div>

                        <div class="mom-content">
                            ${escapeHTML(record.notes)}
                        </div>

                    </div>
                `;

            }).join("");
}


function renderDashboard() {

    const openTasks =
        tasks.filter(
            task => task.status !== "Completed"
        ).length;


    const today =
        new Date();

    const dueSoon =
        tasks.filter(task => {

            if (!task.deadline) return false;

            const deadline =
                new Date(task.deadline);

            const difference =
                deadline - today;

            return (
                difference >= 0 &&
                difference <= 3 * 24 * 60 * 60 * 1000
            );

        }).length;


    document.getElementById("openTasksCount").textContent =
        openTasks;

    document.getElementById("dueSoonCount").textContent =
        dueSoon;

    document.getElementById("teamMemberCount").textContent =
        teamMembers.length;


    const nextMeeting =
        getNextMeeting();


    document.getElementById("nextMeetingDashboard").textContent =
        nextMeeting
            ? formatDate(nextMeeting.date)
            : "—";


    renderTodayFocus();
    renderDashboardNextMeeting();
    renderActivity();
    renderTeamSetup();
}


function getNextMeeting() {

    const now =
        new Date();


    return meetings
        .filter(meeting => {

            const meetingDate =
                new Date(`${meeting.date}T${meeting.time}`);

            return meetingDate >= now;

        })
        .sort(
            (a, b) =>
                new Date(`${a.date}T${a.time}`) -
                new Date(`${b.date}T${b.time}`)
        )[0] || null;
}


function renderTodayFocus() {

    const container =
        document.getElementById("todayFocusList");


    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    const todayTasks =
        tasks.filter(task => {

            return (
                task.assignedTo === currentUser.name &&
                task.deadline &&
                task.deadline.startsWith(today)
            );

        });


    if (todayTasks.length === 0) {

        container.innerHTML =
            `<div class="empty-state">
                No tasks assigned for today.
            </div>`;

        return;
    }


    container.innerHTML =
        todayTasks.map(task => {

            return `
                <div class="focus-item">

                    <strong>
                        ${escapeHTML(task.taskName)}
                    </strong>

                    <span>
                        ${escapeHTML(task.status)}
                        ·
                        ${task.progress || 0}% complete
                    </span>

                </div>
            `;

        }).join("");
}


function renderDashboardNextMeeting() {

    const container =
        document.getElementById("dashboardNextMeeting");


    const meeting =
        getNextMeeting();


    if (!meeting) {

        container.innerHTML =
            `<div class="empty-state">
                No upcoming meetings.
            </div>`;

        return;
    }


    container.innerHTML =
        `
        <div class="meeting-card">

            <h4>
                ${escapeHTML(meeting.meetingName)}
            </h4>

            <p class="meeting-date">
                ${formatDate(meeting.date)}
                ·
                ${escapeHTML(meeting.time)}
            </p>

            <p class="meeting-agenda">
                ${escapeHTML(meeting.agenda)}
            </p>

        </div>
        `;
}


function renderActivity() {

    const container =
        document.getElementById("teamActivity");


    const activities = [];


    logs.slice(-5).forEach(log => {

        activities.push({
            text:
                `${log.member} submitted progress for ${log.taskName}`,
            date:
                log.timestamp
        });

    });


    meetings.slice(-5).forEach(meeting => {

        activities.push({
            text:
                `Meeting scheduled: ${meeting.meetingName}`,
            date:
                meeting.createdAt
        });

    });


    if (activities.length === 0) {

        container.innerHTML =
            `<div class="empty-state">
                No recent activity.
            </div>`;

        return;
    }


    activities
        .sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );


    container.innerHTML =
        activities
            .slice(0, 6)
            .map(activity => {

                return `
                    <div class="activity-item">

                        <strong>
                            ${escapeHTML(activity.text)}
                        </strong>

                        <span>
                            ${formatDateTime(activity.date)}
                        </span>

                    </div>
                `;

            }).join("");
}


function updateTodayDate() {

    const today =
        new Date();

    document.getElementById("todayDate").textContent =
        today.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
}



function renderAll() {

    populateAssignee();
    populateMeetingSelects();

    renderDashboard();
    renderTasks();
    renderMeetings();
    renderAttendanceHistory();
    renderMOM();
    renderReviews();
}


function setupForms() {

    document
        .getElementById("taskForm")
        .addEventListener(
            "submit",
            createTask
        );


    document
        .getElementById("memberForm")
        .addEventListener(
            "submit",
            function(event) {

                event.preventDefault();

                const input =
                    document.getElementById("memberInput");

                addMember(input.value);

                input.value = "";
            }
        );


    document
        .getElementById("meetingForm")
        .addEventListener(
            "submit",
            createMeeting
        );


    document
        .getElementById("momForm")
        .addEventListener(
            "submit",
            saveMeetingNotes
        );


    document
        .getElementById("progressForm")
        .addEventListener(
            "submit",
            submitProgress
        );


    document
        .getElementById("attendanceMeeting")
        .addEventListener(
            "change",
            loadAttendanceRegister
        );


    document
        .getElementById("saveAttendance")
        .addEventListener(
            "click",
            saveAttendanceRecords
        );


    document
        .getElementById("showMeetingFormBtn")
        .addEventListener(
            "click",
            () => {

                document
                    .getElementById("meetingFormContainer")
                    .classList.remove("hidden");

            }
        );


    document
        .getElementById("cancelMeetingBtn")
        .addEventListener(
            "click",
            () => {

                document
                    .getElementById("meetingFormContainer")
                    .classList.add("hidden");

            }
        );


    document
        .getElementById("closeModal")
        .addEventListener(
            "click",
            closeProgressModal
        );


    document
        .getElementById("cancelProgress")
        .addEventListener(
            "click",
            closeProgressModal
        );


    document
        .getElementById("effortRemaining")
        .addEventListener(
            "input",
            function() {

                document.getElementById("effortValue")
                    .textContent = this.value;

            }
        );


    document
        .getElementById("logoutBtn")
        .addEventListener(
            "click",
            logout
        );
}


function logout() {

    localStorage.removeItem("teamTrackUser");

    currentUser = null;

    document
        .getElementById("app")
        .classList.add("hidden");

    document
        .getElementById("loginPage")
        .classList.remove("hidden");

    document
        .getElementById("loginForm")
        .reset();

    selectedRole = "member";

    document
        .getElementById("memberRoleBtn")
        .click();
}


window.openProgressModal = openProgressModal;
window.removeMember = removeMember;
window.removeTask = removeTask;
window.setAttendance = setAttendance;
window.updateReviewStatus = updateReviewStatus;
window.sendFeedback = sendFeedback;