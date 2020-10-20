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
    var stats = {};

    // Your code here...
    function mutationListener(e) {
        var ele = e.srcElement;
        if (/^Comment by /.test(ele.getAttribute && ele.getAttribute('aria-label'))) {
            var textSpans = Array.from(ele.getElementsByTagName('span')).filter(span => span.dir == "auto");
            //console.log(textSpans[0].innerText + ": " + textSpans[1].innerText)
            //popWindow.app.chat(textSpans[0].innerText, textSpans[1].innerText)
            var msg = textSpans.pop().innerText
            var name = textSpans.pop().innerText
            var data = { "cmd": "chat", "name": name, "message": msg }
            popWindow.postMessage(data, "*")
        }

        if (ele.tagName == "IMG" && /reaction/.test(ele.src)) {
            var reaction = ele.src.split('/').pop().split('.')[0]
            var key = reaction + "s"
            stats[key] = (stats[key] || 0) + 1
        }

        var img = ele.querySelector('img');
        if (img && /reaction/.test(img.src)) {
            reaction = img.src.split('/').pop().split('.')[0]
            key = reaction + "s"
            stats[key] = (stats[key] || 0) + 1
        }
    }

    function initStats() {
        var labelElements = Array.from(document.querySelectorAll('div[aria-label]'))
        var reactionElements = labelElements.filter(div => /(people|person)$/.test(div.ariaLabel))

        reactionElements.forEach(ele => {
            var p = ele.ariaLabel.split(': ');
            var key = p[0].toLowerCase() + "s"
            stats[key] = parseInt(p[1]);
        })

    }

    function getStats() {
        var labelElements = Array.from(document.querySelectorAll('div[aria-label]'))
        var viewerElement = labelElements.filter(div => /currently watching this video/.test(div.ariaLabel))[0]
        stats.views = parseInt(viewerElement && viewerElement.innerText) || 0

        return stats
    }

    function timerListener() {
        var stats = getStats()
        var data = {"cmd": "stats", "stats": stats}
        console.log(stats)
        popWindow.postMessage(data, "*")
    }

    function start() {
        if (!timer) {
            document.addEventListener("DOMNodeInserted", mutationListener)
            timer = window.setInterval(timerListener, 5000)
            var url = "http://localhost:8000/" //"https://www.justinday.com/spt-fb-overlay/"
            popWindow = window.open(url, "_blank", "width=840,height=510,scrollbars=no")
            window.setTimeout(() => popWindow.postMessage({"cmd":"resetChat"}, "*"), 500)
            window.setTimeout(initStats, 750)
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