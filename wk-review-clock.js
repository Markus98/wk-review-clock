// ==UserScript==
// @name        WaniKani Review Clock
// @namespace   wkreviewclock
// @description 
// @include     http://www.wanikani.com/review*
// @include     https://www.wanikani.com/review*
// @version     0.1
// @author      Markus Tuominen
// @grant       none
// @license     GPL version 3 or later: http://www.gnu.org/copyleft/gpl.html
// ==/UserScript==

let statHtmlElems;
let time;
let wkOpenFrameWorkLoaded = false;

const timerTimeKey = 'reviewTimerTime';
const timerRateKey = 'reviewTimerRate';
const scriptId = 'WKReviewClock'

function setTimer(t) {
    time = t;
    window.localStorage.setItem(timerTimeKey, t);
}

function splitToHourMinSec(timeSec) {
    const h = Math.floor( timeSec/60/60 );
    const min = Math.floor( (timeSec - (h*60*60)) / 60 );
    const sec = Math.round( timeSec - h*60*60 - min*60 );
    return {h, min, sec};
}

function getTimeString(hourMinSec, includeSec=true) {
    const { h, min, sec } = hourMinSec;

    const hourString = h ? h+'h ' : '';
    
    const minuteZero = h ? '0' : '';
    const minuteString = (h||min||!includeSec) ? (minuteZero+min).slice(-2)+'m ' : '';

    const secondZero = (h||min) ? '0' : '';
    const secondString = (secondZero+sec).slice(-2)+'s';

    return hourString + minuteString + (includeSec ? secondString : '');
}

function setCurrentTimerStats() {
    // settings
    let showTimer = true;
    let showRate = true;
    let showRemaining = true;
    if (wkOpenFrameWorkLoaded) {
        showTimer = wkof.settings[scriptId].showTimer;
        showRate = wkof.settings[scriptId].showRate;
        showRemaining = wkof.settings[scriptId].showRemaining;
    }
    
    const hourMinSec = splitToHourMinSec(time);
    if (showTimer) {
        statHtmlElems.timer.span.textContent =  getTimeString(hourMinSec);
    }

    const reviewsDoneNumber = parseInt(document.getElementById('completed-count').textContent);
    const reviewRate = reviewsDoneNumber/time; // reviews/sec
    if (showRate) {
        const formattedRate = (reviewRate*3600).toFixed(1); // reviews/hour
        statHtmlElems.rate.span.textContent = formattedRate + ' r/h';
    }

    const reviewsAvailableNumber = parseInt(document.getElementById('available-count').textContent);
    const timeRemaining = reviewsAvailableNumber / reviewRate; // seconds
    if (showRemaining) {
        let remainingStr = 'Est. ';
        if (Number.isFinite(timeRemaining)) {
            remainingStr += getTimeString(splitToHourMinSec(timeRemaining), false);
        } else {
            remainingStr += '∞';
        }
        statHtmlElems.remaining.span.textContent = remainingStr;
    }

    // Set time and rate to localstorage for diplaying them later
    window.localStorage.setItem(timerTimeKey, time);
    window.localStorage.setItem(timerRateKey, reviewRate);
}

