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

let player, clickCircle;
let crates = [];
let gates = [];
let testLevelScene;

setup();

function setup()
{
    stage = app.stage;

    testLevelScene = new PIXI.Container();
    stage.addChild(testLevelScene);

    // Create crates
    crates.push(createCrate(new Vector(245, 30)));
    crates.push(createCrate(new Vector(400, 580)));

    for (let c of crates)
    {
        testLevelScene.addChild(c);
    }

    // Create player-only gates
    gates.push(createPlayerGate(new Vector(450, 350), 100, 250));

    for (let g of gates)
    {
        testLevelScene.addChild(g);
    }

    // Create player
    player = new Player(new Vector(245, 0), playerPrefab.width, playerPrefab.height, playerPrefab.mass, playerPrefab.maxSpeed, playerPrefab.color);
    document.addEventListener("keydown", playerInputStart, true);
    document.addEventListener("keyup", playerInputEnd, true);

    // Create radius indicator
    clickCircle = new ClickRadius(player, 150, 0x0000FF);
    testLevelScene.addChild(clickCircle);
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
    
    // Add non-grabbed crates to the list of mobile objects
    for (let c of crates)
    {
        if (!clickCircle.intersects(c.kinematic.collision.center()))
        {
            c.grabbed = false;
            c.interactive = false;
        }
        else
        {
            c.interactive = true;
        }

        if (!c.grabbed)
        {
            mobiles.push(c);
        }
    }

    mobiles.push(player);

    for (let c of crates)
    {
        c.update(dt, gates, mobiles, mousePosition);
    }
    player.update(dt, [], mobiles);
    clickCircle.update();

    for (let c of crates)
    {
        c.draw();
    }
    player.draw();
    clickCircle.draw();
}

function createCrate(position = new Vector())
{
    let c = new Crate(position, cratePrefab.width, cratePrefab.height, cratePrefab.mass, cratePrefab.maxSpeed, cratePrefab.color);
    c.interactive = true;
    c.buttonMode = true;
    c.on("mousedown", e => c.grabbed = true);
    app.view.addEventListener("mouseup", e => c.grabbed = false);
    return c;
}

function createPlayerGate(position = new Vector(), width, height)
{
    let g = new PlayerGate(position, width, height, 0x00FFBF);
    return g;
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