import React from "react"
//loader 
export function LoaderAnimation() {
    return (
        <>
            <section className="custom-loader-container">
                <div className="custom-loader-square"></div>
                <div className="custom-loader-infinite-scroll"></div>
            </section>
            <style jsx>{`
                :root {
                    --bg-color: #1b2a3f; /* updated color */
                    --contrast-color: #1b2a3f; /* updated color */
                    --time: 2000ms;
                    --animation-settings: var(--time) ease infinite;
                }
                .custom-loader-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                @media (max-width: 768px), (hover: none) and (pointer: coarse){
                    .custom-loader-container {
                        scale: 1.3;
                    }
                }
                @property --widthSquare {
                    syntax:"<length>";
                    initial-value: 20px;
                    inherits: false;
                }
                .custom-loader-square {
                    width: var(--widthSquare, 20px);
                    aspect-ratio: 1/1;
                    border: 3px solid var(--contrast-color, #1b2a3f);
                    border-radius: .3rem;
                    margin-bottom: .2rem;
                    transform-origin: 100% 100%;
                    animation: roll var(--animation-settings, 2000ms ease infinite);
                }
                @keyframes roll {
                    25%{
                        transform: translate(calc(var(--widthSquare, 20px) * -1));
                    }
                    50%{
                        transform: rotate(90deg) translateY(var(--widthSquare, 20px));
                    }
                    75%{
                        transform: rotate(180deg) translateY(var(--widthSquare, 20px));
                    }
                    100%{
                        transform: rotate(180deg) translate(var(--widthSquare, 20px), var(--widthSquare, 20px));
                    }
                }
                .custom-loader-infinite-scroll{
                    position: relative;
                    width: calc(var(--widthSquare, 20px) * 3);
                    height: 2px;
                    overflow: hidden;
                }
                .custom-loader-infinite-scroll::before, .custom-loader-infinite-scroll::after {
                    content: "";
                    position: absolute;
                    width: var(--widthSquare, 20px);
                    height: 100%;
                    background: var(--contrast-color, #1a237e);
                }
                .custom-loader-infinite-scroll::before {
                    left: calc(50% - var(--widthSquare, 20px) / 2);
                    animation: moveBefore var(--animation-settings, 2000ms ease infinite);
                }
                .custom-loader-infinite-scroll::after {
                    left: 100%;
                    animation: moveAfter var(--animation-settings, 2000ms ease infinite);
                }
                @keyframes moveBefore {
                    25%{ left: 0; }
                    50%{ left: 0; }
                    75%{ left: 0; }
                    100%{ left: -30px; }
                }
                @keyframes moveAfter {
                    25%{ left: 100%; }
                    50%{ left: calc(100% - var(--widthSquare, 20px)); }
                    75%{ left: calc(100% - var(--widthSquare, 20px)); }
                    100%{ left: calc(50% - var(--widthSquare, 20px) / 2); }
                }
            `}</style>
        </>
    )
}

