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

        this.bounceEdges();

        if (Math.abs(this.kinematic.velocity.x) < 1)
        {
            this.kinematic.velocity.x = 0;
        }
        if (Math.abs(this.kinematic.velocity.y) < 1)
        {
            this.kinematic.velocity.y = 0;
        }

        this.floorCheck = new Rectangle(new Vector(this.x, this.y + this.height), this.width, 1);

        // If this is on the floor, apply friction
        if (this.floorCheck.intersects(FLOOR))
        {
            this.kinematic.applyFriction(2);
        }

        this.kinematic.move(dt);

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