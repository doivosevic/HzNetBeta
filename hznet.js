var http = require('http');
var cheerio = require('cheerio');
var express = require('express');
var stylus = require('stylus');
var nib = require('nib');
var app = express();

// PATH ZA HZNET
var ppath1 = "/hzinfo/default.asp?NKOD1=VRAP%C8E&ddList1=VRAP%C8E&ODH=&NKDO1=ZAGREB+GL.+KOL.&ddList2=ZAGREB+GL.+KOL.&DOH=&K1=&K2=&DT=09.11.13&DV=D&Category=hzinfo&Service=Vred3&LANG=HR&SCREEN=2";
var ppath2 = "/hzinfo/default.asp?NKOD1=ZAGREB+GL.+KOL.&ddList1=ZAGREB+GL.+KOL.&ODH=&NKDO1=LUDBREG&ddList2=LUDBREG&DOH=&K1=&K2=&DT=06.11.13&DV=S&Category=hzinfo&Service=vred3&LANG=HR&SCREEN=2"
// **POL** polazni **DOL** dolazni **DATE** datum **DIR** s vezom/bez (D/S)
var defPath = "/hzinfo/default.asp?NKOD1=**POL**&ddList1=**POL**&ODH=&NKDO1=**DOL**&ddList2=**DOL**&DOH=&K1=&K2=&DT=**DATE**&DV=**DIR**&Category=hzinfo&Service=Vred3&LANG=HR&SCREEN=2"
var customPath = "";

function setPath(customPol,customDol,customDate,customDir){
	customPath = defPath.replace("**POL**", customPol).replace("**DOL**", customDol).replace("**DATE**",customDate).replace("**DIR**", customDir);
}
function setPath1(){ setPath("VRAP%C8E","ZAGREB+GL.+KOL.","11.11.13","D"); }
function setPath2(){ setPath("ZAGREB+GL.+KOL.","LUDBREG","11.11.13","S"); }

setPath1();

function compile(str,path) {
	return stylus(str)
		.set('filename',path)
		.use(nib())
}
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(stylus.middleware(
	{	src: __dirname + '/public'
	,	compile: compile
	}))
app.use(express.static(__dirname + '/public'));


var options = {
    host: 'vred.hzinfra.hr',
    path: customPath,
    headers: {"Content-Type": "text/html; charset=windows-1250"}
}

var dolazak = new Array();
var polazak = new Array();

var request1 = http.request(options, function (res) {
	var data = new Buffer(0);
    res.on('data', function (chunk) {
        data = Buffer.concat([data, chunk]);
    });
    res.on('end', function () {
        //console.log(String.fromCharCode(data));
        var $ = cheerio.load(data);

		// DOLAZAK BOG TE JEBO
		$('td', 'table').filter(function (i,el){
			return $(this).attr('width') == '8%';
			}).each(function (i,link){
				if (i%2==0) dolazak.push((this).html());
				});

		// POLAZAK BOG TE JEBO
		$('td', 'table').filter(function (i,el){
				return $(this).attr('width') == '10%';
			}).each(function (i,link){
				//console.log($(this).text());
				polazak.push($(this).text());
		});
			//displayData(data);
	});
	console.log("request1 ran");
});
request1.end();


var options2 = {
    host: 'vred.hzinfra.hr',
    path: '/hzinfo/default.asp?Category=hzinfo&Service=vred3',
    headers: {"Accept-Charset": "Windows-1250,utf-8;ISO-8859-3,utf-8;ISO-8859-2,utf-8", "Content-Type": "text/html; charset=ISO-8859-2" }
}

var popis = new Array();
var request2 = http.request(options2, function (res){
	var data = new Buffer(0);
	res.on('data', function (chunk) {
		data = Buffer.concat([data,chunk]);
	});
	res.on('end', function () {
		var stan="";
		popis = new Array();
		var popisAlpha = new Array();
		console.log(data.toString());
		var $ = cheerio.load(data);

		$('script').each(function (i,link){
			if (i==1){
				//popis.push("AAČŠĆŽĐ");
				stan = $(this).toString();
				stan = stan.substring(stan.search('arrSTANICE = new Array'),stan.search('ddUtil'));
				popisAlpha = stan.split('"');
				for (var i=3;i<popisAlpha.length;i+=2){
					popis.push(popisAlpha[i]);
				}
				for (var i=0;i<popis[4].length;++i){
					//console.log(popis[4].charCodeAt(i));
					console.log(popis[4][i]);
				}
			}
		});
	});
	console.log("request2 ran");
});
request2.end();



function displayData(data){
	for (var i=0;i<dolazak.length;++i)
		console.log(polazak[i] + " " + dolazak[i]);
}

app.get("/", function (req,res) {
	res.render("intro", {popis:popis});
	res.end();
});

app.get("/raspored", function (req,res){
	//res.writeHead(200, {'Content-Type': 'text/plain'});
	res.render("raspored", {polazak:polazak, dolazak:dolazak});
	res.end();
	console.log("server running");
});
app.listen(1000);