$("#visu").hide();
let endpoint = "http://localhost:3030/Ontologie/sparql";
let cityName = [];
let localisation = [];
let res = {};
let markerArray = {};

function setupVisualisation(id){
    //switch used to know if we need to load a map or something else...
    switch (id) {
        case 1:
            $("#query").hide();
            $("#visu").show();
            $("#myChart").hide();
            let query1 = "PREFIX ar: <http://localhost:3333/> \n\
                SELECT (count(?desc) as ?countDesc) ?countryName\n\
                where {\n\
                       ?y ar:city ?countryName. \n\
                       ?y ar:description ?desc.\n\
                }\n\
                 GROUP BY ?countryName\n\
                 ORDER BY DESC(?countDesc)";

            let queryLatLong = "PREFIX ar: <http://localhost:3333/> \n\
            prefix geo:   <http://www.w3.org/2003/01/geo/wgs84_pos#> \n\
                SELECT ?lat ?long ?cityName\n\
                where {\n\
                       ?z ar:GeographicInformation ?y. \n\
                       ?y ar:city ?cityName.\n\
                       ?z ar:Coord ?i.\n\
                       ?i geo:lat ?lat.\n\
                       ?i geo:long ?long.\n\
                }";
            // RETRIEVE LAT / LONG for cityName
            let localisation = [];
            let cityName = [];
            $.ajax({
                url: endpoint,
                dataType: 'json',
                data: {
                    queryLn: 'SPARQL',
                    query: queryLatLong ,
                    limit: 'none',
                    infer: 'true',
                    Accept: 'application/sparql-results+json'
                },
                success: function(data){
                    data.results.bindings.forEach(element => {
                        if (!cityName.includes(element.cityName.value)){
                            cityName.push(element.cityName.value)
                            localisation.push({"lat":element.lat.value,"long" :element.long.value, "name": element.cityName.value});
                        }
                    });

                    $.ajax({
                        url: endpoint,
                        dataType: 'json',
                        data: {
                            queryLn: 'SPARQL',
                            query: query1 ,
                            limit: 'none',
                            infer: 'true',
                            Accept: 'application/sparql-results+json'
                        },
                        success: function(data){
                            let labels = [];
                            let dataz = [];
                            res = data;
                            //console.log(data.results.bindings);
                            data.results.bindings.forEach(function(element,index,data) {
                                localisation.forEach(function(elem, index2,localisation) {
                                    if (elem.name == element.countryName.value){
                                        localisation[index2] = {"lat":elem.lat,"long" :elem.long, "name": elem.name, "number": element.countDesc.value}
                                    }
                                })
                            });
                            var map = L.map("map");
                            L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png").addTo(map);

                            map.setView([39, -100], 5);

                            var myRenderer = L.canvas({ padding: 0.5 });
                            let radiusSize;
                            localisation.forEach(element => {
                                switch (true) {
                                    case (element.number <= 2):
                                        radiusSize = 2;
                                        break;
                                    case (element.number <= 5 ):
                                        radiusSize = 4;
                                        break;
                                    case (element.number <= 10):
                                        radiusSize = 8;
                                        break;
                                    case (element.number <= 50):
                                        radiusSize = 12;
                                        break;
                                    case (element.number <= 100):
                                        radiusSize = 16;
                                        break;
                                    case (element.number <= 300):
                                        radiusSize = 22
                                        break;
                                    case (element.number > 300):
                                        radiusSize = 28;
                                        break;
                                    }
                                L.circleMarker([Number(element.lat),Number(element.long)], {
                                    renderer: myRenderer,
                                    radius: radiusSize
                                }).addTo(map).bindPopup('Ville :  ' + element.name + ' Nombre d\'accidents' + element.number );
                            });
                        },
                        error: function(error){
                            console.log("Error:");
                            console.log(error);
                        }
                    });
                    //saveLocalisation(data);
                    //console.log(data.results.bindings);
                    /*data.results.bindings.forEach(element => {
                        if (!cityName.includes(element.cityName.value)){
                            cityName.push(element.cityName.value)
                            localisation.push({"lat":element.lat.value,"long" :element.long.value, "name": element.cityName.value});
                        }
                    });*/
                },
                error: function(error){
                    console.log("Error:");
                    console.log(error);
                }
            });

            /*$.ajax({
                url: endpoint,
                dataType: 'json',
                data: {
                    queryLn: 'SPARQL',
                    query: query1 ,
                    limit: 'none',
                    infer: 'true',
                    Accept: 'application/sparql-results+json'
                },
                success: function(data){
                    let labels = [];
                    let dataz = [];
                    res = data;
                    console.log(res);
                    //console.log(data.results.bindings);
                    data.results.bindings.forEach(element => {
                        //console.log(element)
                    });
                },
                error: function(error){
                    console.log("Error:");
                    console.log(error);
                }
            });*/
            break;
        case 2:
            $("#query").hide();
            $("#visu").show();
            $("#myChart").show();
            let query2 = "PREFIX ar: <http://localhost:3333/> \n\
                SELECT (count(?y) as ?countMeteo) ?meteoName\n\
                where {\n\
                       ?x ar:MeteoMetrics ?y. \n\
                       ?y ar:weatherCondition ?meteoName.\n\
                }\n\
                 GROUP BY ?severity ?meteoName\n\
                 ORDER BY DESC(?countMeteo)";

            $.ajax({
                url: endpoint,
                dataType: 'json',
                data: {
                    queryLn: 'SPARQL',
                    query: query2 ,
                    limit: 'none',
                    infer: 'true',
                    Accept: 'application/sparql-results+json'
                },
                success: function(data){
                    let labels = [];
                    let dataz = [];
                    console.log(data.results.bindings);
                    data.results.bindings.forEach(element => {
                        dataz.push(element.countMeteo.value);
                        labels.push(element.meteoName.value);
                    });

                    var ctx = document.getElementById('myChart').getContext('2d');
                    var myChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Nombre d\'accidents',
                                data: dataz,
                                borderWidth: 1
                            }]
                        },
                        options: {
                            scales: {
                                yAxes: [{
                                    ticks: {
                                        beginAtZero: true
                                    }
                                }]
                            }
                        }
                    });
                },
                error: function(error){
                    console.log("Error:");
                    console.log(error);
                }
            });
            break;
        case 3:
            $("#query").hide();
            $("#visu").show();
            $("#myChart").show();
            let query3 = "PREFIX ar: <http://localhost:3333/> \n\
                SELECT (count(?visibilityName) as ?countVisibility) ?severity ?visibilityName \n\
                where {\n\
                       ?x ar:MeteoMetrics ?y. \n\
                       ?x ar:severity ?severity.\n\
                       ?y ar:visibility ?visibilityName.\n\
                }\n\
                 GROUP BY ?severity ?visibilityName\n\
                 ORDER BY DESC(?countVisibility)";

            $.ajax({
                url: endpoint,
                dataType: 'json',
                data: {
                    queryLn: 'SPARQL',
                    query: query3 ,
                    limit: 'none',
                    infer: 'true',
                    Accept: 'application/sparql-results+json'
                },
                success: function(data){
                    console.log(data.results.bindings);
                    data.results.bindings.forEach(element => {

                    });

                    var ctx = document.getElementById('myChart').getContext('2d');
                    var myChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Nombre d\'accidents',
                                data: dataz,
                                borderWidth: 1,
                            }]
                        },
                        options: {
                            scales: {
                                yAxes: [{
                                    ticks: {
                                        beginAtZero: true
                                    }
                                }]
                            }
                        }
                    });
                },
                error: function(error){
                    console.log("Error:");
                    console.log(error);
                }
            });
            break;

    }
}
/*var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        document.getElementById("visu").innerHTML = this.responseText;
    }
};
xhttp.open("GET", "http://localhost:3030/Ontologie/sparql?query=PREFIX ar: <http://localhost:3333/> \n SELECT (count(?visibilityName) as ?countVisibility) ?severity ?visibilityName\n WHERE {\n ?x ar:MeteoMetrics ?y.\n ?x ar:severity ?severity.\n ?y ar:visibility ?visibilityName.\n}\nGROUP BY ?severity ?visibilityName\nORDER BY DESC(?countVisibility)", true);
xhttp.send();*/

