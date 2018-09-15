
var statistics = {};
var selectedSwitch = 0;

/**
 * Ajax
 * Performs an ajax request to get JSON data and then
 * feed it into the callback function
 * 
 * @param string url 
 * @param function callback 
 */
function ajax(url, callback) { 
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            // console.log('responseText:' + xmlhttp.responseText);
            try {
                var data = JSON.parse(xmlhttp.responseText);
                // console.log(data);
            } catch(err) {
                console.log(err.message + " in " + xmlhttp.responseText);
                return;
            }
            callback(data);
        }
    }; 
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

/**
 * final bit of transformation to make data displayable on chart
 * @param JSON data 
 */
function transformForChart(data){
    var d = {};
    var d1 = [];
    var i = 0;
    for (key in data) {
        switch(i++){
            case 1: color = "#7FDBFF"; break;
            case 2: color = "#39CCCC"; break;
            case 3: color = "#85144b"; break;
            case 4: color = "#3D9970"; break;
            default: color = '#0074D9';
        }
        var d = {
            "label": key,
            "data": data[key],
            "borderColor": color,
        }
        d1.push(d);
    }
    return d1;
}

/**
 * chart
 * Makes charts from JSON data
 */
function chart(){

    var selectedData = {};
    for (key in statistics) {
        value = statistics[key];
        value = value[Object.keys(value)[selectedSwitch]];
        selectedData[key] = value[Object.keys(value)[0]];
    }
    var cdata = {
        rxp: {},
        txp: {},
        rxb: {},
        txb: {}
    };
    var labels = [];
    for (key in selectedData) {
        labels.push(key);
        portsData = selectedData[key];
        for (key2 in portsData) {
            if(!(key2 in cdata['rxp'])){
                cdata['rxp'][key2] = [];
            }
            if(!(key2 in cdata['txp'])){
                cdata['txp'][key2] = [];
            }
            if(!(key2 in cdata['rxb'])){
                cdata['rxb'][key2] = [];
            }
            if(!(key2 in cdata['txb'])){
                cdata['txb'][key2] = [];
            }
            cdata['rxp'][key2].push(portsData[key2]['receive_packets']);
            cdata['txp'][key2].push(portsData[key2]['transmit_packets'])
            cdata['rxb'][key2].push(portsData[key2]['receive_bytes'])
            cdata['txb'][key2].push(portsData[key2]['transmit_bytes'])
        }
    }
    chart_rxp = {
        labels: labels,
        datasets: transformForChart(cdata['rxp']),
    }
    // console.log(chart_rxp);
    chart_txp = {
        labels: labels,
        datasets: transformForChart(cdata['txp']),
    }
    chart_rxb = {
        labels: labels,
        datasets: transformForChart(cdata['rxb']),
    }
    chart_txb = {
        labels: labels,
        datasets: transformForChart(cdata['txb']),
    }
    var ctx_rxp = document.getElementById("rx_packets").getContext('2d');
    new Chart(ctx_rxp, {
        type: 'line',
        data: chart_rxp
    });

    var ctx_txp = document.getElementById("tx_packets").getContext('2d');
    new Chart(ctx_txp, {
        type: 'line',
        data: chart_txp
    });

    var ctx_rxb = document.getElementById("rx_bytes").getContext('2d');
    new Chart(ctx_rxb, {
        type: 'line',
        data: chart_rxb
    });
    
    var ctx_txb = document.getElementById("tx_bytes").getContext('2d');
    new Chart(ctx_txb, {
        type: 'line',
        data: chart_txb
    });
    
}

/**
 * process
 * Starts the processing of data from given url
 * 
 * @param string url
 */
function process(url){
    ajax(url, function(data) {
        /**
         * Extract the switch information and store only that
         */
        sdata = {};
        for (key in data) {
            portData = data[key]['port_reply'][0]['port'];
            saveData = {};
            saveData[key] = {};
            for (key2 in portData) {
                val = portData[key2];
                saveData[key][val['port_number']] = val;
            }
            sdata[key] = saveData;
        }
        var date = new Date().toLocaleTimeString();
        statistics[date] = sdata;
        chart();
    });
}

/**
 * Trigger the process of fetching and displaying data
 */
function start(){
    var controllerIP = "192.168.99.100";
    var controllerPort = "8090";
    var statisticsURL = "http://"+controllerIP+":"+controllerPort+"/wm/core/switch/all/port/json";
    process(statisticsURL);
}

/**
 * The first function loaded on page load
 */
function main() {
    start();
    setTimeout(function(){
        var switchesGroup = document.getElementById("switches");
        var k = Object.keys(statistics)[0];
        var e = statistics[k];
        var i = 0;
        for ( k in e ){
            var el = document.createElement("button");
            var t = document.createTextNode(k);
            el.setAttribute("data",i);
            el.onclick = function(){
                var s = this.getAttribute('data');
                selectedSwitch = s;
                document.getElementById("switch").innerText = s;
                chart();
            }
            el.appendChild(t);
            switchesGroup.appendChild(el);
            i++;
        }
    },2000);
}

/**
 * Realtime updation interval
 */
var interval = window.setInterval(function(){
    start();
}, 10000);
