"use strict";

const app = new PIXI.Application({
    width: 1000,
    height: 600
});
document.body.appendChild(app.view);

const sceneWidth = app.view.width;
const sceneHeight = app.view.height;

const playerPrefab = { width: 25, height: 25, mass: 1, maxSpeed: 1, color: 0x00FFBF };
const cratePrefab = { width: 40, height: 40, mass: 0.5, maxSpeed: 500, color: 0xBFBFBF };

let paused = true;

let stage;

let player;
let testLevelScene, crate, crate2;

setup();

function setup()
{
    stage = app.stage;

    testLevelScene = new PIXI.Container();
    stage.addChild(testLevelScene);

    // Create crate
    crate = new Crate(new Vector(245, 30), cratePrefab.width, cratePrefab.height, cratePrefab.mass, cratePrefab.maxSpeed, cratePrefab.color);
    crate.interactive = true;
    crate.buttonMode = true;
    crate.on("mousedown", e => crate.grabbed = true);
    app.view.addEventListener("mouseup", e => crate.grabbed = false);
    testLevelScene.addChild(crate);

    crate2 = new Crate(new Vector(445, 30), cratePrefab.width, cratePrefab.height, cratePrefab.mass, cratePrefab.maxSpeed, cratePrefab.color);
    crate2.interactive = true;
    crate2.buttonMode = true;
    crate2.on("mousedown", e => crate2.grabbed = true);
    app.view.addEventListener("mouseup", e => crate2.grabbed = false);
    testLevelScene.addChild(crate2);

    // Create player
    player = new Player(new Vector(245, 0), playerPrefab.width, playerPrefab.height, playerPrefab.mass, playerPrefab.maxSpeed, playerPrefab.color);
    document.addEventListener("keydown", playerInputStart, true);
    document.addEventListener("keyup", playerInputEnd, true);
    testLevelScene.addChild(player);

    app.ticker.add(gameLoop);

    paused = false;
}

function gameLoop()
{
    if (paused) { return; }

    let dt = 1/app.ticker.FPS;
    if (dt > 1/12) dt = 1/12;

    let mousePosition = app.renderer.plugins.interaction.mouse.global;

    let mobiles = [];
    
    if (!crate.grabbed)
    {
        mobiles.push(crate);
    }
    if (!crate2.grabbed)
    {
        mobiles.push(crate2);
    }
    mobiles.push(player);

    crate.update(dt, [], mobiles, mousePosition);
    crate2.update(dt, [], mobiles, mousePosition);
    player.update(dt, [], mobiles);

    crate.draw();
    crate2.draw();
    player.draw();
}

function playerInputStart(e)
{
    switch (e.code)
    {
        case "KeyA":
        case "ArrowLeft":
            player.isMoveLeft = true;
            break;
        case "KeyD":
        case "ArrowRight":
            player.isMoveRight = true;
            break;
        case "KeyW":
        case "ArrowUp":
        case "Space":
            player.isJump = true;
            break;
    }
}

function playerInputEnd(e)
{
    switch (e.code)
    {
        case "KeyA":
        case "ArrowLeft":
            player.isMoveLeft = false;
            break;
        case "KeyD":
        case "ArrowRight":
            player.isMoveRight = false;
            break;
        case "KeyW":
        case "ArrowUp":
        case "Space":
            player.isJump = false;
            break;
    }
}