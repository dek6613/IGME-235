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
let testLevelScene, crate;

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
    app.view.onmouseup = e => crate.grabbed = false;
    testLevelScene.addChild(crate);

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

    crate.update(dt, mousePosition);
    player.update(dt, [], [crate]);

    crate.draw();
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