# Jwt read utility

## Main Functionality

This is a collection of jwt reading functions.

### Main functions

```js
const jwtReader = require( '@chatpta/jwt-read' );
```

Read jwt

```js
const jwtMiddleware = jwtReader.verifyJwtAndRole( "admin", publicKey, jwtReader.throwUsedTokenError );
await jwtMiddleware( req, res, next );
```

Following the above ```req.jwt``` contains

```js
{
    header: {
    alg:...
    }
,
    payload: {
    ...
    }
}
```
