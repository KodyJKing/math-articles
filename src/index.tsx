import * as ReactDOM from "react-dom"
import * as React from "react"
import { functionPath, hslToRgb, linePath, makePath, rgbToHex, TeX, TeXBlock } from "./common"
import Vector from "./math/Vector"

import "katex/dist/katex.min.css"
import { lerp, smoothstep } from "./math/math"
import Color, { Colors } from "./Color"

ReactDOM.render(
    <Main />,
    document.getElementById( "root" )
)

function Main() {
    return <div className="main">
        <article>
            <h1 style={ { margin: 0 } }>Inverse Transform Sampling</h1>
            <p>
                Suppose you wanted to generate a random number according to an arbitrary distribution function, like a quadratic curve or a bell curve,
                but all you have is a random number generator which outputs uniform random numbers. Inverse transform sampling gives a pretty simple way to do this
                as long as you can compute the inverse of the cumulative distribution function (the quantile function).
                To get a sample from your distribution, you just pass a uniform random number from [0,1] into the quantile function. The formula is quite simple, but it was
                fairly mysterious to me when I first saw it. I'd like to give a visual intuition for why this works.
            </p>

            <h3>From Rejection Sampling to Inverse Transform Sampling</h3>
            <p>
                One way to sample from a distribution is to generate 2D sample points until one of them lands under the distribution curve.
                You then output this point's x value. This way, x values where the PDF is larger will have proportionally
                higher probabilities of being selected.
            </p>
            <div className="hcenter-outer"> <div className="hcenter-inner">
                <RejectionSampling f={ guassian( .5, .25, .5 ) } samples={ 500 } />
            </div> </div>
            <h4>A better algorithm</h4>
            <p>
                Rather than sampling in 2 dimensions and possibly missing the distribution, we can instead sample in 1 dimension and always get a valid result.
                Imagine cutting the distribution into discrete bars and stacking them vertically.
                Then pick a random horizontal line along the height of the stack and choose the bar that crosses this line.
                Then output this bar's x value. You can see that the probability of selecting a value of x is proportional
                to the value of the PDF at that x.
            </p>
            <div className="hcenter-outer"> <div className="hcenter-inner">
                <StackBars f={ guassian( .5, .25 ) } barCount={ 21 } /> <br />
            </div> </div>
            <p>
                You may recognize the shape of the "stack" of bars as the cumulative distribution curve.
                The elevation of each bar is the cumulative height of the bars before it.
                So what we are looking for is a value of x, such that <TeX src="\operatorname{CDF}(x) = y" />. Solving for the output, you find
                the inverse transform sampling formula:
            </p>
            <TeXBlock src="\operatorname{CDF}(x) = y \rightarrow x = \operatorname{CDF}^{-1}(y)" />
            <p>
                Because the range of CDF is [0,1], the domain of it's inverse is also [0,1], so <TeX src="y" /> should be a uniform
                random variable on [0,1].
            </p>
            <p>
                If you imagine the limit as you increase the number of bars, you can see how this
                logic extends to continous distributions.
            </p>

            <h3>A Different Perspective</h3>
            <p>
                Consider what happens to regularly spaced samples when passed through an arbitrary function, <TeX src="f" />.
                Pay particular attention to the relationship between the density of outputs and <TeX src="f^{-1}" />.
                Notice that when <TeX src="f^{-1}" /> is steep, the outputs seem to bunch up.
            </p>
            <BandGraph f={ x => x * x } samples={ 20 } band={ 15 } />
            <BandGraph f={ x => Math.log( x * 10 + 1 ) * .4 } samples={ 20 } band={ 10 } />
            <p>
                We can calculate the probability density of the output in the highlighted band by taking <TeX src="dw / dh" />.
                Notice that <TeX src="dw = dh (f^{-1}(y))'" />. Then you can find the general PDF formula:
            </p>
            <TeXBlock src="dh = dw / (f^{-1}(y))'" />
            <br />
            <TeXBlock src="\operatorname{PDF}(y) = dw / dh = \frac{dw}{dw / (f^{-1}(y))'} = (f^{-1}(y))'" />
            <p>
                So the density of the output is higher where <TeX src="f^{-1}" /> is growing quickly.
                Now we can see why using the CDF as <TeX src="f^{-1}" /> produces the desired result. By definition, the CDF's growth
                at x is proportional to the value of the PDF at x.
            </p>
            <TeXBlock src="f^{-1}(y)=\operatorname{CDF}(y) \rightarrow f(y) = \operatorname{CDF}^{-1}(y)" />
        </article>
    </div>
}

