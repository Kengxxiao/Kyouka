$(".search").button('loading')
var page = 0
var maxPage = 0
var per = 10

var lastReq = ""
var lastApi = ""

var mock = false

var bossData = 
{
	scoreRate:
	[
		[
			1, 1, 1.1, 1.1, 1.2
		],
		[
			1.2, 1.2, 1.5, 1.7, 2
		]
	],
	hp: 
	[
		6000000, 8000000, 10000000, 12000000, 20000000
	],
	max: 2,
	baseTime: 1593464400
}

function processPage()
{
	if (page <= 0)
	{
		$("#prev").attr("class", "previous disabled")
	}
	else
	{
		$("#prev").attr("class", "previous")
	}
	if (page + 1 >= maxPage)
	{
		$("#next").attr("class", "next disabled")
	}
	else
	{
		$("#next").attr("class", "next")
	}
}

function calcHp(clanName, hpBase)
{
	$(".footer2").show()
	var zm = 1
	var king = 1
	var cc = 0.0
	var remain = 0.0
	var damage = 0
	var remainHp = 0.0
	var remainPer = 0.0
	while (true)
	{
		var nowZm = zm > bossData.max ? bossData.max - 1 : zm - 1
		cc += bossData.scoreRate[nowZm][king - 1] * bossData.hp[king - 1]
		if (cc > hpBase)
		{
			cc -= bossData.scoreRate[nowZm][king - 1] * bossData.hp[king - 1]
			remain = (hpBase - cc) / bossData.scoreRate[nowZm][king - 1]
			damage += remain
			remainPer = 1.0 - remain / bossData.hp[king - 1]
			remainHp = bossData.hp[king - 1] - remain
			break
		}
		damage += bossData.hp[king - 1]
		if (king == 5)
		{
			zm++
			king = 1
			continue
		}
		king++
	}
	remainPer *= 100
	$(".clanName").text(clanName)
	$(".hpDetail").text(zm + "周目" + king + "王 [" + parseInt(remainHp) + "/" + bossData.hp[king - 1] + "]")
	$(".hp").attr("style", "width: " + remainPer + "%")
	$(".hp").text(remainPer.toFixed(2) + "%")
}

function setTableData(table) 
{
	$("#clanCore").html("")
	for (var i = 0; i < table.length; i++)
	{
		var tr = $('<tr onclick=\"calcHp(\'' + table[i].clan_name + '\',' + table[i].damage + ')\">' +
		 "<td>" + table[i].rank + "</td>" +
		 "<td>" + table[i].clan_name + "</td>" +
		 "<td>" + table[i].damage + "</td>" +
		 "<td>" + table[i].leader_name + "</td>" +
		 "</tr>")
		tr.appendTo($("#clanCore"))
	}
	$(".search").button('reset')
}

var apiUrl = mock ? "http://localhost:5002/clan" : "https://service-kjcbcnmw-1254119946.gz.apigw.tencentcs.com"

function onRadioChanged() 
{
	$("#bar").val("")
    var c = $('input:radio[name="searchType"]:checked').val() 
	switch (parseInt(c)) 
	{
    case 1:
	case 4:
        $("#bar").attr("type", "number")
		break;
    case 2:
    case 3:
        $("#bar").attr("type", "text")
		break;
    default:
        return;
    }
}

function processData(data)
{
	$("#time").text(new Date(data.ts * 1000))
	maxPage = Math.ceil(data.full * 1.0 / per);
	setTableData(data.data)
	processPage()
}

function defaultPage()
{
	lastApi = "/page/"
	$.ajax(
	{
		url: apiUrl + "/default",
		type: "GET",
		dataType: "JSON",
		async: true,
		success: processData
	})
}

window.onload = defaultPage

function getPage(pageNum)
{
	if (pageNum < 0 || pageNum >= maxPage)
		return
	$(".search").button('loading') 
	page = pageNum
	$.ajax(
	{
		url: apiUrl + lastApi + pageNum,
		type: "POST",
		dataType: "JSON",
		async: true,
		contentType: "application/json",
		data: lastReq,
		success: processData
	})
}

function searchRank()
{
	$(".search").button('loading') 
	page = 0
	$.ajax(
	{
		url: apiUrl + "/line",
		type: "POST",
		dataType: "JSON",
		async: true,
		contentType: "application/json",
		success: function(data)
		{
			$("#time").text(new Date(data.ts * 1000))
			maxPage = 0
			processPage()
			setTableData(data.data)
		}
	})
}

function search() 
{
    $(".search").button('loading') 
	if ($("#bar").val() == "") 
	{
        defaultPage()
		return
    }
	var c = $('input:radio[name="searchType"]:checked').val() 
	var text = $("#bar").val()
	rank = -1
	switch (parseInt(c))
	{
		case 1:
			lastApi = "/rank/"
			rank = parseInt(text)
			break
		case 2:
			lastApi = "/name/"
			lastReq = JSON.stringify({"clanName":text})
			break
		case 3:
			lastApi = "/leader/"
			lastReq = JSON.stringify({"leaderName":text})
			break
		case 4:
			lastApi = "/score/"
			rank = parseInt(text)
			break
	}
	page = 0;
	$.ajax(
	{
		url: apiUrl + lastApi + (rank != -1 ? rank : 0),
		type: "POST",
		dataType: "JSON",
		async: true,
		contentType: "application/json",
		data: lastReq,
		success: processData
	})
}