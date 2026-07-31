/*
=========================================================
Study Planner
dashboard.js
PART 1

Handles:
- Today's schedule
- Upcoming events
- Statistics
=========================================================
*/

class Dashboard {

    constructor() {

        this.todayContainer =
            document.getElementById("todaySchedule");

        this.upcomingContainer =
            document.getElementById("upcomingEvents");

        this.weekHours =
            document.getElementById("weekHours");

        this.streak =
            document.getElementById("streak");

        this.nextClass =
            document.getElementById("nextClass");

        this.refresh();

    }

    /* =====================================================
       Refresh Everything
    ===================================================== */

    refresh() {

        this.renderToday();

        this.renderUpcoming();

        this.renderStats();

    }

    /* =====================================================
       Today's Schedule
    ===================================================== */

    renderToday() {

        if (!this.todayContainer)
            return;

        const events =
            StorageAPI.getTodayEvents();

        this.todayContainer.innerHTML = "";

        if (events.length === 0) {

            this.todayContainer.innerHTML = `
                <div class="empty">
                    <div class="empty-icon">📚</div>
                    <h3>No Events Today</h3>
                    <p>Enjoy your free day!</p>
                </div>
            `;

            return;

        }

        events.forEach(event => {

            const card =
                document.createElement("div");

            card.className =
                "schedule-item fade-in";

            card.innerHTML = `

                <div class="schedule-time">
                    ${event.startTime}
                </div>

                <div class="schedule-content">

                    <div class="schedule-title">
                        ${event.title}
                    </div>

                    <div class="schedule-subject">
                        ${capitalize(event.subject)}
                    </div>

                    <span class="schedule-type">
                        ${capitalize(event.type)}
                    </span>

                </div>

            `;

            this.todayContainer.appendChild(card);

        });

    }

    /* =====================================================
       Upcoming Events
    ===================================================== */

    renderUpcoming() {

        if (!this.upcomingContainer)
            return;

        const events =
            StorageAPI.getUpcomingEvents(6);

        this.upcomingContainer.innerHTML = "";

        if (events.length === 0) {

            this.upcomingContainer.innerHTML = `
                <div class="empty">
                    No upcoming events.
                </div>
            `;

            return;

        }

        events.forEach(event => {

            const date =
                new Date(event.date);

            const card =
                document.createElement("div");

            card.className =
                "upcoming-item fade-in";

            card.innerHTML = `

            <div class="upcoming-date">

                <span>${date.getDate()}</span>

                <small>

                ${date.toLocaleString(
                    "default",
                    {month:"short"}
                )}

                </small>

            </div>

            <div class="upcoming-info">

                <div class="upcoming-title">

                    ${event.title}

                </div>

                <div class="upcoming-meta">

                    ${capitalize(event.subject)}

                    •

                    ${event.startTime}

                    -

                    ${event.endTime}

                </div>

            </div>

            `;

            this.upcomingContainer
                .appendChild(card);

        });

    }

    /* =====================================================
       Statistics
    ===================================================== */

    renderStats() {

        this.renderStudyHours();

        this.renderStreak();

        this.renderNextClass();

    }

    renderStudyHours() {

        if (!this.weekHours)
            return;

        const hours =
            StorageAPI.calculateStudyHours();

        this.weekHours.textContent =
            `${hours} hrs`;

    }

    renderStreak() {

        if (!this.streak)
            return;

        this.streak.textContent =
            `${StorageAPI.getStudyStreak()} days`;

    }

    renderNextClass() {

        if (!this.nextClass)
            return;

        const upcoming =
            StorageAPI.getUpcomingEvents(1);

        if (upcoming.length === 0) {

            this.nextClass.textContent =
                "None";

            return;

        }

        const next = upcoming[0];

        this.nextClass.textContent =
            `${next.title} (${next.startTime})`;

    }

}

/* =====================================================
   Helpers
===================================================== */

function capitalize(text){

    if(!text)
        return "";

    return text.charAt(0).toUpperCase()
        + text.slice(1);

}

/* =====================================================
   Global Dashboard
===================================================== */

window.dashboard = null;

document.addEventListener(

    "DOMContentLoaded",

    () => {

        window.dashboard =
            new Dashboard();

    }

);

/* =====================================================
   Global Refresh
===================================================== */

