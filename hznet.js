var http = require('http');
var jquery = require('jquery');
var cheerio = require('cheerio');
var express = require('express');
var stylus = require('stylus');
var nib = require('nib');
var app = express();


function compile(str,path) {
	return stylus(str)
		.set('filename',path)
		.use(nib())
}
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(stylus.middleware(
	{	src: __dirname + '/public'
	,	compile: compile
	}));
app.use(express.static(__dirname + '/public'));

var dolazak = new Array();
var polazak = new Array();

function getNewPlan(customPol, customDol, customDate, customDir, callback){
	// PATH ZA HZNET
	// **POL** polazni **DOL** dolazni **DATE** datum **DIR** s vezom/bez (D/S)
	customPol=toKurac(customPol);
	customDol=toKurac(customDol);

	var defPath = "/hzinfo/default.asp?NKOD1=xxPOLxxx&ddList1=xxPOLxxx&ODH=&NKDO1=xxDOLxxx&ddList2=xxDOLxxx&DOH=&K1=&K2=&DT=xxDATExxx&DV=xxDIRxxx&Category=hzinfo&Service=Vred3&LANG=HR&SCREEN=2"
	var customPath = defPath.replace(/xxPOLxxx/gi, customPol)
							.replace(/xxDOLxxx/gi, customDol)
							.replace(/xxDATExxx/gi,customDate)
							.replace(/xxDIRxxx/gi, customDir);
	var options = {
	    host: 'vred.hzinfra.hr',
	    path: customPath,
	    headers: {"Content-Type": "text/html; charset=windows-1250"}
	}

	var request1 = http.request(options, function (res) {
		var data = new Buffer(0);
		dolazak = new Array();
		polazak = new Array();
	    res.on('data', function (chunk) {
	        data = Buffer.concat([data, chunk]);
	    });
	    res.on('end', function () {
	        var $ = cheerio.load(data);
	        console.log(decodeBuffer(data).text());
			// DOLAZAK
			$('td', 'table').filter(function (i,el){
				return $(this).attr('width') == '8%';
				}).each(function (i,link){
					if (i%2==0) dolazak.push((this).html());
					});
			// POLAZAK
			$('td', 'table').filter(function (i,el){
					return $(this).attr('width') == '10%';
				}).each(function (i,link){
					polazak.push($(this).text());
			});
			callback();
		});
	});
	request1.end();
	console.log("getNewPlan ran");
}

var popis = new Array();

function getStationsArray(callback){
	var options2 = {
    	host: 'vred.hzinfra.hr',
    	path: '/hzinfo/default.asp?Category=hzinfo&Service=vred3',
    	headers: {"Accept-Charset": "Windows-1250,utf-8;ISO-8859-3,utf-8;ISO-8859-2,utf-8", "Content-Type": "text/html; charset=ISO-8859-2" }
	}
	var request2 = http.request(options2, function (res){
		var data = new Buffer(0,'utf-8');
		res.on('data', function (chunk) {
			data = Buffer.concat([data,chunk]);
		});
		res.on('end', function () {
			var stan="";
			popis = new Array();
			var popisAlpha = new Array();
			console.log(decodeBuffer(data));
			var $ = cheerio.load(decodeBuffer(data));


			$('script').each(function (i,link){
				if (i==1){
					//popis.push("AAČŠĆŽĐ");
					stan = $(this).toString('utf-8');
					stan = stan.substring(stan.search('arrSTANICE = new Array'),stan.search('ddUtil'));
					popisAlpha = stan.split('"');
					//console.log(popisAlpha);
					for (var i=3;i<popisAlpha.length;i+=2){
						popis.push(popisAlpha[i]);
					}
				}
			});
			callback();
		});
	});
	request2.end();
	console.log("getStationsArray ran");
}

app.get("/", function (req,res) {
	getStationsArray(function (){
		res.render("intro", {"popis":popis});
		res.end();
		console.log("get /");
	});
});

app.get("/raspored", function (req,res){
	res.render("raspored", {polazak:polazak, dolazak:dolazak});
	res.end();
	console.log("get raspored");
});

app.post("/raspored", function (req,res){
	var today = new Date();
	var date = today.getDate() + '.' + (+today.getMonth()+ +1) + '.' + (today.getFullYear()).toString().substring(2,4);
	getNewPlan(req.body.polaziste, req.body.dolaziste, date, req.body.direction, function (){
		res.render("raspored", {"polazak":polazak, "dolazak":dolazak});
		res.end();
		//console.log(req.body)
	});
	console.log("post raspored");
});

app.listen(1000);

function decodeBuffer(body){
  var str = "";
  for (var i = 0; i < body.length; ++i){
   switch(body[i]){
    case 138:
     str += "Š";
     break;
    case 154:
     str += "š";
     break;
    case 208:
     str += "Đ";
     break;
    case 240:
     str += "đ";
     break;
    case 200:
     str += "Č";
     break;
    case 232:
     str += "č";
     break;
    case 198:
     str += "Ć";
     break;
    case 230:
     str += "ć";
     break;
    case 142:
     str += "Ž";
     break;
    case 158:
     str += "ž";
     break;
    default:
     str += String.fromCharCode(body[i]);
   }
  }
  return str;
}

function toKurac(str){
	str=str.replace(/Š/gi,'%8A').
			replace(/Č/gi,'%C8').
			replace(/Ć/gi,'%C6').
			replace(/Ž/gi,'%8E').
			replace(/ /gi,'+');

	return str;
}
