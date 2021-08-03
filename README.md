# WaniKani Review Clock
This is a userscript for the Japanese Kanji character learning website [WaniKani](https://www.wanikani.com/). It adds time and completion rate statistics to the top of a review session.

## Install
The script requires a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) to be installed.

Then the script can be installed via [GreasyFork](https://greasyfork.org/en/scripts/430247-wanikani-review-clock). 

Alternatively you can just copy the code manually or view the raw data of `wk-review-clock.user.js` and Tampermonkey will automatically recognize the user script and prompt install.

### WaniKani Open Framework required for Settings
To be able to adjust settings, an additional userscript is required: [WaniKani Open Framework](https://greasyfork.org/en/scripts/38582-wanikani-open-framework).

The settings menu is implemented with this framework, thus it is needed to adjust settings. Default settings will be applied if the script is not installed. More information about WKOF can be found [here](https://community.wanikani.com/t/installing-wanikani-open-framework/28549).

## Screenshots and more information
There is additional information on the [userscript announcement post](https://community.wanikani.com/t/userscript-wanikani-review-clock/52812) on the WaniKani Community forums.

## TODO:
- [ ] start timer after first question answered?
- [ ] pause timer feature?