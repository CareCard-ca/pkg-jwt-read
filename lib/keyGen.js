const {
    generateKeyPairSync,
} = require( 'node:crypto' );


const generateKeyPair = ( algorithm = 'ed25519' ) => {
    const options = {
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        },
    };

    if ( algorithm === 'rsa' ) {
        options.modulusLength = 2048;
    }

    return generateKeyPairSync( algorithm, options );
};


module.exports = {
    generateKeyPair
};