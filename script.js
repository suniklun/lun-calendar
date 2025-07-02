const monthYear = document.getElementById('monthYear');
const calendarBody = document.getElementById('calendarBody');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const todayBtn = document.getElementById('todayBtn');

let today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

// 儲存與載入事件資料
function getStorageKey(year, month) {
    return `calendar-events-${year}-${month+1}`;
}
function loadEvents(year, month) {
    const key = getStorageKey(year, month);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {};
}
function saveEvents(year, month, events) {
    const key = getStorageKey(year, month);
    localStorage.setItem(key, JSON.stringify(events));
}

let events = loadEvents(currentYear, currentMonth);
let selectedCell = null;
let selectedDate = null;
let editingEventId = null;

function animateCalendar() {
    calendarBody.classList.remove('calendar-animate');
    void calendarBody.offsetWidth; // 觸發重繪
    calendarBody.classList.add('calendar-animate');
}

function renderCalendar(month, year) {
    monthYear.textContent = `${year}年${month + 1}月`;
    calendarBody.innerHTML = '';
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    events = loadEvents(year, month);
    let date = 1;
    for (let i = 0; i < 6; i++) { // 固定6行
        let row = document.createElement('tr');
        for (let j = 0; j < 7; j++) {
            let cell = document.createElement('td');
            if (i === 0 && j < firstDay) {
                cell.textContent = '';
            } else if (date > daysInMonth) {
                cell.textContent = '';
            } else {
                cell.textContent = date;
                if (
                    date === today.getDate() &&
                    month === today.getMonth() &&
                    year === today.getFullYear()
                ) {
                    cell.classList.add('today');
                }
                // 顯示事件提示（有事件加深底色）
                if (events[date] && events[date].length > 0) {
                    cell.style.background = '#e0e0e0';
                    cell.title = events[date].map(e => e.title).join('\n');
                } else {
                    cell.title = '';
                }
                date++;
            }
            row.appendChild(cell);
        }
        calendarBody.appendChild(row);
    }
    animateCalendar();
}

prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar(currentMonth, currentYear);
});

nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
});

todayBtn.addEventListener('click', () => {
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();
    renderCalendar(currentMonth, currentYear);
});

renderCalendar(currentMonth, currentYear);

// 彈窗相關
const modal = document.getElementById('inputModal');
const eventInput = document.getElementById('eventInput');
const saveEventBtn = document.getElementById('saveEvent');
const closeModalBtn = document.getElementById('closeModal');

calendarBody.addEventListener('click', function(e) {
    if (e.target.tagName === 'TD' && e.target.textContent !== '') {
        selectedCell = e.target;
        selectedDate = selectedCell.textContent;
        showEventModal(selectedDate);
    }
});

function showEventModal(date) {
    // 清空表單
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDesc').value = '';
    document.getElementById('startTime').value = '';
    document.getElementById('endTime').value = '';
    document.getElementById('allDay').checked = false;
    editingEventId = null;
    // 顯示事件列表
    renderEventList(date);
    modal.classList.add('active');
}

function renderEventList(date) {
    const eventListDiv = document.getElementById('eventList');
    eventListDiv.innerHTML = '';
    const dayEvents = events[date] || [];
    dayEvents.forEach((ev, idx) => {
        const div = document.createElement('div');
        div.className = 'event-item';
        let timeStr = '';
        if (ev.allDay) {
            timeStr = '<span class="event-time">全天</span>';
        } else if (ev.startTime && ev.endTime) {
            timeStr = `<span class="event-time">${ev.startTime}~${ev.endTime}</span>`;
        } else if (ev.startTime) {
            timeStr = `<span class="event-time">${ev.startTime}</span>`;
        }
        div.innerHTML = `<span class="event-title">${ev.title}</span>` +
            timeStr +
            (ev.desc ? `<span class="event-desc">${ev.desc}</span>` : '') +
            `<button class='event-del-btn' title='刪除' data-idx='${idx}'>刪</button>`;
        div.onclick = (e) => {
            if (e.target.classList.contains('event-del-btn')) return;
            document.getElementById('eventTitle').value = ev.title;
            document.getElementById('eventDesc').value = ev.desc || '';
            document.getElementById('allDay').checked = !!ev.allDay;
            document.getElementById('startTime').value = ev.startTime || '';
            document.getElementById('endTime').value = ev.endTime || '';
            editingEventId = ev.id;
            // 高亮選中
            Array.from(eventListDiv.children).forEach(c => c.classList.remove('selected'));
            div.classList.add('selected');
            document.getElementById('deleteEvent').classList.add('show');
        };
        eventListDiv.appendChild(div);
    });
    // 刪除按鈕事件
    eventListDiv.querySelectorAll('.event-del-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.getAttribute('data-idx'));
            const itemDiv = eventListDiv.children[idx];
            itemDiv.classList.add('removing');
            setTimeout(() => {
                const dayEvents = events[date] || [];
                const delId = dayEvents[idx].id;
                events[date] = dayEvents.filter(ev => ev.id !== delId);
                saveEvents(currentYear, currentMonth, events);
                renderEventList(date);
                renderCalendar(currentMonth, currentYear);
                eventForm.reset();
                editingEventId = null;
                document.getElementById('deleteEvent').classList.remove('show');
            }, 400);
        };
    });
    document.getElementById('deleteEvent').classList.remove('show');
}

