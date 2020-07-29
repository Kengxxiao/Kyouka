var app = new Vue({
    el: "#Kyouka",
    data: {
        showData: {
            header: ["排名", "公会名", "分数", "会长名", "收藏"],
            time: "",
            body: [],
        },
        historyData: [],
        inputtype: "text",
        selected: 2,
        selectType: { "2": "按公会名", "1": "按排名", "3": "按会长名", "4": "按分数" },
        selectdata: "",
        pageinfo: {
            page: 0,
            maxPage: 0,
            limit: 10,
            show: "",
            prevDis: "disabled",
            nextDis: "disabled",
        },
        lastReq: JSON.stringify({ history: 0 }),
        lastApi: "",
        mock: true,
        allow: true,
        waitTime: 1,
        nowHistoryTime: 0,
        bossData: {
            scoreRate: [
                [1, 1, 1.1, 1.1, 1.2],
                [1.2, 1.2, 1.5, 1.7, 2],
            ],
            hp: [6000000, 8000000, 10000000, 12000000, 20000000],
            max: 2,
            baseTime: 1593464400,
            endTime: 1593964800,
        },
        apiUrl: "https://service-kjcbcnmw-1254119946.gz.apigw.tencentcs.com/",
        foot2show: false,
        foot2Info: {
            clanName: "",
            zminfo: "",
            per: "",
            perText: "",
        },
        proTableData: [],
        favSelected: [],
    },
    computed: {
        selectRange() {
            const { selected, selectdata } = this;
            return {
                selected,
                selectdata,
            };
        },
    },
    watch: {
        selectRange: {
            handler(ndata, odata) {
                let val = ndata.selected;
                if (val != odata.selected) {
                    this.selectdata = "";
                }
                switch (parseInt(val)) {
                    case 1:
                        this.lastApi = "/rank/";
                        this.rank = parseInt(this.selectdata);
                        this.lastReq = JSON.stringify({ history: parseInt(this.nowHistoryTime) });
                        this.inputtype = "number";
                        break;
                    case 4:
                        this.lastApi = "/score/";
                        this.rank = parseInt(this.selectdata);
                        this.lastReq = JSON.stringify({ history: parseInt(this.nowHistoryTime) });
                        this.inputtype = "number";
                        break;
                    case 2:
                        this.lastApi = "/name/";
                        this.lastReq = JSON.stringify({ history: parseInt(this.nowHistoryTime), clanName: this.selectdata });
                        this.inputtype = "text";
                        break;
                    case 3:
                        this.lastApi = "/leader/";
                        this.lastReq = JSON.stringify({ history: parseInt(this.nowHistoryTime), leaderName: this.selectdata });
                        this.inputtype = "text";
                        break;
                    default:
                        return;
                }
            },
            deep: true,
            immediate: false,
        },
        proTableData: function (val) {
            $(".navbar-collapse").collapse("hide");
        },
    },
    mounted() {
        let type = this.getUrlKey("type", window.location.href);
        let data = this.getUrlKey("data", window.location.href);
        if (type != null && data != null) {
            this.selected = type;
            this.selectdata = data;
            setTimeout(() => {
                this.search();
            }, 300);
            return;
        }
        $(document).ajaxSend(function (ev, xhr, settings) {
            xhr.setRequestHeader("Custom-Source", "KyoukaOfficial");
        });
        this.defaultPage();
    },
    methods: {
        disableMirror() {
            if (navigator.cookieEnabled) {
                Cookies.set("mirror", "", { expires: 90 });
            }
            $("#mirror").hide();
        },
        convertTime(date) {
            return new Date(date * 1000).toLocaleString([], { minute: "numeric", hour: "numeric", day: "numeric", month: "narrow", year: "numeric" });
        },
        serverError(xhr, state, errorThrown) {
            $(".search").button("reset");
            if (xhr.responseJSON == undefined) {
                alert("无法连接到服务器，请刷新后重试");
                return;
            }
            alert(xhr.responseJSON.msg);
        },
        transPage() {
            var p = prompt("请输入要跳转的页码");
            if (p != null) {
                var g = parseInt(p);
                if (!isNaN(g)) {
                    if (g <= 0 || g > this.pageinfo.maxPage) {
                        alert("页码超出范围，请重试");
                    } else {
                        this.pageinfo.page = g - 1;
                        this.getPage(this.pageinfo.page);
                    }
                }
            }
        },
        processPage() {
            this.allow = false;
            setTimeout(() => {
                this.allow = true;
            }, this.waitTime * 1000);
            this.pageinfo.show = this.pageinfo.page + 1 + "/" + (this.pageinfo.maxPage == 0 ? 1 : this.pageinfo.maxPage);

            if (this.pageinfo.page <= 0) {
                this.pageinfo.prevDis = "disabled";
            } else {
                this.pageinfo.prevDis = "";
            }
            if (this.pageinfo.page + 1 >= this.pageinfo.maxPage) {
                this.pageinfo.nextDis = "disabled";
            } else {
                this.pageinfo.nextDis = "";
            }
        },
        getPage(val) {
            if (!this.allow) {
                alert("休息一下再翻页吧");
                return;
            }
            if (val < 0 || val >= this.pageinfo.maxPage) return;
            $(".search").button("loading");
            $.ajax({
                url: this.apiUrl + this.lastApi + val,
                type: "POST",
                dataType: "JSON",
                async: true,
                contentType: "application/json",
                data: this.lastReq,
                success: this.processData,
                error: this.serverError,
            });
            this.pageinfo.page = val;
        },
        reset() {
            this.pageinfo.page = 0;
            this.nowHistoryTime = 0;
            this.lastReq = JSON.stringify({ history: 0 });
            this.defaultPage();
        },
        showfoot() {
            this.foot2show = true;
        },
        setFootPer(remainPer) {
            this.showfoot();
            setTimeout(
                () => {
                    this.foot2Info.per = "width: " + remainPer + "%";
                    this.foot2Info.perText = remainPer.toFixed(2) + "%";
                },
                this.foot2show ? 0 : 100
            );
        },
        calcHp(clan) {
            let clanName = clan.clan_name;
            let hpBase = clan.damage;
            var zm = 1;
            var king = 1;
            var cc = 0.0;
            var remain = 0.0;
            var damage = 0;
            var remainHp = 0.0;
            var remainPer = 0.0;
            while (true) {
                var nowZm = zm > this.bossData.max ? this.bossData.max - 1 : zm - 1;
                cc += this.bossData.scoreRate[nowZm][king - 1] * this.bossData.hp[king - 1];
                if (cc > hpBase) {
                    cc -= this.bossData.scoreRate[nowZm][king - 1] * this.bossData.hp[king - 1];
                    remain = (hpBase - cc) / this.bossData.scoreRate[nowZm][king - 1];
                    damage += remain;
                    remainPer = 1.0 - remain / this.bossData.hp[king - 1];
                    remainHp = this.bossData.hp[king - 1] - remain;
                    break;
                }
                damage += this.bossData.hp[king - 1];
                if (king == 5) {
                    zm++;
                    king = 1;
                    continue;
                }
                king++;
            }
            remainPer *= 100;

            this.foot2Info.clanName = clanName;
            this.foot2Info.zminfo = zm + "周目" + king + "王 [" + parseInt(remainHp) + "/" + this.bossData.hp[king - 1] + "]";
            this.setFootPer(remainPer);
        },
        searchFav() {
            $(".search").button("loading");
            this.pageinfo.page = 0;
            var favc = JSON.parse(Cookies.get("fav"));
            for (var i = 0; i < favc.length; i++) {
                ga("send", "event", "kyouka", "fav", favc[i]);
            }
            $.ajax({
                url: this.apiUrl + "/fav",
                type: "POST",
                dataType: "JSON",
                async: true,
                contentType: "application/json",
                data: JSON.stringify({ ids: JSON.parse(Cookies.get("fav")), history: parseInt(this.nowHistoryTime) }),
                success: this.processData,
                error: this.serverError,
            });
        },
        favLeader(id) {
            let leaderId = this.proTableData[id].leader_viewer_id;
            var fav = JSON.parse(Cookies.get("fav"));
            var idx = fav.indexOf(leaderId);
            if (idx == -1) {
                if (fav.length >= 5) {
                    alert("收藏过多，请取消一些收藏的公会");
                    return;
                }
                fav.push(leaderId);
                this.favSelected[id] = "glyphicon glyphicon-heart";
            } else {
                fav.splice(idx, 1);

                this.favSelected[id] = "glyphicon glyphicon-heart-empty";
            }
            this.$forceUpdate();
            Cookies.set("fav", JSON.stringify(fav), { expires: 30 });
        },
        setTableData(table) {
            this.favSelected = [];
            this.showData.body = [];
            for (let item of table) {
                if (item.clan_name == undefined) {
                    item.clan_name = "该行会已解散";
                }
                let tableData = {
                    rank: item.rank,
                    clan_name: item.clan_name,
                    damage: item.damage,
                    leader_name: item.leader_name,
                };
                this.showData.body.push(tableData);
                this.favSelected.push("glyphicon glyphicon-heart-empty");
            }
            if (navigator.cookieEnabled) {
                if (Cookies.get("fav") == undefined) {
                    Cookies.set("fav", "[]", { expires: 30 });
                }
                var fav = JSON.parse(Cookies.get("fav"));
                for (let f of fav) {
                    let xid = 0;
                    for (let t of table) {
                        if (t.leader_viewer_id == f) {
                            this.favSelected[xid] = "glyphicon glyphicon-heart";
                        }
                        xid = xid + 1;
                    }
                }
            }
            this.proTableData = table;
            $(".search").button("reset");
        },
        historyRank(time) {
            this.pageinfo.page = 0;
            this.nowHistoryTime = time;
            this.lastReq = JSON.stringify({ history: parseInt(time) });
            this.defaultPage();
        },
        processHistory(data) {
            $(".navbar-collapse").collapse("hide");
            this.historyData = [];
            for (var i = 0; i < data.length; i++) {
                let his = {
                    time: data[i],
                    date: this.convertTime(data[i]),
                };
                this.historyData.push(his);
            }
        },
        processData(data) {
            if (data.history != undefined) {
                this.processHistory(data.history);
            }
            this.showData.time = this.convertTime(data.ts);
            this.pageinfo.maxPage = Math.ceil((data.full * 1.0) / this.pageinfo.limit);
            this.setTableData(data.data);
            this.processPage();
        },
        defaultPage() {
            $(".search").button("loading");
            this.pageinfo.page = 0;
            this.lastApi = "/page/";
            if (this.nowHistoryTime == 0) {
                $.ajax({
                    url: this.apiUrl + "/default",
                    type: "GET",
                    dataType: "JSON",
                    async: true,
                    success: this.processData,
                    error: this.serverError,
                });
            } else {
                $.ajax({
                    url: this.apiUrl + "/page/0",
                    type: "POST",
                    dataType: "JSON",
                    contentType: "application/json",
                    async: true,
                    data: JSON.stringify({ history: parseInt(this.nowHistoryTime) }),
                    success: this.processData,
                    error: this.serverError,
                });
            }
        },
        searchRank() {
            $(".search").button("loading");
            this.pageinfo.page = 0;
            $.ajax({
                url: this.apiUrl + "/line",
                type: "POST",
                dataType: "JSON",
                async: true,
                contentType: "application/json",
                data: JSON.stringify({ history: parseInt(this.nowHistoryTime) }),
                success: (data) => {
                    this.showData.time = this.convertTime(data.ts);
                    this.processData(data);
                },
                error: this.serverError,
            });
        },

        search() {
            if (this.selectdata == "") {
                this.defaultPage();
                return;
            }
            if (!this.rank) {
                this.rank = -1;
            }
            this.pageinfo.page = 0;
            $.ajax({
                url: this.apiUrl + this.lastApi + (this.rank != -1 ? this.rank : 0),
                type: "POST",
                dataType: "JSON",
                async: true,
                contentType: "application/json",
                data: this.lastReq,
                success: this.processData,
                error: this.serverError,
            });
            //ga('send', 'event', 'kyouka', 'search', this.lastReq)
        },
        getUrlKey(name, url) {
            return decodeURIComponent((new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(url) || [, ""])[1].replace(/\+/g, "%20")) || null;
        },
    },
});
