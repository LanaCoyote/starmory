const fs = require('fs');
const path = require('path');

const partialDir = path.join( process.cwd(), "./partials/data/" );

class PartialDataFile {

    constructor ( prefix, suffix ) {
        this.prefix = prefix;
        this.suffix = suffix;

        this.parts = {};
    }

    loadPart ( partname, filename ) {
        const filepath = path.join( partialDir, filename );
        return new Promise(( ok, fail ) => {
            fs.readFile( filepath, 'utf8', ( err, data ) => {
                if ( err ) return fail( err );

                this.parts[ partname ] = data;
                ok( data );
            });
        });
    }

    loadMultipleParts ( partlist ) {
        let promises = [];

        for ( const part in partlist ) {
            promises.push( this.loadPart( part, partlist[ part ] ) );
        }

        return Promise.all( promises );
    }

    toString () {
        let partialString = this.prefix;
        let hasParts = false;

        for ( const part in this.parts ) {
            if ( hasParts ) partialString += ',';
            partialString += `"${ part }":${ this.parts[ part ] }`;
            hasParts = true;
        }

        return partialString + this.suffix;
    }

}

module.exports = PartialDataFile;