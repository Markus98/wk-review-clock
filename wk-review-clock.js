// ==UserScript==
// @name        WaniKani ReviewClock
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
let settings;
let time;

const timerSettingsKey = 'reviewTimerSettings';
const timerTimeKey = 'reviewTimerTime';

function setSettings(showTimer, showRate, showTimeRemaining) {
    const settingsObj = {
        showTimer,
        showRate,
        showTimeRemaining
    };
    window.localStorage.setItem(timerSettingsKey, JSON.stringify(settingsObj));
    settings = settingsObj;
}

function getSettings() {
    const settingsStr = window.localStorage.getItem(timerSettingsKey);
    return settingsStr ? JSON.parse(settingsStr) : null;
}

function incrementTimer(t) {
    time += t;
    window.localStorage.setItem(timerTimeKey, time);
}

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

function getTimeString(hourMinSec) {
    const { h, min, sec } = hourMinSec;
    return (h? h+"h " : "") + (min? min+"m " : "") + (sec? sec+"s" : "");
}

function setCurrentTimerStats() {
    const hourMinSec = splitToHourMinSec(time);

    if (settings.showTimer) {
        statHtmlElems.timer.span.textContent =  getTimeString(hourMinSec);
    }
    const reviewsDoneNumber = parseInt(document.getElementById('completed-count').textContent);
    const reviewRate = reviewsDoneNumber/time; // reviews/sec
    if (settings.showRate) {
        const formattedRate = (reviewRate*60).toFixed(1); // reviews/min
        statHtmlElems.rate.span.textContent = formattedRate + ' r/min';
    }
    const reviewsAvailableNumber = parseInt(document.getElementById('available-count').textContent);
    const timeRemaining = reviewsAvailableNumber / reviewRate; // seconds
    if (settings.showTimeRemaining) {
        let remainingStr = 'Est. ';
        if (Number.isFinite(timeRemaining)) {
            remainingStr += getTimeString(splitToHourMinSec(timeRemaining));
        } else {
            remainingStr += timeRemaining;
        }
        statHtmlElems.remaining.span.textContent = remainingStr;
    }
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
            this.timer.timerIcon.style.cssText = settings.showTimer ? "" : "display: none;";
            this.timer.timerSpan.style.cssText = settings.showTimer ? "" : "display: none;";
        }
    }
}

const setStatsDivContentAndIncrementTimer = (intervalSec) => () => {
    setCurrentTimerStats();
    incrementTimer(intervalSec);
}

function startTimer (intervalSec) {
    setInterval(setStatsDivContentAndIncrementTimer(intervalSec), intervalSec*1000);
}

function startReviewTimer() {
    // append statsDiv to header
    const header = document.getElementById('stats');
    header.appendChild(statHtmlElems.timer.icon);
    header.appendChild(statHtmlElems.timer.span);
    header.appendChild(statHtmlElems.rate.icon);
    header.appendChild(statHtmlElems.rate.span);
    header.appendChild(statHtmlElems.remaining.icon);
    header.appendChild(statHtmlElems.remaining.span);

    // Init default settings
    if (!settings) {
        setSettings(true, true, true);
    }
    // Init timer to 0s
    setTimer(0);

    // Start the timer
    startTimer(1.0);
}

function showLastReviewStats() {

}

function main() {
    settings = getSettings();
    generateStatHtmlElems();
    if(/session$/.exec(window.location.href)) { // review page
        startReviewTimer();
    } else { // review summary page
        showLastReviewStats();
    }
}

window.onload = main();