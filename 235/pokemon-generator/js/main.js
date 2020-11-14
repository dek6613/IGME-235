"use strict";

window.onload = function(e)
{
    document.querySelector("#generate").onclick = generateButtonClicked
};

// The total number of pokemon as of updating this site (11/13/2020)
const TOTAL_SPECIES = 893;

let displayTerm = "";
let parameters;

function generateButtonClicked()
{
    console.log("generateButtonClicked() called");

    const POKEAPI_URL = "https://pokeapi.co/api/v2/";

    let url = POKEAPI_URL;

    // Gets what the user put in the search box
    let term = document.querySelector("#namesearch").value;
    displayTerm = term;

    // Cleans up the user's search to be compatible with the API
    term = term.trim();
    term = term.toLowerCase();
    term = encodeURIComponent(term);

    // Creates an object containing all of the user's search options (as well as some other useful info)
    parameters = makeParameters(term, document.querySelector("#type").value, document.querySelector("#fullEvoCheck").checked, "");

    // If the user didn't enter a pokemon name/number, randomly generate one instead
    if(term.length < 1)
    {
        term = Math.floor(Math.random() * TOTAL_SPECIES) + 1;
        parameters.name = term;
    }

    // Updates the display term if the user didn't enter a name themselves
    if (displayTerm.trim().length < 1)
    {
        displayTerm = "a random pokemon";
    }
    
    document.querySelector("#status").innerHTML = "Searching for " + displayTerm + "...";
    
    // If the user provided a name or didn't provide a type filter, search with the given name or randomly generated number
    if (parameters.nameGiven || !parameters.type)
    {
        url += "pokemon-species/" + parameters.name;
        console.log(url);
        getSpecies(url);
    }
    // If the user didn't provide a name and did provide a type filter, search by pokemon type rather than pokemon name/number
    else
    {
        url += "type/" + parameters.type;
        console.log(url);
        getType(url);
    }
}

// Gets infromation on a given pokemon type from the API
function getType(url)
{
    let xhr = new XMLHttpRequest();

    xhr.onload = typeLoaded;

    xhr.onerror = dataError;

    xhr.open("GET", url);
    xhr.send();
}

function typeLoaded(e)
{
    let xhr = e.target;

    let obj = JSON.parse(xhr.responseText);

    // Gets a list of all pokemon of the given type
    let pokemonOfType = obj.pokemon;

    // Randomly picks a pokemon from the list and passes its API URL to the next step
    let index = Math.floor(Math.random() * pokemonOfType.length);
    getRawPokemon(pokemonOfType[index].pokemon.url);
}

// Gets a pokemon (not species) by URL
function getRawPokemon(url)
{
    let xhr = new XMLHttpRequest();

    xhr.onload = rawPokemonLoaded;
    xhr.onerror = dataError;

    xhr.open("GET", url);
    xhr.send();
}

function rawPokemonLoaded(e)
{
    let xhr = e.target;

    let obj = JSON.parse(xhr.responseText);

    // Since the "Type" category of the API has pokemon, not species, we have to convert from the pokemon URL to the species URL.
    getSpecies(obj.species.url);
}

// Gets a pokemon species by URL
function getSpecies(url)
{
    let xhr = new XMLHttpRequest();

    // If the user only wants fully evolved pokemon and didn't give a name/number to overwrite that, start searching for the given species's fully evolved form
    if (parameters.fullyEvolvedOnly && !parameters.nameGiven)
    {
        xhr.onload = lowerEvoLoaded;
        parameters.fullyEvolvedOnly = false; // Prevents a recursive loop since lowerEvoLoaded() eventually calls back to getSpecies()
    }
    // If the user doesn't only want fully evolved pokemon (or if a fully evolved pokemon is already found from the step above), skip to loading the given species
    else
    {
        xhr.onload = speciesLoaded;
    }

    xhr.onerror = dataError;

    xhr.open("GET", url);
    xhr.send()
}

// Grabs the URL for a species's evolution chain
function lowerEvoLoaded(e)
{
    let xhr = e.target;

    if(xhr.responseText == "Not Found")
    {
        document.querySelector("#status").innerHTML = "No results found for '" + displayTerm + "'";
        return;
    }

    let obj = JSON.parse(xhr.responseText);

    // Some gen 8 pokemon are missing evolution chain data, so there's a check here to make sure things load as well as possible
    if (obj.evolution_chain)
    {
        getEvoChain(obj.evolution_chain.url);
    }
    else
    {
        console.log("Evolution chain data not found. Likely due to incomplete API data for gen 8 pokemon")
        speciesLoaded(e);
    }
}

// Gets the evolution chain of a pokemon species who may or may not be fully evolved such that we can guarentee that it's fully evolved
function getEvoChain(url)
{
    let xhr = new XMLHttpRequest();

    xhr.onload = evoChainLoaded;

    xhr.onerror = dataError;

    xhr.open("GET", url);
    xhr.send();
}

// Parses the evolution chain, gets the most evolved pokemon in it, and passes along its species URL
function evoChainLoaded(e)
{
    let xhr = e.target;

    if(xhr.responseText == "Not Found")
    {
        document.querySelector("#status").innerHTML = "No evolution chain found for '" + displayTerm + "'";
        return;
    }

    let obj = JSON.parse(xhr.responseText);

    document.querySelector("#status").innerHTML = "Searching for most evolved pokemon...";

    // Climbs the evolution tree from the bottom and returns the top-most pokemon
    let topEvo = getMostEvolved(obj);

    // Updates display term with the new pokemon's name
    displayTerm = formatText(topEvo.name);

    document.querySelector("#status").innerHTML = "Found most evolved pokemon! Searching for " + displayTerm + "'s info...";

    // Passes the pokemon's species url to the function from earlier (this is why we needed to set parameters.fullyEvolvedOnly to false earlier)
    getSpecies(topEvo.url);
}

