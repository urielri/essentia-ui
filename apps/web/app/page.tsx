import { Button, Label, Layout } from "@repo/ui";

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
    <Layout.Root style={{ gridTemplateRows: "80px 1fr 80px" }}>
      <Layout.FullWidth>
        <div
          style={{ backgroundColor: "aliceblue", height: 60, width: "100%" }}
        >
          <h1>{h}</h1>
        </div>
        <div style={{ backgroundColor: "gainsboro", height: 20 }}></div>
      </Layout.FullWidth>
      <div
        className="breakout"
        style={{ background: "yellow", height: "100%" }}
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
