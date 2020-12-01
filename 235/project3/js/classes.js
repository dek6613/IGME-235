const FLOOR = new Rectangle(new Vector(0, 600), 1000, 200);

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

        this.kinematic = new Kinematic(position, width, height, mass, maxSpeed);

        this.grabbed = false;
        this.floorCheck = new Rectangle(new Vector(this.x, this.y + this.height), this.width, 1);
    }

    update(dt = 1/60, mousePosition)
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

        this.floorCheck = new Rectangle(new Vector(this.x, this.y + this.height), this.width, 1);

        // If this is on the floor, apply friction
        if (this.floorCheck.intersects(FLOOR))
        {
            this.kinematic.applyFriction(2);
        }

        this.kinematic.move(dt);

        this.bounceEdges();

        if (Math.abs(this.kinematic.velocity.x) < 1)
        {
            this.kinematic.velocity.x = 0;
        }
        if (Math.abs(this.kinematic.velocity.y) < 1)
        {
            this.kinematic.velocity.y = 0;
        }

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

const LEFT_WALL = new Rectangle(new Vector(-200, 0), 200, 600);
const RIGHT_WALL = new Rectangle(new Vector(1000, 0), 200, 600);
const CEILING = new Rectangle(new Vector(0, -200), 1000, 200);

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

        this.kinematic = new Kinematic(position, width, height, mass, maxSpeed);

        this.isMoveLeft = false;
        this.isMoveRight = false;
        this.isJump = false;
        this.grounded = false;

        this.floorCheck = new Rectangle(new Vector(this.x, this.y + this.height), this.width, 1);

        Object.seal(this);
    }

    update(dt = 1/60, solids = [])
    {
        // Apply forces
        this.kinematic.applyGravity()

        // Apply grounded friction if the player isn't inputting movement
        if (this.grounded && !(this.isMoveLeft || this.isMoveRight || this.isJump))
        {
            this.kinematic.applyFriction(100);
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
        this.kinematic.move(dt);

        // Detect collisions
        solids.push(FLOOR);
        solids.push(CEILING);
        solids.push(LEFT_WALL);
        solids.push(RIGHT_WALL);

        this.floorCheck = new Rectangle(new Vector(this.x, this.y + this.height), this.width, 1);
        this.grounded = false;

        for (let i = 0; i < solids.length; i++)
        {
            if (this.floorCheck.intersects(solids[i]))
            {
                this.grounded = true;
            }

            this.collideSolid(solids[i]);
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
                console.log("L - " + overlap.width);
            }

            // Player is to the right
            else
            {
                this.kinematic.position.x += overlap.width;
                console.log("R - " + overlap.width);
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
                console.log("U - " + overlap.height);
            }

            // Player is below
            else
            {
                this.kinematic.position.y += overlap.height;
                console.log("D - " + overlap.height);
            }
        }
    }

    jump()
    {
        if (this.grounded)
        {
            this.kinematic.applyForce(new Vector(0, -10000));
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
}