// Gets the default pokemon variation in a species (prevents "charizard-mega-x" from showing up insated of "charizard")
function speciesLoaded(e)
{
    let xhr = e.target;

    if(xhr.responseText == "Not Found")
    {
        document.querySelector("#status").innerHTML = "No results found for '" + displayTerm + "'";
        return;
    }

    let obj = JSON.parse(xhr.responseText);

    // Updates display term with the selected pokemon (in case it was ranodmly generated)
    displayTerm = formatText(obj.name);

    // Gets the default variation of the pokemon species
    let url = obj.varieties[0].pokemon.url;
    console.log("Found default variation: " + url);

    getData(url);
}

// Gets info from a pokemon (not species)
function getData(url)
{
    let xhr = new XMLHttpRequest();

    xhr.onload = dataLoaded;

    xhr.onerror = dataError;

    xhr.open("GET", url);
    xhr.send();
}

// With the final pokemon chosen, this gets all the name, sprite, move, and ability info and displays it
function dataLoaded(e)
{
    let xhr = e.target;

    if(xhr.responseText == "Not Found")
    {
        document.querySelector("#status").innerHTML = "No results found for '" + displayTerm + "'";
        return;
    }

    document.querySelector("#status").innerHTML = "Found info for " + displayTerm + "! Creating move list...";

    let obj = JSON.parse(xhr.responseText);

    // Gets the name and default sprite
    let name = formatText(obj.species.name);
    let spriteURL = obj.sprites.front_default;

    let result = "";

    // Displays name and sprite
    result += "<h2>" + name + "</h2>";
    result += "<img src='" + spriteURL + "' alt=''/>";

    // Displays types
    let typeString = "<div id='types'>";
    for (let i = 0; i < obj.types.length; i++)
    {
        typeString += "<div class='" + obj.types[i].type.name + "'><p>" + formatText(obj.types[i].type.name) + "</p></div>";
    }
    typeString += "</div>"

    result += typeString;

    let movesHTML = "";

    // Gets all the pokemon's knowable moves
    let moveList = obj.moves;

    // Loops up to 4 times (4 move slots)
    for (let i = 0; i < 4; i++)
    {
        // If the pokemon is incapable of learning any more moves (Ditto and Smeargle come to mind), stop the loop early
        if (moveList.length < 1) {break;}

        // Randomly pick a move from the pokemon's move list
        let index = Math.floor(Math.random() * moveList.length)
        let chosenMove = moveList[index].move;

        // Remove the chosen move from the list so it can't be chosen twice
        moveList.splice(index, 1);

        // Adds the move to the HTML list
        movesHTML += "<div class='moveList'><p>" + formatText(chosenMove.name) + "</p></div>";
    }

    // Wraps up the move list in HTML
    result += movesHTML;

    // Some pokemon have no listed abilities (usually due to incomplete API info from gen 8), so this "if" statement works around that
    let ability = {};
    if (obj.abilities.length > 0)
    {
        // Randomly picks an ability from the pokemon's list
        ability = obj.abilities[Math.floor(Math.random() * obj.abilities.length)].ability;
    }
    else
    {
        ability.name = "none";
    }

    // Displays the chosen ability
    result += "<p class='ability'>Ability: <strong>" + formatText(ability.name) + "</strong></p>";

    // Pushes the new HTML to the page
    document.querySelector("#result").innerHTML = result;
    document.querySelector("#status").innerHTML = "Move list generated for " + displayTerm + "!";
}

function dataError(e)
{
    console.log("An error occurred");
}

function makeParameters(name, type, fullyEvolvedOnly, generations)
{
    let parameters = {};
    parameters.name = name;
    parameters.nameGiven = Boolean(name); // Keeps track of whether or not the user originally entered a name/number into the search box
    parameters.type = type;
    parameters.fullyEvolvedOnly = fullyEvolvedOnly;
    parameters.generations = generations; // Currently not implemented

    Object.seal(parameters);
    return parameters;
}

// Formats text from the API to make "something-like-this" turn into "Something Like This"
function formatText(text)
{
    let newText = "";

    // If the string is empty, return it
    if (text.length < 1) {return text;}

    // First letter is always capitalized
    let upperToggle = true;

    // Loop through the given string
    for (let i = 0; i < text.length; i++)
    {
        // Get the current character
        let character = text.substring(i, i+1);

        // If this flag is true, make this letter uppercase
        if (upperToggle)
        {
            character = character.toUpperCase();
            upperToggle = false; // Toggle off to prevent all caps
        }

        // The API uses dashes as spaces, so this replaces dashes with spaces and makes the next letter capitalized
        if (character == "-")
        {
            character = " ";
            upperToggle = true;
        }

        // Adds the formatted character to the new string
        newText += character;
    }

    return newText;
}

// Takes an evolution chain object and returns one of that chain's highest evolved forms
function getMostEvolved(evoChain)
{
    let evolvesTo = evoChain.chain.evolves_to;
    let species = evoChain.chain.species;

    // While there is at least one pokemon this can evolve into, keep looping
    while (evolvesTo.length > 0)
    {
        // This block randomizes which branch of an evolution tree the function goes up
        let branchNum = 0;
        if (evolvesTo.length > 1)
        {
            branchNum = Math.floor(Math.random() * evolvesTo.length);
        }
        
        // Gets the next species in the evolution tree and repeats the loop with that
        species = evolvesTo[branchNum].species;
        evolvesTo = evolvesTo[branchNum].evolves_to;
    }

    return species;
}