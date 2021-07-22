import * as React from "react"
import katex from "katex"

export function functionPath( c: CanvasRenderingContext2D, f: ( number ) => number, samples: number, min: number, max: number ) {
    c.beginPath()
    let dx = ( max - min ) / samples
    for ( let i = 0; i <= samples; i++ ) {
        let x = min + dx * i, y = f( x )
        if ( i == 0 )
            c.moveTo( x, y )
        else
            c.lineTo( x, y )
    }
}

export function makePath( c: CanvasRenderingContext2D, ...data: number[] ) {
    c.beginPath()
    for ( let i = 0; i < data.length; i += 2 ) {
        let x = data[ i ], y = data[ i + 1 ]
        if ( i == 0 )
            c.moveTo( x, y )
        else
            c.lineTo( x, y )
    }
}

export function linePath( c: CanvasRenderingContext2D, x1, y1, x2, y2 ) {
    c.beginPath()
    c.moveTo( x1, y1 )
    c.lineTo( x2, y2 )
}

export function TeX( props: { src: string, style?: React.CSSProperties, className?: string } ) {
    const style = Object.assign( { userSelect: "none" }, props.style ?? {} )
    const ref = React.createRef<HTMLSpanElement>()
    React.useEffect( () => { katex.render( props.src, ref.current ) } )
    return <span style={ style } ref={ ref } className={ props.className } />
}

export function TeXBlock( props: { src: string, style?: React.CSSProperties, className?: string } ) {
    const style = Object.assign( { textAlign: "center", gridColumn: "2 / 2" }, props.style ?? {} )
    return <div style={ { display: "grid", gridTemplateColumns: "auto auto auto" } }>
        <TeX src={ props.src } style={ style } className={ props.className } />
    </div>
}

// http://en.wikipedia.org/wiki/HSL_color_space
export function hslToRgb( h, s, l ): [ number, number, number ] {
    var r, g, b;

    if ( s == 0 ) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb( p, q, t ) {
            if ( t < 0 ) t += 1;
            if ( t > 1 ) t -= 1;
            if ( t < 1 / 6 ) return p + ( q - p ) * 6 * t;
            if ( t < 1 / 2 ) return q;
            if ( t < 2 / 3 ) return p + ( q - p ) * ( 2 / 3 - t ) * 6;
            return p;
        }

        var q = l < 0.5 ? l * ( 1 + s ) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb( p, q, h + 1 / 3 );
        g = hue2rgb( p, q, h );
        b = hue2rgb( p, q, h - 1 / 3 );
    }

    return [ Math.round( r * 255 ), Math.round( g * 255 ), Math.round( b * 255 ) ];
}

export function rgbToHex( color: [ number, number, number ] ) {
    let [ r, g, b ] = color
    const format = x => x.toString( 16 ).padStart( 2, "0" )
    return "#" + format( r ) + format( g ) + format( b )
}

// export function hslToHex( h, s, l ) {
//     let [ r, g, b ] = hslToRgb( h, s, l )
//     return rgbToHex()
// }