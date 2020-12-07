"use strict";

const app = new PIXI.Application({
    width: 1000,
    height: 600
});
document.body.appendChild(app.view);

const sceneWidth = app.view.width;
const sceneHeight = app.view.height;

const playerPrefab = { width: 20, height: 30, mass: 1, maxSpeed: 1, color: 0x00FFBF };
const cratePrefab = { width: 40, height: 40, mass: 0.5, maxSpeed: 500, color: 0x4F4F4F };

let paused = true;

let stage;

let levels = [];
let currentLevel;

let player, clickCircle;

setup();

function setup()
{
    stage = app.stage;

    createLevels();

    document.addEventListener("keydown", playerInputStart, true);
    document.addEventListener("keyup", playerInputEnd, true);

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
    for (let c of currentLevel.crates)
    {
        if (!currentLevel.clickCircle.intersects(c.kinematic.collision.center()))
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

    mobiles.push(currentLevel.player);

    for (let c of currentLevel.crates)
    {
        c.update(dt, currentLevel.walls.concat(currentLevel.gates), mobiles, mousePosition);
    }
    currentLevel.player.update(dt, currentLevel.walls, mobiles);
    currentLevel.clickCircle.update();

    for (let c of currentLevel.crates)
    {
        c.draw();
    }
    currentLevel.player.draw();
    currentLevel.clickCircle.draw();

    // If the player is touching the loading zone, go to the next level
    if (currentLevel.player.kinematic.collision.intersects(currentLevel.loadingZone.collision))
    {
        startNextLevel();
    }
}

function startNextLevel()
{
    paused = true;

    currentLevel.scene.visible = false;

    let oldPlayer = currentLevel.player;
    
    currentLevel = currentLevel.loadingZone.nextLevel;

    currentLevel.restart();

    currentLevel.player.isMoveLeft = oldPlayer.isMoveLeft;
    currentLevel.player.isMoveRight = oldPlayer.isMoveRight;
    currentLevel.player.isJump = oldPlayer.isJump;

    currentLevel.scene.visible = true;

    paused = false;
}

function createLevels()
{
    paused = true;
    
    let walls = [];
    let gates = [];
    let crateSpawns = [];
    let playerSpawn;
    let loadingZone;

    // ------ LEVEL 0 - CORRIDOR ------
    let corridorScene = new PIXI.Container();
    stage.addChild(corridorScene);

    walls = [];
    gates = [];
    crateSpawns = [];
    playerSpawn = new Vector();
    loadingZone = null;

    // Create walls
    walls = 
    [
        // Borders
        createWall(new Vector(0, 0), 20, 600), // Left wall
        createWall(new Vector(0, 0), 1000, 175), // Ceiling
        createWall(new Vector(0, 425), 1000, 175), // Floor

        // Corners
        createWall(new Vector(20, 175), 100, 50), // Top left
        createWall(new Vector(780, 175), 220, 50), // Top right
        createWall(new Vector(20, 375), 100, 50), // Bottom left
        createWall(new Vector(780, 375), 220, 50) // Bottom right
    ];

    // Set player spawn
    playerSpawn = new Vector(50, 345);

    // Create loading zone
    loadingZone = new LoadingZone(new Vector(975, 175), 25, 200);

    levels.push(new Level(corridorScene, playerPrefab, playerSpawn, 0, cratePrefab, crateSpawns, walls, gates, loadingZone));


    // ------ LEVEL 1 - INTRO TO BOXES ------
    let introBoxScene = new PIXI.Container();
    stage.addChild(introBoxScene);
    introBoxScene.visible = false;

    walls = [];
    gates = [];
    crateSpawns = [];
    playerSpawn = new Vector();
    loadingZone = null;

    // Create walls
    walls = 
    [
        // Borders
        createWall(new Vector(0, 0), 120, 225), // Left wall top
        createWall(new Vector(0, 375), 120, 225), // Left wall bottom
        createWall(new Vector(880, 0), 120, 135), // Right wall top
        createWall(new Vector(880, 335), 120, 315), // Right wall bottom
        createWall(new Vector(0, 0), 1000, 135), // Ceiling
        createWall(new Vector(0, 425), 1000, 175) // Floor
    ];

    // Set crate spawn
    crateSpawns = [new Vector(480, 140)];

    // Set player spawn
    playerSpawn = new Vector(50, 345);

    // Create loading zone
    loadingZone = new LoadingZone(new Vector(975, 135), 25, 200);

    levels.push(new Level(introBoxScene, playerPrefab, playerSpawn, 150, cratePrefab, crateSpawns, walls, gates, loadingZone));


    // ------ LEVEL 2 - BOX RETRIEVAL ------
    let boxRetrievalScene = new PIXI.Container();
    stage.addChild(boxRetrievalScene);
    boxRetrievalScene.visible = false;

    walls = [];
    gates = [];
    crateSpawns = [];
    playerSpawn = new Vector();
    loadingZone = null;

    // Create walls
    walls =
    [
        // Borders
        createWall(new Vector(0, 0), 120, 135), // Left wall top
        createWall(new Vector(0, 335), 120, 315), // Left wall bottom
        createWall(new Vector(880, 0), 120, 95), // Right wall top
        createWall(new Vector(880, 295), 120, 315), // Right wall bottom
        createWall(new Vector(0, 0), 1000, 50), // Ceiling
        createWall(new Vector(0, 425), 1000, 175), // Floor

        // Platforms
        createWall(new Vector(600, 185), 40, 20)
    ];

    // Set crate spawn
    crateSpawns =
    [
        new Vector(480, 385),
        new Vector(600, 145)
    ];

    // Set player spawn
    playerSpawn = new Vector(50, 305);

    // Create loading zone
    loadingZone = new LoadingZone(new Vector(975, 135), 25, 200);

    levels.push(new Level(boxRetrievalScene, playerPrefab, playerSpawn, 150, cratePrefab, crateSpawns, walls, gates, loadingZone));


    // ------ LEVEL 3 - INTRO TO GATES ------
    let gateIntroScene = new PIXI.Container();
    stage.addChild(gateIntroScene);
    gateIntroScene.visible = false;

    walls = [];
    gates = [];
    crateSpawns = [];
    playerSpawn = new Vector();
    loadingZone = null;

    // Create walls
    walls =
    [
        // Borders
        createWall(new Vector(0, 0), 120, 350), // Left wall top
        createWall(new Vector(0, 450), 120, 150), // Left wall bottom
        createWall(new Vector(880, 0), 120, 160), // Right wall top
        createWall(new Vector(880, 360), 120, 315), // Right wall bottom
        createWall(new Vector(0, 0), 1000, 50), // Ceiling
        createWall(new Vector(0, 550), 1000, 50), // Floor

        // Platforms
        createWall(new Vector(0, 500), 500, 50), // Slab bottom
        createWall(new Vector(0, 450), 400, 50) // Slab top
    ];

    // Create gates
    gates = 
    [
        createPlayerGate(new Vector(120, 350), 200, 100), // Holding up crates at spawn
        createPlayerGate(new Vector(400, 450), 480, 100) // At the end to let the player use crate as floating platform
    ];

    // Set crate spawns
    crateSpawns =
    [
        new Vector(150, 310),
        new Vector(250, 310)
    ];

    // Set player spawn
    playerSpawn = new Vector(50, 420);

    // Create loading zone
    loadingZone = new LoadingZone(new Vector(975, 160), 25, 200);

    levels.push(new Level(gateIntroScene, playerPrefab, playerSpawn, 150, cratePrefab, crateSpawns, walls, gates, loadingZone));


    // ------ LEVEL 4 - FLING THING ------
    let flingThingScene = new PIXI.Container();
    stage.addChild(flingThingScene);
    flingThingScene.visible = false;

    walls = [];
    gates = [];
    crateSpawns = [];
    playerSpawn = new Vector();
    loadingZone = null;

    // Create walls
    walls = 
    [
        // Borders
        createWall(new Vector(0, 0), 120, 160), // Left wall top
        createWall(new Vector(0, 360), 120, 240), // Left wall bottom
        createWall(new Vector(880, 0), 120, 260), // Right wall top
        createWall(new Vector(880, 460), 120, 140), // Right wall bottom
        createWall(new Vector(0, 0), 1000, 50), // Ceiling
        createWall(new Vector(0, 550), 1000, 50), // Floor

        // Platforms
        createWall(new Vector(425, 370), 150, 150), // Center pillar
        createWall(new Vector(575, 500), 50, 20) // Center pillar right overhang
    ];

    // Create gates
    gates = 
    [
        createPlayerGate(new Vector(425, 370), 150, 180),
        createPlayerGate(new Vector(575, 520), 50, 30)
    ];

    // Set crate spawn
    crateSpawns = [new Vector(250, 510)];

    // Set player spawn
    playerSpawn = new Vector(50, 330);

    // Create loading zone
    loadingZone = new LoadingZone(new Vector(975, 260), 25, 200);

    levels.push(new Level(flingThingScene, playerPrefab, playerSpawn, 150, cratePrefab, crateSpawns, walls, gates, loadingZone));


    // ------ LEVEL 5 - FLING FINALE ------
    let flingFinaleScene = new PIXI.Container();
    stage.addChild(flingFinaleScene);
    flingFinaleScene.visible = false;

    walls = [];
    gates = [];
    crateSpawns = [];
    playerSpawn = new Vector();
    loadingZone = null;

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
    flingFinaleScene.addChild(exitLabel);

    // Create walls
    walls = 
    [
        // Borders
        createWall(new Vector(0, 0), 20, 600),
        createWall(new Vector(0, 0), 1000, 100),
        createWall(new Vector(0, 580), 1000, 20),

        // Platforms
        createWall(new Vector(20, 310), 100, 20),
        createWall(new Vector(750, 400), 250, 200),
        createWall(new Vector(850, 250), 150, 150)
    ];

    // Create crate spawn points
    crateSpawns = [
        new Vector(245, 300),
        new Vector(50, 270),
        new Vector(650, 560),
        new Vector(788, 360)
    ];

    // Create player-only gates
    gates = [createPlayerGate(new Vector(400, 320), 100, 260)];

    // Create loading zone
    loadingZone = new LoadingZone(new Vector(975, 100), 25, 150);

    // Create player
    playerSpawn = new Vector(30, 550);

    levels.push(new Level(flingFinaleScene, playerPrefab, playerSpawn, 150, cratePrefab, crateSpawns, walls, gates, loadingZone));


    // ------ CLEANUP ------
    for (let i = 0; i < levels.length; i++)
    {
        if (i < levels.length - 1)
        {
            levels[i].loadingZone.nextLevel = levels[i+1];
        }
        else
        {
            levels[i].loadingZone.nextLevel = levels[0];
        }
    }

    currentLevel = levels[0];

    paused = false;
}

function createWall(position = new Vector(), width, height)
{
    let w = new Wall(position, width, height, 0xCFCFCF);
    return w;
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
            currentLevel.player.isMoveLeft = true;
            e.preventDefault();
            break;
        case "KeyD":
        case "ArrowRight":
            currentLevel.player.isMoveRight = true;
            e.preventDefault();
            break;
        case "KeyW":
        case "ArrowUp":
        case "Space":
            currentLevel.player.isJump = true;
            e.preventDefault();
            break;
    }
}

function playerInputEnd(e)
{
    switch (e.code)
    {
        case "KeyA":
        case "ArrowLeft":
            currentLevel.player.isMoveLeft = false;
            e.preventDefault();
            break;
        case "KeyD":
        case "ArrowRight":
            currentLevel.player.isMoveRight = false;
            e.preventDefault();
            break;
        case "KeyW":
        case "ArrowUp":
        case "Space":
            currentLevel.player.isJump = false;
            e.preventDefault();
            break;
        case "KeyR":
            e.preventDefault();
            currentLevel.restart();
            break;
    }
}