window.refreshDashboard = function(){

    if(window.dashboard){

        window.dashboard.refresh();

    }

};
/* =====================================================
   PART 2
   Progress Bars
   Weekly Statistics
   Countdown Timer
   Live Updates
===================================================== */

/* =====================================================
   Progress Bars
===================================================== */

Dashboard.prototype.renderProgressBars = function () {

    const subjects = [
        "mathematics",
        "physics",
        "chemistry"
    ];

    const ids = {
        mathematics: "mathProgress",
        physics: "physicsProgress",
        chemistry: "chemistryProgress"
    };

    let total = 0;

    subjects.forEach(subject => {
        total += StorageAPI.getSubjectHours(subject);
    });

    if (total === 0)
        total = 1;

    subjects.forEach(subject => {

        const progress =
            document.getElementById(ids[subject]);

        if (!progress)
            return;

        const hours =
            StorageAPI.getSubjectHours(subject);

        progress.value =
            Math.round((hours / total) * 100);

    });

};

/* =====================================================
   Weekly Breakdown
===================================================== */

Dashboard.prototype.renderWeeklyBreakdown = function () {

    const math =
        StorageAPI.getSubjectHours("mathematics");

    const physics =
        StorageAPI.getSubjectHours("physics");

    const chemistry =
        StorageAPI.getSubjectHours("chemistry");

    console.table({

        Mathematics: math,

        Physics: physics,

        Chemistry: chemistry

    });

};

/* =====================================================
   Better Next Class Countdown
===================================================== */

Dashboard.prototype.updateCountdown = function () {

    const next =
        StorageAPI.getUpcomingEvents(1);

    if (next.length === 0)
        return;

    const event = next[0];

    const start =
        new Date(
            `${event.date}T${event.startTime}`
        );

    const now =
        new Date();

    let diff =
        start - now;

    if (diff <= 0)
        return;

    const hours =
        Math.floor(diff / 3600000);

    diff -= hours * 3600000;

    const minutes =
        Math.floor(diff / 60000);

    if (this.nextClass) {

        this.nextClass.innerHTML = `

            <div>

                <strong>

                ${event.title}

                </strong>

                <br>

                Starts in

                ${hours}h ${minutes}m

            </div>

        `;

    }

};

/* =====================================================
   Empty States
===================================================== */

Dashboard.prototype.showEmptyState = function(container){

    container.innerHTML = `

        <div class="empty">

            <div class="empty-icon">

                📅

            </div>

            <h3>

                Nothing Scheduled

            </h3>

            <p>

                Use one of the subject pages
                to schedule a study session.

            </p>

        </div>

    `;

};

/* =====================================================
   Override refresh()
===================================================== */

const __dashboardRefresh =
    Dashboard.prototype.refresh;

Dashboard.prototype.refresh = function(){

    __dashboardRefresh.call(this);

    this.renderProgressBars();

    this.renderWeeklyBreakdown();

    this.updateCountdown();

};

/* =====================================================
   Auto Refresh Every Minute
===================================================== */

setInterval(() => {

    if(window.dashboard){

        window.dashboard.updateCountdown();

    }

},60000);

/* =====================================================
   Listen for Storage Changes
===================================================== */

window.addEventListener(

    "storage",

    ()=>{

        if(window.dashboard){

            window.dashboard.refresh();

        }

        if(window.studyCalendar){

            window.studyCalendar.refresh();

        }

    }

);

/* =====================================================
   Manual Refresh Helper
===================================================== */

window.refreshUI = function(){

    if(window.dashboard){

        window.dashboard.refresh();

    }

    if(window.studyCalendar){

        window.studyCalendar.refresh();

    }

};

/* =====================================================
   Statistics API
===================================================== */

Dashboard.prototype.getStatistics = function(){

    return {

        totalHours:
            StorageAPI.calculateStudyHours(),

        streak:
            StorageAPI.getStudyStreak(),

        mathematics:
            StorageAPI.getSubjectHours(
                "mathematics"
            ),

        physics:
            StorageAPI.getSubjectHours(
                "physics"
            ),

        chemistry:
            StorageAPI.getSubjectHours(
                "chemistry"
            )

    };

};

/* =====================================================
   Quick Summary
===================================================== */

Dashboard.prototype.logSummary = function(){

    const stats =
        this.getStatistics();

    console.log(
        "Study Planner Statistics",
        stats
    );

};

window.dashboardReady = true;

console.log(
    "Dashboard loaded successfully."
);