function generateStatHtmlElems() {
    // Timer time
    const timerIcon = document.createElement('i');
    timerIcon.className = 'icon-time';
    const timerSpan = document.createElement('span');
    timerSpan.id = 'wkReviewTimerTimerSpan';

    // Review completion rate
    const rateIcon = document.createElement('i');
    rateIcon.className = 'icon-bolt';
    const rateSpan = document.createElement('span');
    rateSpan.id = 'wkReviewTimerRateSpan';

    // Timer estimated remaining
    const remainingIcon = document.createElement('i');
    remainingIcon.className = 'icon-time';
    const remainingSpan = document.createElement('span');
    remainingSpan.id = 'wkReviewTimerRemainingSpan';

    statHtmlElems = {
        timer: {
            icon: timerIcon,
            span: timerSpan
        },
        rate: {
            icon: rateIcon,
            span: rateSpan
        },
        remaining: {
            icon: remainingIcon,
            span: remainingSpan
        },
        updateVisibility: function() {
            if (!wkOpenFrameWorkLoaded) return;
            const settings = wkof.settings[scriptId];
            if (settings) {
                const disp = (bool) => bool ? '' : 'display: none;';
                this.timer.icon.style.cssText = disp(settings.showTimer);
                this.timer.span.style.cssText = disp(settings.showTimer);
                this.rate.icon.style.cssText = disp(settings.showRate);
                this.rate.span.style.cssText = disp(settings.showRate);
                this.remaining.icon.style.cssText = disp(settings.showRemaining);
                this.remaining.span.style.cssText = disp(settings.showRemaining);
            }
        }
    }
    statHtmlElems.updateVisibility();

    // append statsDiv to header
    const header = document.getElementById('stats');
    header.appendChild(statHtmlElems.timer.icon);
    header.appendChild(statHtmlElems.timer.span);
    header.appendChild(statHtmlElems.rate.icon);
    header.appendChild(statHtmlElems.rate.span);
    header.appendChild(statHtmlElems.remaining.icon);
    header.appendChild(statHtmlElems.remaining.span);
}

const setStatsDivContentAndIncrementTimer = (intervalSec) => () => {
    setCurrentTimerStats();
    time += intervalSec;
}

function startTimer (intervalSec) {
    setInterval(setStatsDivContentAndIncrementTimer(intervalSec), intervalSec*1000);
}

function startReviewTimer() {
    // Init timer to 0s
    setTimer(0);
    // Start the timer with 1s interval
    startTimer(1.0);
}

function showLastReviewStats() {
    const footer = document.getElementById('last-session-date');

    const rateDiv = document.createElement('div');
    const timeDiv = document.createElement('div');
    const timeSpan = document.createElement('span');
    const rateSpan = document.createElement('span');
    timeDiv.appendChild(timeSpan);
    rateDiv.appendChild(rateSpan);
    
    const lastTime = parseFloat(localStorage.getItem(timerTimeKey));
    const lastTimeStr = getTimeString(splitToHourMinSec(lastTime));
    const lastRate = localStorage.getItem(timerRateKey);
    const lastRateStr = (parseFloat(lastRate)*3600).toFixed(1);

    timeSpan.textContent = `Duration: ${lastTimeStr}`;
    rateSpan.textContent = `Review rate: ${lastRateStr} reviews per hour`;

    footer.appendChild(timeDiv);
    footer.appendChild(rateDiv);
}

function openSettings() {
    var config = {
        script_id: scriptId,
        title: 'Review Clock Settings',
        on_save: () => {
            wkof.Settings.save(scriptId);
            statHtmlElems.updateVisibility();
        },
        content: {
            showTimer: {
                type: 'checkbox',
                label: 'Show timer',
                default: true,
                hover_tip: 'Show the elapsed time during a review session.',
            },
            showRate: {
                type: 'checkbox',
                label: 'Show review speed',
                default: true,
                hover_tip: 'Show the review rate (reviews/hour).',
            },
            showRemaining: {
                type: 'checkbox',
                label: 'Show remaining timer',
                default: true,
                hover_tip: 'Show the estimated remaining time based on the review rate and remaining items.',
            }
        }
    }
    var dialog = new wkof.Settings(config);
    dialog.open();
}

function installSettingsMenu() {
    wkof.Menu.insert_script_link({
        name:      'review_clock_settings',
        submenu:   'Settings',
        title:     'Review Clock',
        on_click:  openSettings
    });
}

async function main() {
    try {
        const wkof_modules = 'Settings,Menu';
        wkof.include(wkof_modules);
        wkOpenFrameWorkLoaded = true;
        await wkof.ready(wkof_modules)
            .then(() => wkof.Settings.load(scriptId))
            .then(installSettingsMenu);
    } catch (err) {
        if (err instanceof ReferenceError) {
            console.warn('Wanikani Open FrameWork required for adjusting WaniKani Review Clock settings.');
        } else {
            throw err;
        }
    }

    if(/session$/.exec(window.location.href)) { // review page
        await generateStatHtmlElems();
        startReviewTimer();
    } else { // review summary page
        showLastReviewStats();
    }
}

main();