function guassian( mean, stDev, vscale = 1 ) {
    let c = vscale / ( stDev * Math.sqrt( 2 * Math.PI ) )
    return x => {
        let exponent = -.5 * ( ( x - mean ) / stDev ) ** 2
        return c * Math.exp( exponent )
    }
}

function StackBars( props: { f: ( number ) => number, barCount: number } ) {
    const ref = React.createRef<HTMLCanvasElement>()

    let [ sampleY, setSampleY ] = React.useState( .6 )

    React.useEffect( () => {
        let { f, barCount } = props
        let stopAnimating = false

        type Bar = { width: number, height: number, color: Color, pos: Vector }
        type BarAnim = Bar[]
        let barAnims: BarAnim[] = []

        // Generate the animation frames:
        const startVscale = .5
        const dx = 1 / barCount
        let cdf: number[] = []
        let cumulativeHeight = 0
        let alreadSelectedBar = false
        for ( let i = 0; i < barCount; i++ ) {
            let x = i * dx
            let width = dx
            let height = f( x + dx * .5 )
            // let color = Color.hsl( x, .35, .65 )
            let color = Color.parse( "#b5c5c9" )
            let restingHeight = cumulativeHeight
            cumulativeHeight += height
            let isSelected = !alreadSelectedBar && cumulativeHeight * dx >= sampleY
            alreadSelectedBar ||= isSelected
            let color2 = isSelected ? Color.parse( "#403e39" ) : color
            cdf.push( cumulativeHeight )
            barAnims.push( [
                { color, width, height: height * startVscale, pos: new Vector( x, 0 ) },
                { color, width, height: height * dx, pos: new Vector( x, 0 ) },
                { color, width, height: height * dx, pos: new Vector( x, restingHeight * dx ) },
                // { color, width, height: height * dx, pos: new Vector( .5 - dx * .5, restingHeight * dx ) },

                // { color: color2, width, height: height * dx, pos: new Vector( .5 - dx * .5, restingHeight * dx ) },
                { color: color2, width, height: height * dx, pos: new Vector( x, restingHeight * dx ) },
                { color: color2, width, height: height * dx, pos: new Vector( x, 0 ) },
                { color: color2, width, height: height * startVscale, pos: new Vector( x, 0 ) },
            ] )
        }
        const frameCount = barAnims[ 0 ].length

        animate()
        function animate() {
            let canvas = ref.current
            if ( canvas ) {
                let c = canvas.getContext( "2d" )
                c.save()

                c.clearRect( 0, 0, canvas.width, canvas.height )

                const scale = 400
                c.scale( scale, -scale )
                c.translate( 0, -1 )
                c.lineWidth = 2 / scale
                c.lineJoin = "round"

                linePath( c, 0, sampleY, 1, sampleY )
                c.strokeStyle = "#e3ddcc"
                c.stroke()

                const animSpeed = .125
                let t = performance.now() / 1000 * animSpeed
                let f_frame = ( t % 1 ) * frameCount
                let i_frame = Math.floor( f_frame )
                let partialFrame = f_frame - i_frame
                for ( let barAnim of barAnims ) {
                    let j_frame = ( i_frame + 1 ) % frameCount
                    let frame0 = barAnim[ i_frame % frameCount ]
                    let frame1 = barAnim[ j_frame ]
                    let alpha = smoothstep( .2, .8, partialFrame )

                    let width = lerp( frame0.width, frame1.width, alpha )
                    let height = lerp( frame0.height, frame1.height, alpha )
                    let color = frame0.color.lerp( frame1.color, alpha ).toString()
                    let x = lerp( frame0.pos.x, frame1.pos.x, alpha )
                    let y = lerp( frame0.pos.y, frame1.pos.y, alpha )

                    c.beginPath()
                    const p = .5 / scale, p2 = p * 2 // padding values
                    c.rect( x + p, y + p, width - p2, height - p2 )
                    c.fillStyle = color
                    c.fill()
                }

                c.restore()
            }

            if ( !stopAnimating )
                requestAnimationFrame( animate )
        }

        return function cleanup() {
            stopAnimating = true
        }
    } )

    return <div style={ { margin: 0 } }>
        <canvas className="demo" width="400" height="400" ref={ ref } style={ { display: "block" } } />
        <input name="sampleY" type="range" min="0" max="1" step=".001" value={ sampleY } onChange={ ev => setSampleY( parseFloat( ev.target.value ) ) } />
        <label htmlFor="sampleY">sample y</label>
    </div>
}

