class App {
    constructor() {
        this.start()
    }

    login() {
        FB.login(response => {
            console.log(response);
            if (response.status == "connected") {
                this.token = response.authResponse.accessToken
                this.start()
            }
        })
    }

    start() {
        if (!this.token) {
            this.chat("SYSTEM", "Use login button to connect to Facebook")
            return
        }
         
        this.resetChat()

        this.videoStartPollTime = 5000
        window.setTimeout(_ => { this.pollForVideoStart() }, this.videoStartPollTime)
    }

    chat(name, message) {
        var div = document.createElement("div")
        div.className = "message"

        var sender = document.createElement("span")
        sender.className = "sender"
        sender.innerText = name
        div.appendChild(sender)

        var text = document.createElement("span")
        text.className = "text"
        text.innerText = message
        div.appendChild(text)

        var chat = document.getElementById('chat')
        chat.appendChild(div)
        chat.scrollTop = chat.scrollHeight
    }

    resetChat() {
        document.getElementById('chat').innerHTML = ""
    }

    apiCall(endpoint, params) {
        var url = "https://graph.facebook.com/" + endpoint + "?access_token=" + this.token

        if (params)
            url += '&' + params

        return axios({ url: url }).catch(err => console.log(err))
    }

    pollForVideoStart() {
        this.chat("SYSTEM", "Waiting for live video start..")

        this.apiCall("me/live_videos").then(response => {
            var videos = response && response.status == 200 && response.data && response.data.data
            var latestVideo = videos && videos[0]

            if (latestVideo && latestVideo.status == "LIVE") {
                this.videoId = latestVideo.id
                
                this.videoStartPollTime = 5000

                this.chat("SYSTEM", "Live video has started...")

                this.commentsLookup = {}
                this.commentSource = new EventSource("https://streaming-graph.facebook.com/" +
                    this.videoId +
                    "/live_comments?access_token=" +
                    this.token +
                    "&comment_rate=one_per_two_seconds&fields=id,from{name,id},message");
                this.commentSource.onmessage = event => { this.handleComment(event) }

                this.reactionSource = new EventSource("https://streaming-graph.facebook.com/" +
                    this.videoId +
                    "/live_reactions?access_token=" +
                    this.token +
                    "&comment_rate=one_per_two_seconds&fields=reaction_stream");
                this.reactionSource.onmessage = event => { this.handleReaction(event) }

                this.viewsTimer = window.setInterval(_ => { this.pollForViews() }, 20000)

                return
            }
            else {
                this.videoStartPollTime = Math.min(this.videoStartPollTime * 1.5, 600000)

                window.setTimeout(_ => { this.pollForVideoStart() }, this.videoStartPollTime)        
            }
        })

    }

    handleComment(event) {
        var comment = JSON.parse(event.data)
        
        if (!(comment.id in this.commentsLookup)) {
            this.commentsLookup[comment.id] = true
            this.chat((comment.from && comment.from.name) || "UNKNOWN", comment.message)
        }    
    }

    handleReaction(event) {
        var reactions = JSON.parse(event.data).reaction_stream

        for (var reaction of reactions) {
            var key = reaction.key.toLowerCase() + "s"
            var old = key + "Old"

            this[old] = this[key] || 0
            this[key] = reaction.value
        }

        this.updateStats()
    }

    pollForViews() {
        this.apiCall(this.videoId, "fields=live_views").then(response => {
            console.log(response)
            var data = response && response.status == 200 && response.data && response.data
            this.viewsOld = this.views || 0
            this.views = data.live_views

            this.updateStats()
        })
    }

    updateStats() {
        var stats = document.getElementById('stats')
        stats.innerHTML = ""

        var keys = [ "views", "likes", "loves", "wows", "hahas" ]

        for (var key of keys) {
            var value = this[key] || 0

            if (value > 0) {
                var stat = document.createElement('span')
                stat.innerText = key.toUpperCase() + ": " + (this[key] || 0)

                if (this[key] > this[key + "Old"])
                    stat.className = "changed"

                stats.appendChild(stat)
            }
        }
    }

    popOut() {
        window.open(window.location.href, "_blank", "width=840,height=510,scrollbars=no")
    }

    pause() {
        this.videoStartPollTime = Number.MAX_VALUE
        window.clearInterval(this.viewsTimer)
        this.chat("SYSTEM", "Paused.  Reload to resume.")
    }

    mock() {
        this.views = 10
        this.viewsOld = 9
        this.likes = 3
        this.loves = 1
        this.hahas = 3
        this.wows = 1
        this.updateStats()

        this.chat("Justin Day", "Let's kill some robots!")
        this.chat("Bob Smith", "WTF is this even?")
        this.chat("Jerf Somalian", "Jorston!")
    }
}

var app = new App()
