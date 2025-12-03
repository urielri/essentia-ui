import "./lib/styles/global.css";
import {
  Header,
  Footer,
  Root,
  Content,
  FullWidth,
} from "./lib/components/layout/index";
//@deprecated
import GlassBox from "./lib/core-deprecated/glass/box.svelte";

import Wrapper from "./lib/webGL/core/Wrapper.svelte";
const Layout = { Header, Footer, Root, Content, FullWidth };
export { Layout, GlassBox, Wrapper };
