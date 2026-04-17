/// <reference types="vite/client" />

declare module "*.html?raw" {
    const content: string;
    export default content;
}

declare module "@game/constants.js" {
    export const QUEST_ROUTE: Array<{
        x: number;
        y: number;
        name: string;
        blurb: string;
        hue: string;
    }>;
    export const MB_REACT_RETURN_AFTER_OVERLAY_KEY: string;
}
