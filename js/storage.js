/*
=========================================================
Study Planner
storage.js

Handles:

- localStorage
- CRUD operations
- subject filtering
- statistics
- upcoming events
=========================================================
*/

const STORAGE_KEY = "studyPlanner.events";

/* ======================================================
   DEFAULT EVENTS
====================================================== */

const DEFAULT_EVENTS = [

    {
        id: crypto.randomUUID(),
        title: "Calculus Lecture",
        subject: "mathematics",
        type: "class",
        date: "2026-08-03",
        startTime: "09:00",
        endTime: "10:30",
        reminder: true,
        notes: ""
    },

    {
        id: crypto.randomUUID(),
        title: "Physics Tutorial",
        subject: "physics",
        type: "study",
        date: "2026-08-03",
        startTime: "14:00",
        endTime: "15:30",
        reminder: true,
        notes: ""
    },

    {
        id: crypto.randomUUID(),
        title: "Organic Chemistry",
        subject: "chemistry",
        type: "class",
        date: "2026-08-04",
        startTime: "10:00",
        endTime: "11:30",
        reminder: true,
        notes: ""
    }

];


/* ======================================================
   INITIALIZE
====================================================== */

function initializeStorage(){

    if(localStorage.getItem(STORAGE_KEY))
        return;

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_EVENTS)
    );

}


/* ======================================================
   LOAD
====================================================== */

function getEvents(){

    initializeStorage();

    return JSON.parse(
        localStorage.getItem(STORAGE_KEY)
    ) || [];

}


/* ======================================================
   SAVE
====================================================== */

function saveEvents(events){

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(events)
    );

}


/* ======================================================
   CREATE
====================================================== */

function addEvent(event){

    const events = getEvents();

    event.id = crypto.randomUUID();

    events.push(event);

    saveEvents(events);

}


/* ======================================================
   UPDATE
====================================================== */

function updateEvent(id,newData){

    const events = getEvents();

    const index = events.findIndex(
        e=>e.id===id
    );

    if(index===-1)
        return false;

    events[index]={
        ...events[index],
        ...newData
    };

    saveEvents(events);

    return true;

}


/* ======================================================
   DELETE
====================================================== */

function deleteEvent(id){

    const filtered =
        getEvents().filter(
            e=>e.id!==id
        );

    saveEvents(filtered);

}


/* ======================================================
   FIND
====================================================== */

function getEvent(id){

    return getEvents().find(
        e=>e.id===id
    );

}


/* ======================================================
   SUBJECT
====================================================== */

function getSubjectEvents(subject){

    return getEvents().filter(

        e=>e.subject===subject

    );

}


/* ======================================================
   TODAY
====================================================== */

function getTodayEvents(){

    const today = new Date()
        .toISOString()
        .split("T")[0];

    return getEvents()

        .filter(

            e=>e.date===today

        )

        .sort(

            (a,b)=>

            a.startTime.localeCompare(
                b.startTime
            )

        );

}


/* ======================================================
   UPCOMING
====================================================== */

function getUpcomingEvents(limit=10){

    const today = new Date()
        .toISOString()
        .split("T")[0];

    return getEvents()

        .filter(

            e=>e.date>=today

        )

        .sort(

            (a,b)=>{

                const da =
                    a.date+a.startTime;

                const db =
                    b.date+b.startTime;

                return da.localeCompare(db);

            }

        )

        .slice(0,limit);

}


/* ======================================================
   DAY
====================================================== */

function getEventsForDate(date){

    return getEvents()

        .filter(

            e=>e.date===date

        )

        .sort(

            (a,b)=>

            a.startTime.localeCompare(
                b.startTime
            )

        );

}


/* ======================================================
   SEARCH
====================================================== */

function searchEvents(query){

    query=query.toLowerCase();

    return getEvents()

        .filter(e=>

            e.title
            .toLowerCase()
            .includes(query)

            ||

            e.notes
            .toLowerCase()
            .includes(query)

        );

}


/* ======================================================
   STATISTICS
====================================================== */

function calculateStudyHours(){

    let total=0;

    getEvents()

    .forEach(event=>{

        if(event.type!=="study")
            return;

        const start=
            event.startTime.split(":");

        const end=
            event.endTime.split(":");

        const startMin=
            (+start[0])*60+
            (+start[1]);

        const endMin=
            (+end[0])*60+
            (+end[1]);

        total+=
            (endMin-startMin);

    });

    return Math.round(total/60);

}


/* ======================================================
   SUBJECT HOURS
====================================================== */

function getSubjectHours(subject){

    let total=0;

    getSubjectEvents(subject)

    .forEach(event=>{

        const s=
            event.startTime.split(":");

        const e=
            event.endTime.split(":");

        const start=
            (+s[0])*60+
            (+s[1]);

        const end=
            (+e[0])*60+
            (+e[1]);

        total+=
            end-start;

    });

    return Math.round(total/60);

}


/* ======================================================
   STREAK
====================================================== */

function getStudyStreak(){

    const dates=new Set(

        getEvents()

        .filter(

            e=>e.type==="study"

        )

        .map(

            e=>e.date

        )

    );

    let streak=0;

    let cursor=new Date();

    while(true){

        const d=
            cursor
            .toISOString()
            .split("T")[0];

        if(!dates.has(d))
            break;

        streak++;

        cursor.setDate(
            cursor.getDate()-1
        );

    }

    return streak;

}


/* ======================================================
   EXPORT
====================================================== */

function exportEvents(){

    return JSON.stringify(
        getEvents(),
        null,
        2
    );

}


/* ======================================================
   IMPORT
====================================================== */

function importEvents(json){

    try{

        const events=
            JSON.parse(json);

        saveEvents(events);

        return true;

    }

    catch{

        return false;

    }

}


/* ======================================================
   RESET
====================================================== */

function resetEvents(){

    saveEvents(DEFAULT_EVENTS);

}


/* ======================================================
   CLEAR
====================================================== */

function clearEvents(){

    saveEvents([]);

}


/* ======================================================
   GLOBAL API
====================================================== */

window.StorageAPI={

    getEvents,

    addEvent,

    updateEvent,

    deleteEvent,

    getEvent,

    getSubjectEvents,

    getTodayEvents,

    getUpcomingEvents,

    getEventsForDate,

    searchEvents,

    calculateStudyHours,

    getSubjectHours,

    getStudyStreak,

    exportEvents,

    importEvents,

    resetEvents,

    clearEvents

};

initializeStorage();
