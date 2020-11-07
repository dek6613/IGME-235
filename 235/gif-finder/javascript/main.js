
"use strict";

// 1
  window.onload = (e) => {document.querySelector("#search").onclick = searchButtonClicked};

// 2
let displayTerm = "";

// 3
function searchButtonClicked()
{
    console.log("searchButtonClicked() called");

    const GIPHY_URL = "https://api.giphy.com/v1/gifs/search?";

    let GIPHY_KEY = "dc6zaTOxFJmzC";

    let url = GIPHY_URL;
    url += "api_key=" + GIPHY_KEY;

    let term = document.querySelector("#searchterm").value;
    displayTerm = term;

    term = term.trim();

    term = encodeURIComponent(term);

    if(term.length < 1) { return; }

    url += "&q=" + term;

    let limit = document.querySelector("#limit").value;
    url += "&limit=" + limit;

    document.querySelector("#status").innerHTML = "<strong>Searching for '" + displayTerm + "'</strong>";

    console.log(url);

    getData(url);
}

function getData(url)
{
    let xhr = new XMLHttpRequest();

    xhr.onload = dataLoaded;

    xhr.onerror = dataError;

    xhr.open("GET", url);
    xhr.send();
}

function dataLoaded(e)
{
    let xhr = e.target;

    console.log(xhr.responseText);

    let obj = JSON.parse(xhr.responseText);

    if(!obj.data || obj.data.length == 0)
    {
        document.querySelector("#status").innerHTML = "<strong>No results found for '" + displayTerm + "'</strong>";
        return;
    }

    let results = obj.data;
    console.log("results.length = " + results.length);
    let bigString = "";

    for (let i = 0; i < results.length; i++)
    {
        let result = results[i];

        let smallURL = result.images.fixed_width_downsampled.url;
        if (!smallURL) smallURL = "images/no-image-found.png";

        let url = result.url;
        let rating = (result.rating ? result.rating : "NA").toUpperCase();

        let line = `<div class='result'><img src='${smallURL}' title='${result.id}'/>`;
        line += `<span><a target='_blank' href='${url}'>View on Giphy</a></span>`;
        line += `<span>Rating: ${rating}</span></div>`;

        bigString += line;
    }

    document.querySelector("#content").innerHTML = bigString;

    document.querySelector("#status").innerHTML = "<strong>Success!</strong> " + "<p><em>Here are " + results.length + " results for '" + displayTerm + "'</em></p>";
}

function dataError(e)
{
    console.log("An error occurred");
}