// 全天切換時，時間欄位自動禁用
const allDayCheckbox = document.getElementById('allDay');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
allDayCheckbox.addEventListener('change', function() {
    startTimeInput.disabled = this.checked;
    endTimeInput.disabled = this.checked;
    if (this.checked) {
        startTimeInput.value = '';
        endTimeInput.value = '';
    }
});

// 新增/儲存事件
const eventForm = document.getElementById('eventForm');
eventForm.onsubmit = function(e) {
    e.preventDefault();
    const title = document.getElementById('eventTitle').value.trim();
    const desc = document.getElementById('eventDesc').value.trim();
    const allDay = document.getElementById('allDay').checked;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    if (!title) return;
    if (!allDay && startTime && endTime && startTime > endTime) {
        alert('結束時間不可早於開始時間');
        return;
    }
    let dayEvents = events[selectedDate] || [];
    if (editingEventId) {
        // 編輯
        dayEvents = dayEvents.map(ev => ev.id === editingEventId ? { ...ev, title, desc, allDay, startTime, endTime } : ev);
    } else {
        // 新增
        const id = Date.now() + Math.random().toString(36).slice(2,8);
        dayEvents.push({ id, title, desc, allDay, startTime, endTime });
    }
    events[selectedDate] = dayEvents;
    saveEvents(currentYear, currentMonth, events);
    renderEventList(selectedDate);
    renderCalendar(currentMonth, currentYear);
    // 清空表單
    eventForm.reset();
    editingEventId = null;
    return false;
};

// 事件刪除動畫
const deleteEventBtn = document.getElementById('deleteEvent');
deleteEventBtn.onclick = function() {
    if (!editingEventId) return;
    let dayEvents = events[selectedDate] || [];
    const idx = dayEvents.findIndex(ev => ev.id === editingEventId);
    if (idx !== -1) {
        const eventListDiv = document.getElementById('eventList');
        const itemDiv = eventListDiv.children[idx];
        itemDiv.classList.add('removing');
        setTimeout(() => {
            dayEvents = dayEvents.filter(ev => ev.id !== editingEventId);
            events[selectedDate] = dayEvents;
            saveEvents(currentYear, currentMonth, events);
            renderEventList(selectedDate);
            renderCalendar(currentMonth, currentYear);
            eventForm.reset();
            editingEventId = null;
            deleteEventBtn.classList.remove('show');
        }, 400);
    }
};

// 關閉彈窗
closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    eventForm.reset();
    editingEventId = null;
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
        eventForm.reset();
        editingEventId = null;
    }
});

// 自動儲存（輸入框失焦或按下 Enter 即儲存）
eventInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        saveEvent();
    }
});
eventInput.addEventListener('blur', saveEvent);

function saveEvent() {
    if (selectedCell && selectedCell.textContent !== '') {
        const value = eventInput.value.trim();
        if (value) {
            events[selectedCell.textContent] = value;
            selectedCell.title = value;
            selectedCell.style.background = '#e0e0e0';
        } else {
            delete events[selectedCell.textContent];
            selectedCell.title = '';
            selectedCell.style.background = '';
        }
        saveEvents(currentYear, currentMonth, events);
    }
    modal.classList.remove('active');
}

saveEventBtn.addEventListener('click', saveEvent); 