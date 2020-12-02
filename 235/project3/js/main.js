"use strict";

const app = new PIXI.Application({
    width: 1000,
    height: 600
});
document.body.appendChild(app.view);

const sceneWidth = app.view.width;
const sceneHeight = app.view.height;

const playerPrefab = { width: 25, height: 25, mass: 1, maxSpeed: 1, color: 0x00FFBF };
const cratePrefab = { width: 40, height: 40, mass: 0.5, maxSpeed: 500, color: 0x4F4F4F };

let paused = true;

let stage;

let player, clickCircle;
let crates = [];
let gates = [], walls = [];
let testLevelScene;

setup();

function setup()
{
    stage = app.stage;

    testLevelScene = new PIXI.Container();
    stage.addChild(testLevelScene);

    startLevel();

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
        c.update(dt, walls.concat(gates), mobiles, mousePosition);
    }
    player.update(dt, walls, mobiles);
    clickCircle.update();

    for (let c of crates)
    {
        c.draw();
    }
    player.draw();
    clickCircle.draw();
}

function startLevel()
{
    paused = true;

    // Create temporary exit text
    let exitLabel = new PIXI.Text("EXIT >>");
    exitLabel.style = new PIXI.TextStyle
    ({
        fill: 0xFF0000,
        fontSize: 25,
        fontFamily: "Verdana"
    });
    exitLabel.x = 860;
    exitLabel.y = 160;
    testLevelScene.addChild(exitLabel);

    // Create walls

    // Border
    walls.push(createWall(new Vector(0, 0), 20, 600));
    walls.push(createWall(new Vector(0, 0), 1000, 100));
    walls.push(createWall(new Vector(980, 0), 20, 600));
    walls.push(createWall(new Vector(0, 580), 1000, 20));

    // Platforms
    walls.push(createWall(new Vector(20, 310), 100, 20));
    walls.push(createWall(new Vector(750, 400), 250, 200));
    walls.push(createWall(new Vector(850, 250), 150, 150));

    for (let w of walls)
    {
        testLevelScene.addChild(w);
    }

    // Create crates
    crates.push(createCrate(new Vector(245, 300)));
    crates.push(createCrate(new Vector(50, 270)));
    crates.push(createCrate(new Vector(650, 560)));
    crates.push(createCrate(new Vector(788, 360)));

    for (let c of crates)
    {
        testLevelScene.addChild(c);
    }

    // Create player-only gates
    gates.push(createPlayerGate(new Vector(400, 320), 100, 260));

    for (let g of gates)
    {
        testLevelScene.addChild(g);
    }

    // Create player
    player = new Player(new Vector(30, 555), playerPrefab.width, playerPrefab.height, playerPrefab.mass, playerPrefab.maxSpeed, playerPrefab.color);
    document.addEventListener("keydown", playerInputStart, true);
    document.addEventListener("keyup", playerInputEnd, true);

    // Create radius indicator
    clickCircle = new ClickRadius(player, 150, 0x00CCFF);
    testLevelScene.addChild(clickCircle);
    testLevelScene.addChild(player);

    paused = false;
}

function restartLevel()
{
    crates[0].kinematic.position = new Vector(245, 300);
    crates[1].kinematic.position = new Vector(50, 270);
    crates[2].kinematic.position = new Vector(650, 560);
    crates[3].kinematic.position = new Vector(788, 360);
    
    player.kinematic.position = new Vector(30, 555);

    for (let c of crates)
    {
        c.kinematic.stop();
    }

    player.kinematic.stop();
}

function createWall(position = new Vector(), width, height)
{
    let w = new Wall(position, width, height, 0xCFCFCF);
    return w;
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
        case "KeyR":
            restartLevel();
            break;
    }
}