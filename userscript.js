// ==UserScript==
// @name         Facebook Live Video Comment / Reacton Scraper
// @namespace    http://justinday.com/
// @connect      justinday.com
// @version      0.1
// @description  Pulls comments / reactions from a live video so you can insert them into a stream
// @author       Justin Day
// @include      /^https:\/\/www\.facebook\.com\/\w*\/videos\/.*/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var popWindow;
    var timer;

    // Your code here...
    function mutationListener(e) {
        var ele = e.srcElement;
        if (/^Comment by /.test(ele.getAttribute && ele.getAttribute('aria-label'))) {
            var textSpans = Array.from(ele.getElementsByTagName('span')).filter(span => span.dir == "auto");
            //console.log(textSpans[0].innerText + ": " + textSpans[1].innerText)
            popWindow.app.chat(textSpans[0].innerText, textSpans[1].innerText)
        }
    }

    function getStats() {
        var result = {}
        var labelElements = Array.from(document.querySelectorAll('div[aria-label]'))
        var reactionElements = labelElements.filter(div => /(people|person)$/.test(div.ariaLabel))
        var viewerElement = labelElements.filter(div => /currently watching this video/.test(div.ariaLabel))[0]

        reactionElements.forEach(ele => { var p = ele.ariaLabel.split(': '); result[p[0]] = parseInt(p[1]); })
        result.views = parseInt(viewerElement && viewerElement.innerText) || 0

        return result
    }

    function timerListener() {
        var stats = getStats()
        //console.log(stats)
        for (var key in stats) {
            popWindow.app[key + "Old"] = popWindow.app[key]
            popWindow.app[key] = stats[key]
        }
        popWindow.app.updateStats()
    }

    function start() {
        if (!timer) {
            document.addEventListener("DOMNodeInserted", mutationListener)
            timer = window.setInterval(timerListener, 1000)
            var url = "https://www.justinday.com/spt-fb-overlay/"
            popWindow = window.open(url, "_blank", "width=840,height=510,scrollbars=no")
        }
    }

    function addMonitorElement() {
        var a = document.createElement(a)
        a.innerText = "MON"
        a.style.position = "absolute"
        a.style.top = "0px"
        a.style.left = "0px"
        a.href = "#"
        a.addEventListener("click", start)

        document.body.appendChild(a)
    }

    addMonitorElement();
})();