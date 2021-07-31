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

const defaultSettingsObj = {
    showTimer: true,
    showRate: true,
    showTimeRemaining: true
};
let statsDivObj;

function incrementTimer(t) {
    const previous = window.localStorage.reviewTimerTime;
    window.localStorage.reviewTimerTime = previous + t;
}

function splitToHourMinSec(timeSec) {
    const h = Math.floor(timeSec / 60 / 60);
    const min = Math.floor( (timeSec - (h*60*60)) / 60 );
    const sec = timeSec - h*60*60 - min*60;
    return {h, min, sec};
}

function getTimeString(hourMinSec) {
    const { h, min, sec } = hourMinSec;
    return (h? h+"h " : "") + (min? min+"m " : "") + (sec? sec+"s" : "");
}

function getCurrentTimerString() {
    const settings = window.localStorage.reviewTimerSettings;
    const time = window.localStorage.reviewTimerTime;
    const hourMinSec = splitToHourMinSec(time);

    let timerString = 'asd';
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
    statsDivObj = generateStatsDiv();

    // append statsDiv to header
    const header = document.getElementById('summary-button');
    header.appendChild(statsDivObj.statDiv);

    // Init default settings
    if (!window.localStorage.reviewTimerSettings) {
        window.localStorage.reviewTimerSettings = defaultSettingsObj;
    }
    // init timer to 0s
    window.localStorage.reviewTimerTime = 0;

    startTimer(1.0);
}

function showLastReviewStats() {

}

function main() {
    if(/session$/.exec(window.location.href)) { // review page
        startReviewTimer();
    } else { // review summary page
        showLastReviewStats();
    }
}

window.onload = main();