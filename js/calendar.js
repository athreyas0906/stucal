/*
=========================================================
Study Planner
calendar.js
PART 1

Creates a monthly calendar without any libraries.
=========================================================
*/

class StudyCalendar {

    constructor(containerId) {

        this.container = document.getElementById(containerId);

        if (!this.container) {
            console.error("Calendar container not found.");
            return;
        }

        this.currentDate = new Date();

        this.monthNames = [
            "January","February","March","April",
            "May","June","July","August",
            "September","October","November","December"
        ];

        this.dayNames = [
            "Sun","Mon","Tue","Wed","Thu","Fri","Sat"
        ];

        this.render();

    }

    /* =====================================================
       Navigation
    ===================================================== */

    previousMonth() {

        this.currentDate.setMonth(
            this.currentDate.getMonth() - 1
        );

        this.render();

    }

    nextMonth() {

        this.currentDate.setMonth(
            this.currentDate.getMonth() + 1
        );

        this.render();

    }

    goToToday() {

        this.currentDate = new Date();

        this.render();

    }

    /* =====================================================
       Main Render
    ===================================================== */

    render() {

        this.container.innerHTML = "";

        this.renderHeader();

        this.renderWeekdays();

        this.renderDays();

    }

    /* =====================================================
       Header
    ===================================================== */

    renderHeader() {

        const header = document.createElement("div");
        header.className = "calendar-toolbar";

        const left = document.createElement("div");
        left.className = "calendar-title";

        const title = document.createElement("h2");

        title.textContent =
            this.monthNames[this.currentDate.getMonth()] +
            " " +
            this.currentDate.getFullYear();

        left.appendChild(title);

        const right = document.createElement("div");
        right.className = "calendar-controls";

        const prev = document.createElement("button");
        prev.textContent = "←";

        prev.onclick = () => this.previousMonth();

        const today = document.createElement("button");
        today.textContent = "Today";

        today.onclick = () => this.goToToday();

        const next = document.createElement("button");
        next.textContent = "→";

        next.onclick = () => this.nextMonth();

        right.append(prev, today, next);

        header.append(left, right);

        this.container.appendChild(header);

    }

    /* =====================================================
       Weekday Row
    ===================================================== */

    renderWeekdays() {

        const row = document.createElement("div");

        row.className = "calendar-weekdays";

        this.dayNames.forEach(day => {

            const cell = document.createElement("div");

            cell.className = "weekday";

            cell.textContent = day;

            row.appendChild(cell);

        });

        this.container.appendChild(row);

    }

    /* =====================================================
       Calendar Grid
    ===================================================== */

    renderDays() {

        const grid = document.createElement("div");

        grid.className = "calendar-grid";

        const year = this.currentDate.getFullYear();

        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);

        const startingWeekday = firstDay.getDay();

        const daysThisMonth =
            new Date(year, month + 1, 0).getDate();

        const daysLastMonth =
            new Date(year, month, 0).getDate();

        /* Previous month */

        for (let i = startingWeekday - 1; i >= 0; i--) {

            const cell = this.createDayCell({

                number: daysLastMonth - i,

                otherMonth: true

            });

            grid.appendChild(cell);

        }

        /* Current month */

