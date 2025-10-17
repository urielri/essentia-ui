import { Button, Label, Layout } from "@repo/ui";
import Image from "next/image";

async function hello() {
  let t = "";
  await setTimeout(() => {
    t = "Hola";
  }, 1000);
  return t;
}

export default async function Home() {
  const h = await hello();
  return (
    <Layout.Root style={{ gridTemplateRows: "80px  1fr 1fr 80px" }}>
      <Layout.Header></Layout.Header>
      <Layout.FullWidth>
        <div
          className="full-width"
          style={{
            backgroundColor: "aliceblue",
            height: 900,
            width: "100%",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <Image src="/hero.jpg" alt="Logo" fill objectFit="cover" />
        </div>
        <div style={{ backgroundColor: "gainsboro", height: 20 }}></div>
      </Layout.FullWidth>
      <div
        className="breakout"
        style={{ background: "yellow", height: "1000px" }}
      >
        <div style={{ backgroundColor: "green" }}>
          <Button>Button</Button>
          <Button>Button</Button>
          <Button>Button</Button>
          <Button>Button</Button>
          <Label.Title>GHOasdf</Label.Title>
        </div>
        <div
          className="content-grid"
          style={{ backgroundColor: "antiquewhite" }}
        >
          <Button>Button</Button>
        </div>
      </div>
      <div style={{ backgroundColor: "red" }}></div>
      <Layout.FullWidth>
        <div style={{ backgroundColor: "aliceblue", height: 80 }}>
          full
          <h1>{process.env.PACKAGE_ENV}</h1>
        </div>
      </Layout.FullWidth>
    </Layout.Root>
  );
}
