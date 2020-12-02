"use strict";

// Represents a 2D vector in space
class Vector
{
    constructor (x = 0, y = 0)
    {
        this.x = x;
        this.y = y;
        Object.seal(this);
    }

    // Returns the magnitude of the vector
    magnitude ()
    {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    // Returns the vector produced by adding this to the given vector
    add (other = new Vector())
    {
        return new Vector(this.x + other.x, this.y + other.y);
    }

    // Returns the vector produced by subtracting the given vector from this
    subtract (other = new Vector())
    {
        return new Vector(this.x - other.x, this.y - other.y);
    }

    // Returns the vector scaled by the given scalar value. Doesn't change the vector itself.
    scale (scalar = 1)
    {
        return new Vector(this.x * scalar, this.y * scalar);
    }

    // Returns a normalized version of this vector. Doesn't change the vector itself.
    normalized ()
    {
        let mag = this.magnitude();

        if (mag > 0)
        {
            return this.scale(1 / mag);
        }
        else
        {
            return this.copy();
        }
    }

    // Returns a version of this vector with its magnitude clamped to the given value. Doesn't change the vector itself
    clampMagnitude (max = 1)
    {
        if (this.magnitude > max)
        {
            return this.normalized().scale(max);
        }
        else
        {
            return this.copy();
        }
    }

    // Creates a copy of this vector
    copy ()
    {
        return new Vector(this.x, this.y);
    }
}

// Represents a rectangle defined by the top-left corner and a width/height
class Rectangle
{
    constructor (position = new Vector(), width = 0, height = 0)
    {
        this.position = position;
        this.width = width;
        this.height = height;
        Object.seal(this);
    }

    // Uses AABB collision detection to determine whether two rectangles are intersecting
    intersects (other = new Rectangle())
    {
        return this.position.x < other.position.x + other.width
        && this.position.x + this.width > other.position.x
        && this.position.y < other.position.y + other.height
        && this.position.y + this.height > other.position.y;
    }

    // Returns the overlapping area of two rectangles
    overlap (other = new Rectangle())
    {
        let olWidth = Math.min(this.position.x + this.width, other.position.x + other.width) - Math.max(this.position.x, other.position.x);
        let olHeight = Math.min(this.position.y + this.height, other.position.y + other.height) - Math.max(this.position.y, other.position.y);

        if (olWidth <= 0 || olHeight <= 0) { return new Rectangle(); }

        let olX = Math.max(this.position.x, other.position.x);
        let olY = Math.min(this.position.y, other.position.y);

        return new Rectangle(new Vector(olX, olY), olWidth, olHeight);
    }

    center ()
    {
        return this.position.add(new Vector(this.width / 2, this.height / 2));
    }

    // Creates a copy of this rectangle
    copy ()
    {
        return new Rectangle(this.position.copy(), this.width, this.height);
    }
}

const GRAVITY = 1000;

// Represents a physics object with a rectangular collision box
class Kinematic
{
    constructor(position = new Vector(), width = 0, height = 0, mass = 1, maxSpeed = 1)
    {
        this.position = position;
        this.velocity = new Vector();
        this.acceleration = new Vector();

        this.collision = new Rectangle(this.position, width, height);

        this.mass = mass;
        this.maxSpeed = maxSpeed;

        Object.seal(this);
    }

    move(dt = 1/60)
    {
        this.velocity = this.velocity.add(this.acceleration.scale(dt));
        //this.velocity = this.velocity.clampMagnitude(this.maxSpeed);
        this.position = this.position.add(this.velocity.scale(dt));
        this.collision.position = this.position;
    }

    resetAcceleration()
    {
        this.acceleration = new Vector();
    }

    applyForce(force = new Vector())
    { 
        this.acceleration = this.acceleration.add(force.scale(1 / this.mass));
    }

    applyGravity()
    {
        this.acceleration = this.acceleration.add(new Vector(0, GRAVITY));
    }

    applyFriction(scalar = 1)
    {
        this.applyForce(this.velocity.scale(-scalar));
    }

    seek(target = new Vector())
    {
        let desiredVel = target.subtract(this.position);
        
        desiredVel = desiredVel.normalized().scale(this.maxSpeed);

        return desiredVel.subtract(this.velocity);
    }

    arrive(target = new Vector(), slowingDistance = 50)
    {
        let offset = target.subtract(this.position);
        let distance = offset.magnitude();

        if (distance == 0) { return; }

        let clippedSpeed = Math.min(this.maxSpeed, this.maxSpeed * (distance / slowingDistance));

        let desiredVel = offset.normalized().scale(clippedSpeed);

        return desiredVel.subtract(this.velocity);
    }
}