function RejectionSampling( props: { f: ( number ) => number, samples: number } ) {
    const ref = React.createRef<HTMLCanvasElement>()

    React.useEffect( () => {
        let { f, samples } = props
        let canvas = ref.current
        let c = canvas.getContext( "2d" )

        const scale = 400
        c.scale( scale, -scale )
        c.translate( 0, -1 )
        c.lineWidth = 1 / scale
        c.lineJoin = "round"

        for ( let i = 0; i < samples; i++ ) {
            let x = Math.random(), y = Math.random(), fx = f( x )
            let hit = y <= fx
            c.beginPath()
            c.arc( x, y, 3 / scale, 0, Math.PI * 2 )
            c.fillStyle = hit ? "#a6e0b0" : "#d690ab"
            c.fill()
        }

        c.strokeStyle = "#b5ae9e"
        c.lineWidth = 2 / scale
        functionPath( c, f, 100, 0, 1 )
        c.stroke()
    } )

    return <canvas className="demo" width="400" height="400" ref={ ref } />
}

function BandGraph( props: { f: ( number ) => number, samples: number, band: number } ) {
    const ref = React.createRef<HTMLCanvasElement>()

    React.useEffect( () => {
        let { f, samples, band } = props
        let canvas = ref.current
        let c = canvas.getContext( "2d" )

        const scale = 400
        c.scale( scale, -scale )
        c.translate( 0, -1 )
        c.lineWidth = 1 / scale
        c.lineJoin = "round"

        let dx = 1 / samples
        function sample( i: number ) {
            let x = ( i + .5 ) * dx, y = f( x )
            return new Vector( x, y )
        }

        const s0 = sample( band )
        const s1 = sample( band + 1 )
        makePath( c,
            s0.x, 0,
            s0.x, s0.y,
            0, s0.y,
            0, s1.y,
            s1.x, s1.y,
            s1.x, 0,
            s0.x, 0
        )
        c.fillStyle = "#b5c5c9"
        c.fill()

        c.font = "12px Cambria Math"
        c.fillStyle = "white"
        c.save()
        {
            c.translate( 0, s0.y * .5 + s1.y * .5 )
            c.scale( 1 / scale, -1 / scale )
            c.textBaseline = "middle"
            c.fillText( "dh", 2, 1 )
        }
        c.restore()
        c.save()
        {
            c.translate( s0.x * .5 + s1.x * .5, 0 )
            c.scale( 1 / scale, -1 / scale )
            c.textAlign = "center"
            c.fillText( "dw", 0, -2 )
        }
        c.restore()

        c.strokeStyle = "#d6cfbd"
        for ( let i = 0; i < samples; i++ ) {
            let { x, y } = sample( i )
            makePath( c,
                x, 0,
                x, y,
                0, y
            )
            c.stroke()
        }

        c.strokeStyle = "#b5ae9e"
        c.lineWidth = 2 / scale
        functionPath( c, f, 100, 0, 1 )
        c.stroke()
    } )

    return <canvas className="demo" width="400" height="400" ref={ ref } />
}