        for (let day = 1; day <= daysThisMonth; day++) {

            const cellDate =
                `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

            const today = new Date();

            const isToday =
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === day;

            const cell = this.createDayCell({

                number: day,

                date: cellDate,

                today: isToday,

                otherMonth: false

            });

            grid.appendChild(cell);

        }

        /* Next month */

        while (grid.children.length < 42) {

            const number =
                grid.children.length -
                (startingWeekday + daysThisMonth) +
                1;

            const cell = this.createDayCell({

                number,

                otherMonth: true

            });

            grid.appendChild(cell);

        }

        this.container.appendChild(grid);

    }

    /* =====================================================
       Day Cell
    ===================================================== */

    createDayCell(options) {

        const cell = document.createElement("div");

        cell.className = "calendar-day";

        if (options.otherMonth)
            cell.classList.add("other-month");

        if (options.today)
            cell.classList.add("today");

        if (options.date)
            cell.dataset.date = options.date;

        const number = document.createElement("div");

        number.className = "day-number";

        number.textContent = options.number;

        cell.appendChild(number);

        /*
         Event container

         Part 2 will populate this.
        */

        const events = document.createElement("div");

        events.className = "day-events";

        cell.appendChild(events);

        return cell;

    }

}

/* =========================================================
   Initialize
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    window.studyCalendar =
        new StudyCalendar("calendar");

    const todayButton =
        document.getElementById("todayButton");

    if (todayButton) {

        todayButton.onclick = () =>
            window.studyCalendar.goToToday();

    }

});
/* =====================================================
   PART 2
   Event Rendering & Read-Only Viewer
===================================================== */

StudyCalendar.prototype.refresh = function () {

    this.render();

};

/* =====================================================
   Render Events
===================================================== */

StudyCalendar.prototype.renderEvents = function () {

    if (!window.StorageAPI) return;

    const events = StorageAPI.getEvents();

    events.forEach(event => {

        const cell = this.container.querySelector(
            `[data-date="${event.date}"]`
        );

        if (!cell) return;

        const holder = cell.querySelector(".day-events");

        const chip = document.createElement("div");

        chip.className = `calendar-event ${event.subject}`;

        chip.innerHTML = `
            <strong>${event.startTime}</strong><br>
            ${event.title}
        `;

        chip.title =
            `${event.title}\n${event.startTime} - ${event.endTime}`;

        chip.addEventListener("click", e => {

            e.stopPropagation();

            this.openEvent(event);

        });

        holder.appendChild(chip);

    });

};

/* =====================================================
   Override render()
===================================================== */

const __originalRender = StudyCalendar.prototype.render;

StudyCalendar.prototype.render = function () {

    __originalRender.call(this);

    this.renderEvents();

};

/* =====================================================
   Read Only Event Popup
===================================================== */

StudyCalendar.prototype.openEvent = function(event){

    let modal = document.getElementById("eventModal");

    if(!modal){

        modal=document.createElement("div");

        modal.id="eventModal";

        modal.className="calendar-modal";

        document.body.appendChild(modal);

    }

    modal.innerHTML=`

    <div class="calendar-modal-backdrop"></div>

    <div class="calendar-modal-card">

        <button class="calendar-close">
            ×
        </button>

        <h2>${event.title}</h2>

        <div class="event-row">

            <strong>Subject</strong>

            <span>${capitalize(event.subject)}</span>

        </div>

        <div class="event-row">

            <strong>Type</strong>

            <span>${capitalize(event.type)}</span>

        </div>

        <div class="event-row">

            <strong>Date</strong>

            <span>${formatDate(event.date)}</span>

        </div>

        <div class="event-row">

            <strong>Time</strong>

            <span>${event.startTime} – ${event.endTime}</span>

        </div>

        <div class="event-row">

            <strong>Reminder</strong>

            <span>${event.reminder ? "Enabled" : "Disabled"}</span>

        </div>

        <div class="event-notes">

            <strong>Notes</strong>

            <p>${event.notes || "No notes."}</p>

        </div>

    </div>

    `;

    modal.classList.add("show");

    modal.querySelector(".calendar-close").onclick=()=>{

        modal.classList.remove("show");

    };

    modal.querySelector(".calendar-modal-backdrop").onclick=()=>{

        modal.classList.remove("show");

    };

};

/* =====================================================
   Utilities
===================================================== */

function capitalize(text){

    return text.charAt(0).toUpperCase()+text.slice(1);

}

function formatDate(date){

    return new Date(date).toLocaleDateString(

        undefined,

        {

            weekday:"long",

            year:"numeric",

            month:"long",

            day:"numeric"

        }

    );

}

/* =====================================================
   Global Refresh
===================================================== */

window.refreshCalendar=function(){

    if(window.studyCalendar){

        window.studyCalendar.refresh();

    }

};
