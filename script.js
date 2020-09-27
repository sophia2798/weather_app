// Function to display history
var ind;
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};
function displayHistory() {
    for (var j=0; j<JSON.parse(localStorage.cities).length; j++) {
        // console.log(j);
        ind = JSON.parse(localStorage.cities)[j]
        var indCap = toTitleCase(ind);
        // console.log(ind);
        document.querySelector("#hist"+j).textContent = indCap;
    };
};

if (localStorage.cities != null) {
    displayHistory();
    callAPI(JSON.parse(localStorage.cities)[0]);
}

// Function to call information from API
function callAPI(city) {
    // Call API
    $.ajax({
        url: "http://api.openweathermap.org/data/2.5/weather?q="+city+"&appid=e0b82fbe866155125ec89e15985f0d60",
        method: "GET"
    }).then(function(response) {
        // console.log(response)
        var currentDate = new Date(response.dt*1000);
        // console.log(currentDate.toLocaleDateString("en-US"))
        $("#city-name").text(response.name+" ("+currentDate.toLocaleDateString("en-US")+")"+" : "+response.weather[0].main);
        $("hr").css("display","block")
        $("#weather-icon").attr("src","https://openweathermap.org/img/wn/"+response.weather[0].icon+"@2x.png")
        var tempC = (parseInt(response.main.temp)-273.15).toFixed(0);
        var tempF = parseInt(tempC * 9/5 +32).toFixed(0);
        $("#temp").text("Temperature: "+tempC+String.fromCharCode(176)+"C / "+tempF+String.fromCharCode(176)+"F");
        $("#humidity").text("Humidity: "+response.main.humidity+"%");
        var windMPH = (parseInt(response.wind.speed) * 2.237).toFixed(1);
        $("#wind").text("Wind Speed: "+response.wind.speed+"mps / "+windMPH+"mph")

        // UV Index
        var lon = response.coord.lon;
        var lat = response.coord.lat;
        $.ajax({
            url: "http://api.openweathermap.org/data/2.5/uvi?appid=e0b82fbe866155125ec89e15985f0d60&lat="+lat+"&lon="+lon,
            method: "GET"
        }).then(function(response) {
            // console.log(response)
            $("#uv").empty();
            $("#uv-index").empty();
            $("#uv").html("UV Index:&nbsp");
            $("#uv").css("padding","5px 0")
            $("#uv-index").text(response.value)
            $("#uv-index").css("padding","5px 8px");
            $("#uv-index").css("border-radius","5px");
            $("#uv-index").css("border","1px solid rgb(212,211,207");
            if (response.value < 3) {
                $("#uv-index").css("background-color","green")
            }
            else if (response.value >= 3 && response.value < 6) {
                $("#uv-index").css("background-color","yellow")
            }
            else if (response.value >= 6) {
                $("#uv-index").css("background-color","red")
            }
        })

        // Get local time
        $.ajax({
            url: "http://api.timezonedb.com/v2.1/get-time-zone?key=7KWZ0204P6RY&format=json&by=position&lng="+lon+"&lat="+lat,
            method: "GET"
        }).then(function(response) {
            // console.log(response)
            var time = response.formatted.slice(11,16);
            // console.log(time);
            var local = moment(time, "hh:mm").format('hh:mm a');
            $("#local-time").text("Local Time: "+local)
        });
    })

    // Get 5-day forecast
    $.ajax({
        url: "https://api.openweathermap.org/data/2.5/forecast?q="+city+"&appid=e0b82fbe866155125ec89e15985f0d60",
        method: "GET"
    }).then(function(response) {
        console.log(response)
        // Create an array for each 24 hour interval index
        var dailyInd = [0,8,16,24,32];
        $("#day-blocks").empty();
        dailyInd.forEach(function(index) {
            var block = $("<div>");
            $("#day-blocks").append(block);
            block.addClass("card daily col-2");
            block.attr("id","daily"+index);
            // var card = $("<div>");
            // $("#dailyBlock").append(card);
            // card.addClass("card-body");
            // card.attr("id","card");
            var h4 = $("<h4>");
            var forecastDate = new Date(response.list[index].dt * 1000);
            h4.text(forecastDate.toLocaleDateString("en-US"));
            // $(".card-body").append(h4);
            var forecastImg = $("<img>");
            forecastImg.attr("src","https://openweathermap.org/img/wn/"+response.list[index].weather[0].icon+"@2x.png");
            forecastImg.css("max-width","100px");
            forecastImg.css("margin","0 auto");
            forecastImg.addClass("forecast-img")
            // $(".card-body").append(forecastImg);
            var forecastTemp = $("<p>");
            forecastTemp.addClass("forecast-p")
            var C = (parseInt(response.list[index].main.temp)-273.15).toFixed(0);
            var F = parseInt(C * 9/5 + 32).toFixed(0);
            forecastTemp.text("Temperature: "+C+String.fromCharCode(176)+"C / "+F+String.fromCharCode(176)+"F");
            // $(".card-body").append(forecastTemp);
            var forecastHumid = $("<p>");
            forecastHumid.addClass("forecast-p");
            forecastHumid.text("Humidity: "+response.list[index].main.humidity+"%");
            // $(".card-body").append(forecastHumid);
            $("#daily"+index).append(h4,forecastImg,forecastTemp,forecastHumid);
        })
    })
}

// Click event for submit button
$("#submit-btn").on("click", function() {
    event.preventDefault();
    $("#forecast-header").css("display","block");
    function exit() {
        $(".modal").hide();
        $(".wrapper").removeClass("is-blurred");
        $("header").removeClass("is-blurred");
    }
    var inputCity = $("#name-input").val();
    // Edge case if no name is entered
    if (inputCity === "") {
        $(".wrapper").addClass("is-blurred");
        $("header").addClass("is-blurred");
        $(".modal").show();
        $("#close-btn").click(exit);
        $("#x-btn").click(exit);
        $(".modal").click(function(event){
            if(event.target != this) return;
            exit();
        })
    }
    // If city name is entered, pull weather information using AJAX and openweathermap API
    else {
        // console.log(inputCity)
        $("#name-input").val("");
        callAPI(inputCity);
        // Log the past searches into the search history using localStorage 
        var searchHistory = [];
        var storedNames = localStorage.getItem("cities");
        if (storedNames === null) {
            storedNames = [];
        }
        else {
            storedNames = JSON.parse(storedNames);
        };

        if (storedNames.length > 9) {
            storedNames.pop();
            storedNames.unshift(inputCity);
        }
        else {
            storedNames.unshift(inputCity);
        }

        localStorage.setItem("cities",JSON.stringify(storedNames));
        displayHistory();
    }
})

$("tr").on("click", function() {
    // console.log($(this).text())
    event.preventDefault();
    callAPI($(this).text());
    $("#forecast-header").css("display","block")
})
