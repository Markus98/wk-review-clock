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
let startTime;
let rateShowDelay;

const timerTimeKey = 'reviewTimerTime';
const timerRateKey = 'reviewTimerRate';
const averageStatsKey = 'reviewRateAverageStats';
const scriptId = 'WKReviewClock'

const defaultSettings = {
    showTimer: true,
    showRate: true,
    showRemaining: true,
    updateInterval: 1.0,
    enableRateShowDelay: false,
    rateShowDelay: 5,
    showTimeEstimate: true,
    averageIgnorePeriod: 3
};

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
    let showTimer = defaultSettings.showTimer;
    let showRate = defaultSettings.showRate;
    let showRemaining = defaultSettings.showRemaining;
    let hideRateRemaining = false;
    if (window.wkof) {
        showTimer = wkof.settings[scriptId].showTimer;
        showRate = wkof.settings[scriptId].showRate;
        showRemaining = wkof.settings[scriptId].showRemaining;
        const enableRateShowDelay = wkof.settings[scriptId].enableRateShowDelay;
        hideRateRemaining = enableRateShowDelay && time<rateShowDelay;
    }
    
    const hourMinSec = splitToHourMinSec(time);
    if (showTimer) {
        statHtmlElems.timer.span.textContent =  getTimeString(hourMinSec);
    }

    const reviewsDoneNumber = parseInt(document.getElementById('completed-count').textContent);
    const reviewRate = time !== 0 ? reviewsDoneNumber/time : 0; // reviews/sec
    if (showRate) {
        const formattedRate = (reviewRate*3600).toFixed(1); // reviews/hour
        statHtmlElems.rate.span.textContent = (hideRateRemaining ? '—' : formattedRate) + ' r/h';
    }

    const reviewsAvailableNumber = parseInt(document.getElementById('available-count').textContent);
    const timeRemaining = reviewsAvailableNumber / reviewRate; // seconds
    if (showRemaining) {
        let remainingStr = 'Est. ';
        if (hideRateRemaining) {
            remainingStr += '—';
        } else if (Number.isFinite(timeRemaining)) {
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
            if (!window.wkof) return;
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

function setStatsAndUpdateTime() {
    time = (new Date() - startTime)/1000;
    setCurrentTimerStats();
}

function startTimer (intervalSec) {
    startTime = new Date();
    setStatsAndUpdateTime();
    setInterval(setStatsAndUpdateTime, intervalSec*1000);
}

function getAverageStats() {
    const statsObj = JSON.parse(localStorage.getItem(averageStatsKey));
    if (statsObj) {
        return statsObj;
    } else {
        // default
        return {
            rateSum: 0,
            reviews: 0,
            mostRecentAdded: false
        };
    }
}

function setAverageStats(statsObj) {
    localStorage.setItem(averageStatsKey, JSON.stringify(statsObj));
}

function setAverageRecentAdded(bool) {
    const stats = getAverageStats();
    stats.mostRecentAdded = bool;
    setAverageStats(stats);
}

function startReviewTimer() {
    // Start the timer
    const interval = window.wkof ? parseFloat(wkof.settings[scriptId].updateInterval) : 1.0;
    startTimer(interval);
    setAverageRecentAdded(false);
}

function showLastReviewStats() {
    const footer = document.getElementById('last-session-date');

    let ignoreInterval = defaultSettings.averageIgnorePeriod*60;
    let showEstimatedSessionTime = defaultSettings.showTimeEstimate;
    // Get settings if WK Open Framework is installed
    if (window.wkof) {
        ignoreInterval = parseFloat(wkof.settings[scriptId].averageIgnorePeriod)*60;
        showEstimatedSessionTime = wkof.settings[scriptId].showTimeEstimate;
    }

    // Create divs and spans for stats in footer
    const rateDiv = document.createElement('div');
    const timeDiv = document.createElement('div');
    const timeSpan = document.createElement('span');
    const rateSpan = document.createElement('span');
    timeDiv.appendChild(timeSpan);
    rateDiv.appendChild(rateSpan);
    const estimatedTimeDiv = document.createElement('div');
    estimatedTimeDiv.style.cssText = 'font-size: 0.6em; position: relative; top: -70%;';

    // Center text in review queue count
    const reviewCountSpan = document.getElementById('review-queue-count');
    reviewCountSpan.style.cssText += 'text-align: center;';
    
    // Reset button
    const resetAvgButton = document.createElement('button');
    resetAvgButton.textContent = 'reset average';
    resetAvgButton.style.cssText = 'font-size: 0.6em; color: inherit';
    resetAvgButton.onclick = () => {
        if (confirm('Are you sure you want to reset the average review rate?')) {
            localStorage.removeItem(averageStatsKey);
            location.reload();
        }
    };
    
    // Saved time and rate
    const lastTime = parseFloat(localStorage.getItem(timerTimeKey));
    const lastTimeStr = isNaN(lastTime) ? '—' : getTimeString(splitToHourMinSec(lastTime));
    const lastRate = parseFloat(localStorage.getItem(timerRateKey));
    const lastRateStr = isNaN(lastRate) ? '—' : (lastRate*3600).toFixed(1);

    // Average rate
    const avgStats = getAverageStats();
    if (!avgStats.mostRecentAdded && lastTime > ignoreInterval && lastRate > 0) {
        avgStats.rateSum += lastRate;
        avgStats.reviews += 1;
        avgStats.mostRecentAdded = true;
        setAverageStats(avgStats);
    }
    const avgRate = avgStats.rateSum / avgStats.reviews; // reviews/second
    const avgRateStr = isNaN(avgRate) ? '—' : (parseFloat(avgRate)*3600).toFixed(1);

    // Estimate time for current reviews
    const numOfReviews = parseInt(reviewCountSpan.textContent);
    const estimatedTime = numOfReviews / avgRate;
    const estimatedTimeStr = getTimeString(splitToHourMinSec(estimatedTime), false);
    
    // Set stats text content
    timeSpan.textContent = `Duration: ${lastTimeStr}`;
    rateSpan.textContent = `Review rate: ${lastRateStr} reviews per hour (avg. ${avgRateStr} r/h) (${avgStats.reviews} sessions)`;
    estimatedTimeDiv.textContent = 
        !showEstimatedSessionTime || isNaN(estimatedTime) || numOfReviews === 0 ? 
        '' : `~${estimatedTimeStr}`;

    // Append html elements to page
    footer.appendChild(timeDiv);
    footer.appendChild(rateDiv);
    footer.appendChild(resetAvgButton);
    reviewCountSpan.appendChild(estimatedTimeDiv);
}

function openSettings() {
    var config = {
        script_id: scriptId,
        title: 'Review Clock Settings',
        on_save: () => {
            wkof.Settings.save(scriptId);
            statHtmlElems.updateVisibility();
            rateShowDelay = parseFloat(wkof.settings[scriptId].rateShowDelay)*60;
        },
        content: {
            reviewPage: {
                type: 'page',
                label: 'Review Page',
                content: {
                    showTimer: {
                        type: 'checkbox',
                        label: 'Show elapsed time',
                        default: defaultSettings.showTimer,
                        hover_tip: 'Show the elapsed time during a review session.',
                    },
                    showRate: {
                        type: 'checkbox',
                        label: 'Show review rate',
                        default: defaultSettings.showRate,
                        hover_tip: 'Show the review rate (reviews/hour).',
                    },
                    showRemaining: {
                        type: 'checkbox',
                        label: 'Show remaining time estimate',
                        default: defaultSettings.showRemaining,
                        hover_tip: 'Show the estimated remaining time based on the review rate and remaining items.',
                    },
                    divider1: {
                        type: 'divider'
                    },
                    updateInterval: {
                        type: 'number',
                        label: 'Statistics update interval (s)',
                        hover_tip: 'How often the statistic numbers should be updated (x second intervals).',
                        default: defaultSettings.updateInterval,
                        min: 0.03,
                        max: 60
                    },
                    rateShowDelayGroup: {
                        type: 'group',
                        label: 'Estimate Show Delay',
                        content: {
                            rateShowDelaySection: {
                                type: 'html',
                                html: 'Only show the review rate and remaining time estimate after the session is longer than a specified duration.'
                            },
                            enableRateShowDelay: {
                                type: 'checkbox',
                                label: 'Enabled',
                                default: defaultSettings.enableRateShowDelay,
                                hover_tip: 'Enable a delay in showing the rate and time estimate.'
                            },
                            rateShowDelay: {
                                type: 'number',
                                label: 'Duration (min)',
                                hover_tip: 'The number of minutes that the review rate and time estimate should be hidden for at the beginning of a session.',
                                default: defaultSettings.rateShowDelay,
                                min: 1
                            }
                        }
                    }
                }
            },
            summaryPage: {
                type: 'page',
                label: 'Summary Page',
                content: {
                    showTimeEstimate: {
                        type: 'checkbox',
                        label: 'Show review time estimate on summary page',
                        default: defaultSettings.showTimeEstimate,
                        hover_tip: 'Show the estimated time to complete all items in the queue on the summary page. Based on average review rate.',
                    },
                    averageIgnorePeriod: {
                        type: 'number',
                        label: 'Minimum session duration to include in the review rate average (min)',
                        hover_tip: 'The shortest duration of a session that gets included in the review rate average on the summary page.',
                        default: defaultSettings.averageIgnorePeriod,
                        min: 0
                    }
                }
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
    if (window.wkof) {
        const wkof_modules = 'Settings,Menu';
        wkof.include(wkof_modules);
        await wkof.ready(wkof_modules)
            .then(() => wkof.Settings.load(scriptId, defaultSettings))
            .then(installSettingsMenu);
        rateShowDelay = parseFloat(wkof.settings[scriptId].rateShowDelay)*60;
    } else {
        console.warn('WaniKani Review Clock: Wanikani Open FrameWork required for adjusting settings. '
            + 'Installation instructions can be found here: https://community.wanikani.com/t/installing-wanikani-open-framework/28549');
    }

    if(/session$/.exec(window.location.href)) { // review page
        await generateStatHtmlElems();
        startReviewTimer();
    } else { // review summary page
        showLastReviewStats();
    }
}

main();