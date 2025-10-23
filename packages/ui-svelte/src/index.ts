import "./lib/styles/global.css";
import {
  Header,
  Footer,
  Root,
  Content,
  FullWidth,
} from "./lib/components/layout/index";
import GlassBox from "./lib/core/glass/box.svelte";
const Layout = { Header, Footer, Root, Content, FullWidth };
export { Layout, GlassBox };
//import * as HeaderModule from "./lib/components/layout/atoms/header.svelte";
//export const Header = HeaderModule.default;
