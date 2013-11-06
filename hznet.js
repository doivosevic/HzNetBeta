var http = require('http');
var cheerio = require('cheerio');
var express = require('express');
var stylus = require('stylus');
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

var request = http.request(options, function (res) {
	var data = new Buffer(0);
    res.on('data', function (chunk) {
        data = Buffer.concat([data, chunk]);
    });
    res.on('end', function () {
        //console.log(data);
		playWithData(data);
		displayData(data);
    });
});
request.end();


var dolazak = new Array();
var polazak = new Array();

function playWithData(data){
	var $ = cheerio.load(data);

	// DOLAZAK BOG TE JEBO
	$('td', 'table').filter(function (i,el){
		return $(this).attr('width') == '8%';
		}).each(function (i,link){
			if (i%2==0) dolazak.push((this).html());

			if (true){
				//console.log($(this).text());
				//console.log(i);
				$(this).parent().each(function(i,link){
				//console.log($(this).html());
				//console.log(":::");
				})
				//console.log(":::::");
				//console.log($(this).html());
				//console.log(":_:_:_");
				//console.log(i);
				//console.log("____________");
			}
		})

	// POLAZAK BOG TE JEBO
	$('td', 'table').filter(function (i,el){
			return $(this).attr('width') == '10%';
		}).each(function (i,link){
			//console.log($(this).text());
			polazak.push($(this).text());
	});
}

function displayData(data){
	for (var i=0;i<dolazak.length;++i)
		console.log(polazak[i] + " " + dolazak[i]);
}

app.get("/", function (req,res){
	//res.writeHead(200, {'Content-Type': 'text/plain'});
	res.render("index", {polazak:polazak, dolazak:dolazak})
	res.end();
	console.log("server running");
})
app.listen(1000);