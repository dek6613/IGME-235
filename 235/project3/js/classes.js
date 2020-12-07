const FLOOR = { collision: new Rectangle(new Vector(0, 600), 1000, 200) };
const LEFT_WALL = { collision: new Rectangle(new Vector(-200, 0), 200, 600) };
const RIGHT_WALL = { collision: new Rectangle(new Vector(1000, 0), 200, 600) };
const CEILING = { collision: new Rectangle(new Vector(0, -200), 1000, 200) };

class Crate extends PIXI.Graphics
{
    constructor(position = Vector(), width = 0, height = 0, mass = 1, maxSpeed = 1, color = 0xBFBFBF)
    {
        super();
        this.beginFill(color);
        this.drawRect(0, 0, width, height);
        this.endFill();
        this.x = position.x;
        this.y = position.y;
        this.width = width;
        this.height = height;

        this.kinematic = new Kinematic(position, width, height, mass, maxSpeed);

        this.grabbed = false;
        this.grounded = false;
        this.riding = null;

        this.floorCheck = new Rectangle(new Vector(this.x, this.y + this.height), this.width, 1);
    }

    update(dt = 1/60, solids = [], mobiles = [], mousePosition)
    {
        if (this.grabbed)
        {
            mousePosition = new Vector(mousePosition.x - this.width / 2, mousePosition.y - this.height / 2);
            this.kinematic.applyForce(this.kinematic.arrive(mousePosition, 50));
        }
        else
        {
            this.kinematic.applyGravity();
        }

        this.floorCheck = new Rectangle(new Vector(this.kinematic.position.x, this.kinematic.position.y + this.height), this.width, 1);

        // If this is on the floor, apply friction
        if (this.grounded)
        {
            this.kinematic.applyFriction(2);
        }

        this.kinematic.move(dt);

        //this.bounceEdges();

        // Detect collisions
        solids.push(FLOOR);
        solids.push(CEILING);
        solids.push(LEFT_WALL);
        solids.push(RIGHT_WALL);

        if (!this.grabbed)
        {
            for (let i = 0; i < mobiles.length; i++)
            {
                if (mobiles[i] == this) { continue; }

                let pushDirection = this.kinematic.pushOut(mobiles[i].kinematic.collision);

                if (pushDirection == "-x" || pushDirection == "+x")
                {
                    this.kinematic.velocity.x *= -0.5;
                }
                else if (pushDirection == "-y" || pushDirection == "+y")
                {
                    this.kinematic.velocity.y *= -0.5;
                }
            }
        }

        for (let i = 0; i < solids.length; i++)
        {
            let pushDirection = this.kinematic.pushOut(solids[i].collision);

            if (pushDirection == "-x" || pushDirection == "+x")
            {
                this.kinematic.velocity.x *= -0.5;
            }
            else if (pushDirection == "-y" || pushDirection == "+y")
            {
                this.kinematic.velocity.y *= -0.5;
            }
        }

        this.floorCheck = new Rectangle(new Vector(this.kinematic.position.x, this.kinematic.position.y + this.height), this.width, 1);
        this.grounded = false;
        this.riding = null;

        if (!this.grabbed)
        {
            for (let i = 0; i < mobiles.length; i++)
            {
                if (mobiles[i] == this) { continue; }

                if (this.floorCheck.intersects(mobiles[i].kinematic.collision))
                {
                    this.grounded = true;
                    this.riding = mobiles[i];
                }
            }
        }

        for (let i = 0; i < solids.length; i++)
        {
            if (this.floorCheck.intersects(solids[i].collision))
            {
                this.grounded = true;
            }
        }

        // Clean up velocities
        if (Math.abs(this.kinematic.velocity.x) < 1)
        {
            this.kinematic.velocity.x = 0;
        }
        if (Math.abs(this.kinematic.velocity.y) < 1)
        {
            this.kinematic.velocity.y = 0;
        }

        // Reset acceleration for next frame
        this.kinematic.resetAcceleration();
    }

    draw()
    {
        this.x = this.kinematic.position.x;
        this.y = this.kinematic.position.y;
    }

    bounceEdges()
    {
        // Hard-coding these variables for now
        let sceneWidth = 1000;
        let sceneHeight = 600;

        // Check for x bounds
        if (this.kinematic.position.x + this.width > sceneWidth)
        {
            this.kinematic.position.x = sceneWidth - this.width;
            this.kinematic.velocity.x *= -0.5; // Loses 50% of its speed
        }
        else if (this.kinematic.position.x < 0)
        {
            this.kinematic.position.x = 0;
            this.kinematic.velocity.x *= -0.5;
        }

        // Check for y bounds
        if (this.kinematic.position.y + this.height > sceneHeight)
        {
            this.kinematic.position.y = sceneHeight - this.height;
            this.kinematic.velocity.y *= -0.5;
        }
        else if (this.kinematic.position.y < 0)
        {
            this.kinematic.position.y = 0;
            this.kinematic.velocity.y *= -0.5;
        }
    }
}

