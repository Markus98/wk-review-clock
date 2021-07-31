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

let statsDivObj;
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

function getCurrentTimerString() {
    const hourMinSec = splitToHourMinSec(time);

    let timerString = '';
    if (settings.showTimer) {
        timerString += 'Elapsed: ' + getTimeString(hourMinSec) + '\n';
    }
    const reviewsDoneNumber = parseInt(document.getElementById('completed-count').textContent);
    const reviewRate = reviewsDoneNumber/time; // reviews/sec
    if (settings.showRate) {
        const formattedRate = (reviewRate*60).toFixed(1); // reviews/min
        timerString += 'Rate: ' + formattedRate + ' reviews/min\n';
    }
    const reviewsAvailableNumber = parseInt(document.getElementById('available-count').textContent);
    const timeRemaining = reviewsAvailableNumber / reviewRate; // seconds
    if (settings.showTimeRemaining) {
        timerString += 'Est. Remaining: ' + getTimeString(splitToHourMinSec(timeRemaining));
    }
    return timerString;
}

function generateStatsDiv() {
    const statDiv = document.createElement('div');
    statDiv.id = 'wkReviewTimerStats';
    const timerSpan = document.createElement('span');
    timerSpan.id = 'wkReviewTimerTimerSpan';
    timerSpan.textContent = 'Timer start';
    statDiv.appendChild(timerSpan);
    return { statDiv, timerSpan };
}

const setStatsDivContentAndIncrementTimer = (intervalSec) => () => {
    statsDivObj.timerSpan.textContent = getCurrentTimerString();
    incrementTimer(intervalSec);
}

function startTimer (intervalSec) {
    setInterval(setStatsDivContentAndIncrementTimer(intervalSec), intervalSec*1000);
}

function startReviewTimer() {
    // append statsDiv to header
    const header = document.getElementById('summary-button');
    header.appendChild(statsDivObj.statDiv);

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
    statsDivObj = generateStatsDiv();
    if(/session$/.exec(window.location.href)) { // review page
        startReviewTimer();
    } else { // review summary page
        showLastReviewStats();
    }
}

window.onload = main();