var http = require("http");

var ppath = "/hzinfo/default.asp?NKOD1=VRAP%C8E&ddList1=VRAP%C8E&ODH=&NKDO1=ZAGREB+GL.+KOL.&ddList2=ZAGREB+GL.+KOL.&DOH=&K1=&K2=&DT=04.11.13&DV=D&Category=hzinfo&Service=Vred3&LANG=HR&SCREEN=2";

var options = {
    host: 'vred.hzinfra.hr',
    path: ppath,
    headers: {"Content-Type": "text/html; charset=windows-1250"}
}

var data = new Buffer(0);

var request = http.request(options, function (res) {
    
    res.on('data', function (chunk) {
        data = Buffer.concat([data, chunk]);
    });
    res.on('end', function () {
        console.log(data);
    });
});

request.end();

http.createServer(function (req, res) {
	var webpage = data.toString();
	console.log(req.url);
	res.writeHead(200, {"Content-Type": "text/simple; charset=windows-1250"});
	res.write(webpage);

	//var s="kkkk";
	//res.write(s.replace(/k/i,"j"));

	res.end();
}).listen(1000);