class Player extends PIXI.Graphics
{
    constructor(position = Vector(), width = 0, height = 0, mass = 1, maxSpeed = 1, color = 0x00FFBF)
    {
        super();
        this.beginFill(color);
        this.drawRect(0, 0, width, height);
        this.endFill();
        this.x = position.x;
        this.y = position.y;
        this.width = width;
        this.height = height;

        this.kinematic = new Kinematic(position, width, height, mass, maxSpeed);

        this.isMoveLeft = false;
        this.isMoveRight = false;
        this.isJump = false;
        this.grounded = false;

        this.riding = null;

        this.floorCheck = new Rectangle(new Vector(this.x, this.y + this.height), this.width, 1);

        Object.seal(this);
    }

    update(dt = 1/60, solids = [], mobiles = [])
    {
        // Apply forces
        this.kinematic.applyGravity()

        // Apply grounded friction if the player isn't inputting movement
        if (this.grounded && !(this.isMoveLeft || this.isMoveRight))
        {
            this.kinematic.velocity.x = 0;
        }

        // Apply air friction if in the air
        if (!this.grounded)
        {
            this.kinematic.applyForce(new Vector(this.kinematic.velocity.x * -2, 0));
        }

        if (this.isMoveLeft)
        {
            this.moveLeft();
        }
        if (this.isMoveRight)
        {
            this.moveRight();
        }
        if (this.isJump)
        {
            this.jump();
        }

        // Move
        this.move(dt);

        // Detect collisions
        solids.push(FLOOR);
        solids.push(CEILING);
        solids.push(LEFT_WALL);
        solids.push(RIGHT_WALL);

        for (let i = 0; i < mobiles.length; i++)
        {
            if (mobiles[i] == this) { continue; }

            let pushDirection = this.kinematic.pushOut(mobiles[i].kinematic.collision);

            if (pushDirection == "-x" || pushDirection == "+x")
            {
                this.kinematic.velocity.x = 0;
            }
            else if (pushDirection == "-y" || pushDirection == "+y")
            {
                this.kinematic.velocity.y = 0;
            }
        }
        for (let i = 0; i < solids.length; i++)
        {
            let pushDirection = this.kinematic.pushOut(solids[i].collision);

            if (pushDirection == "-x" || pushDirection == "+x")
            {
                this.kinematic.velocity.x = 0;
            }
            else if (pushDirection == "-y" || pushDirection == "+y")
            {
                this.kinematic.velocity.y = 0;
            }
        }

        this.floorCheck = new Rectangle(new Vector(this.kinematic.position.x, this.kinematic.position.y + this.height), this.width, 1);
        this.grounded = false;
        this.riding = null;

        for (let i = 0; i < mobiles.length; i++)
        {
            if (mobiles[i] == this) { continue; }

            if (this.floorCheck.intersects(mobiles[i].kinematic.collision))
            {
                this.grounded = true;
                this.riding = mobiles[i];
            }
        }
        for (let i = 0; i < solids.length; i++)
        {
            if (this.floorCheck.intersects(solids[i].collision))
            {
                this.grounded = true;
            }
        }
        
        // Clean up velocities
        if (Math.abs(this.kinematic.velocity.x) < 1)
        {
            this.kinematic.velocity.x = 0;
        }
        if (Math.abs(this.kinematic.velocity.y) < 1)
        {
            this.kinematic.velocity.y = 0;
        }

        // Reset acceleration for next frame
        this.kinematic.resetAcceleration();
    }

    draw()
    {
        this.x = this.kinematic.position.x;
        this.y = this.kinematic.position.y;
    }

    // Checks if the player is colliding with a rectangle and moves them out of the way accordingly
    collideSolid(other = new Rectangle())
    {
        if (!this.kinematic.collision.intersects(other)) { return; }

        let overlap = this.kinematic.collision.overlap(other);

        // Side collision
        if (overlap.width < overlap.height)
        {
            this.kinematic.velocity.x = 0;

            // Player is to the left
            if (this.kinematic.collision.center().x < other.center().x)
            {
                this.kinematic.position.x -= overlap.width;
            }

            // Player is to the right
            else
            {
                this.kinematic.position.x += overlap.width;
            }
        }

        // Top/bottom collision
        else
        {
            this.kinematic.velocity.y = 0;

            // Player is above
            if (this.kinematic.collision.center().y < other.center().y)
            {
                this.kinematic.position.y -= overlap.height;
            }

            // Player is below
            else
            {
                this.kinematic.position.y += overlap.height;
            }
        }
    }

