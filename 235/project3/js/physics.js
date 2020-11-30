"use strict";

// Represents a 2D vector in space
class Vector
{
    constructor (x = 0, y = 0)
    {
        this.x = x;
        this.y = y;
    }

    // Returns the magnitude of the vector
    magnitude()
    {
        return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    }

    // Returns the vector produced by adding this to the given vector
    add(other = new Vector())
    {
        return Vector(this.x + other.x, this.y + other.y);
    }

    // Returns the vector produced by subtracting the given vector from this
    subtract(other = new Vector())
    {
        return Vector(this.x - other.x, this.y - other.y);
    }

    // Returns the vector scaled by the given scalar value. Doesn't change the vector itself.
    scale(scalar = 1)
    {
        return Vector(this.x * scalar, this.y * scalar);
    }

    // Returns a normalized version of this vector. Doesn't change the vector itself.
    normalized()
    {
        let mag = this.magnitude();
        return this.scale(1 / mag);
    }
}