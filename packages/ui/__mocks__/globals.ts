import { JSDOM } from "jsdom";
const dom = new JSDOM();
global.document = dom.window.document;
//global.window = new dom.window.Window() as Window & typeof globalThis;