/*function testQuery(){
    let endpoint = "http://localhost:3030/Ontologie/sparql";


    let query1 = "PREFIX ar: <http://localhost:3333/> \n\
SELECT (count(?desc) as ?countDesc) ?countryName\n\
where {\n\
       ?y ar:city ?countryName. \n\
       ?y ar:description ?desc.\n\
}\n\
 GROUP BY ?countryName\n\
 ORDER BY DESC(?countDesc)";


    let query2 = "PREFIX ar: <http://localhost:3333/> \n\
SELECT (count(?y) as ?countMeteo) ?meteoName\n\
where {\n\
       ?x ar:MeteoMetrics ?y. \n\
       ?y ar:weatherCondition ?meteoName.\n\
}\n\
 GROUP BY ?severity ?meteoName\n\
 ORDER BY DESC(?countMeteo)";


    let query3 = "PREFIX ar: <http://localhost:3333/> \n\
SELECT (count(?visibilityName) as ?countVisibility) ?severity ?visibilityName\n\
where {\n\
       ?x ar:MeteoMetrics ?y. \n\
       ?x ar:severity ?severity.\n\
       ?y ar:visibility ?visibilityName.\n\
}\n\
 GROUP BY ?severity ?visibilityName\n\
 ORDER BY DESC(?countVisibility)";

    // $('#bodyContentResearch').append(queryDataset);
    $.ajax({
        url: endpoint,
        dataType: 'json',
        data: {
            queryLn: 'SPARQL',
            query: query2 ,
            limit: 'none',
            infer: 'true',
            Accept: 'application/sparql-results+json'
        },
        success: function(data){
            let labels = [];
            let dataz = [];
            console.log(data.results.bindings);
            data.results.bindings.forEach(element => {
                dataz.push(element.countMeteo.value);
                labels.push(element.meteoName.value);
            });

            var ctx = document.getElementById('myChart').getContext('2d');
            var myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Nombre d\'accidents',
                        data: dataz,
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                }
            });
        },
        error: function(error){
            console.log("Error:");
            console.log(error);
        }
    });
}

testQuery();*/
