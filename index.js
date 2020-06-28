$("#search").button('loading')
var page = 0;
var maxPage = 0;
var per = 10;

var lastReq = "";
var lastApi = "";

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

function setTableData(table) 
{
	$("#clanCore").html("");
	for (var i = 0; i < table.length; i++)
	{
		var tr = $("<tr>" +
		 "<td>" + table[i].rank + "</td>" +
		 "<td>" + table[i].clan_name + "</td>" +
		 "<td>" + table[i].damage + "</td>" +
		 "<td>" + table[i].leader_name + "</td>" +
		 "</tr>")
		tr.appendTo($("#clanCore"))
	}
	$("#search").button('reset')
}

var apiUrl = "https://service-kjcbcnmw-1254119946.gz.apigw.tencentcs.com"

function onRadioChanged() 
{
    var c = $('input:radio[name="searchType"]:checked').val() 
	switch (parseInt(c)) 
	{
    case 1:
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
	$("#search").button('loading') 
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

function search() 
{
    $("#search").button('loading') 
	if ($("#bar").val() == "") 
	{
        defaultPage()
		return
    }
	var c = $('input:radio[name="searchType"]:checked').val() 
	var text = $("#bar").val()
	console.log(text)
	rank = -1
	switch (parseInt(c))
	{
		case 1:
			lastApi = "/rank/"
			rank = parseInt(text)
			break;
		case 2:
			lastApi = "/name/"
			lastReq = JSON.stringify({"clanName":text})
			break;
		case 3:
			lastApi = "/leader/"
			lastReq = JSON.stringify({"leaderName":text})
			break;
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