    jump()
    {
        if (this.grounded)
        {
            //this.kinematic.applyForce(new Vector(0, -20000));
            this.kinematic.velocity.y = -400;
            //console.log("JUMP!");
        }
    }

    moveLeft()
    {
        //this.kinematic.applyForce(new Vector(-300, 0));
        this.kinematic.velocity.x = -150;
    }

    moveRight()
    {
        //this.kinematic.applyForce(new Vector(300, 0));
        this.kinematic.velocity.x = 150;
    }

    move(dt = 1/60)
    {
        this.kinematic.velocity = this.kinematic.velocity.add(this.kinematic.acceleration.scale(dt));
        //if (this.riding)
        //{
        //    this.kinematic.velocity = this.kinematic.velocity.add(this.riding.kinematic.velocity);
        //}
        //this.kinematic.velocity = this.kinematic.velocity.clampMagnitude(this.kinematic.maxSpeed);
        this.kinematic.position = this.kinematic.position.add(this.kinematic.velocity.scale(dt));
        this.kinematic.collision.position = this.kinematic.position;
    }
}

class ClickRadius extends PIXI.Graphics
{
    constructor(player, radius, color = 0xFF0000)
    {
        super();
        this.beginFill(color);
        this.drawCircle(0, 0, radius);
        this.endFill();

        this.player = player;

        this.vectPos = player.kinematic.collision.center();
        this.x = this.vectPos.x;
        this.y = this.vectPos.y;

        this.radius = radius;
        this.alpha = 0.15;
    }

    update ()
    {
        this.vectPos = this.player.kinematic.collision.center();
    }

    draw ()
    {
        this.x = this.vectPos.x;
        this.y = this.vectPos.y;
    }

    // Uses circle-point collision. Returns true if colliding with the point
    intersects (other = new Vector())
    {
        let displacement = other.subtract(this.vectPos);

        return this.radius >= displacement.magnitude();
    }
}

class PlayerGate extends PIXI.Graphics
{
    constructor(position, width, height, color = 0x00FFBF)
    {
        super();
        this.beginFill(color);
        this.drawRect(0, 0, width, height);
        this.endFill();
        this.x = position.x;
        this.y = position.y;
        this.width = width;
        this.height = height;
        this.alpha = 0.25;

        this.collision = new Rectangle(position, width, height);
    }
}

class Wall extends PIXI.Graphics
{
    constructor(position, width, height, color = 0xFFFFFF)
    {
        super();
        this.beginFill(color);
        this.drawRect(0, 0, width, height);
        this.endFill();
        this.x = position.x;
        this.y = position.y;
        this.width = width;
        this.height = height;

        this.collision = new Rectangle(position, width, height);
    }
}

class Level
{
    constructor(scene, playerPrefab, playerSpawn, clickRadius, cratePrefab, crateSpawns, walls, gates, loadingZone)
    {
        this.scene = scene;

        this.playerPrefab = playerPrefab;
        this.playerSpawn = playerSpawn;
        this.player = new Player(playerSpawn, playerPrefab.width, playerPrefab.height, playerPrefab.mass, playerPrefab.maxSpeed, playerPrefab.color);
        
        this.clickCircle = new ClickRadius(this.player, clickRadius, 0x00CCFF);

        this.cratePrefab = cratePrefab;
        this.crateSpawns = crateSpawns;
        this.crates = []
        for (let i = 0; i < crateSpawns.length; i++)
        {
            this.crates[i] = createCrate(crateSpawns[i], cratePrefab);
        }

        this.walls = walls;
        this.gates = gates;

        this.loadingZone = loadingZone;

        for (let g of this.gates)
        {
            this.scene.addChild(g);
        }
        for (let w of this.walls)
        {
            this.scene.addChild(w);
        }
        for (let c of this.crates)
        {
            this.scene.addChild(c);
        }
        this.scene.addChild(this.clickCircle);
        this.scene.addChild(this.player);
    }

    restart()
    {
        for (let i = 0; i < this.crates.length; i++)
        {
            this.crates[i].kinematic.position = this.crateSpawns[i];
            this.crates[i].kinematic.stop();
            this.crates[i].grabbed = false;
        }
        
        this.player.kinematic.position = this.playerSpawn;
        this.player.kinematic.stop();
    }
}

function createCrate(position = new Vector(), cratePrefab)
{
    let c = new Crate(position, cratePrefab.width, cratePrefab.height, cratePrefab.mass, cratePrefab.maxSpeed, cratePrefab.color);
    c.interactive = true;
    c.buttonMode = true;
    c.on("mousedown", e => c.grabbed = true);
    app.view.addEventListener("mouseup", e => c.grabbed = false);
    return c;
}

class LoadingZone
{
    constructor(position, width, height, nextLevel = null)
    {
        this.collision = new Rectangle(position, width, height);
        this.nextLevel = nextLevel;
    }
}