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
        return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    }

    // Returns the vector produced by adding this to the given vector
    add (other = Vector())
    {
        return Vector(this.x + other.x, this.y + other.y);
    }

    // Returns the vector produced by subtracting the given vector from this
    subtract (other = Vector())
    {
        return Vector(this.x - other.x, this.y - other.y);
    }

    // Returns the vector scaled by the given scalar value. Doesn't change the vector itself.
    scale (scalar = 1)
    {
        return Vector(this.x * scalar, this.y * scalar);
    }

    // Returns a normalized version of this vector. Doesn't change the vector itself.
    normalized ()
    {
        let mag = this.magnitude();
        return this.scale(1 / mag);
    }

    // Creates a copy of this vector
    copy ()
    {
        return Vector(this.x, this.y);
    }
}

// Represents a rectangle defined by the top-left corner and a width/height
class Rectangle
{
    constructor (position = Vector(), width = 0, height = 0)
    {
        this.position = position;
        this.width = width;
        this.height = height;
        Object.seal(this);
    }

    // Uses AABB collision detection to determine whether two rectangles are intersecting
    intersects (other = Rectangle())
    {
        return this.x < other.x + other.width
        && this.x + this.width > other.x
        && this.y > other.y - other.height
        && this.y - this.height < other.y;
    }

    // Returns the overlapping area of two rectangles
    overlap (other = Rectangle())
    {
        let olWidth = Math.max(this.x, other.x) - Math.min(this.x + this.width, other.x + other.width);
        let olHeight = Math.min(this.y, other.y) - Math.max(this.y - this.height, other.y - other.height);

        if (olWidth <= 0 || olHeight <= 0) { return Rectangle(); }

        let olX = Math.max(this.x, other.x);
        let olY = Math.min(this.y, other.y);

        return Rectangle(Vector(olX, olY), olWidth, olHeight);
    }

    // Creates a copy of this rectangle
    copy ()
    {
        return Rectangle(this.position.copy(), this.width, this.height);
    }
}

// Represents a physics object with a rectangular collision box
class Kinematic
{
    constructor(position = Vector(), width = 0, height = 0, mass = 1, maxSpeed = 1)
    {
        this.position = position;
        this.velocity = Vector();
        this.acceleration = Vector();

        this.collision = Rectangle(this.position, width, height);

        this.mass = mass;
        this.maxSpeed = maxSpeed;

        Object.seal(this);
    }

    move(dt = 1/60)
    {
        this.velocity = this.velocity.add(this.acceleration.scale(dt));
        this.position = this.position.add(this.velocity.scale(dt));
    }

    resetAcceleration()
    {
        this.acceleration = Vector();
    }

    applyForce(force = Vector())
    {
        this.acceleration = this.acceleration.add(force.scale(1 / mass));
    }
}