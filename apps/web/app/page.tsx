import { Button, Layout } from "essentia-ui";

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
        <div style={{ backgroundColor: "aliceblue", height: 80 }}>full</div>
      </Layout.FullWidth>
    </Layout.Root>
  );
}

const Icon = () => {
  return (
    <svg
      width="113"
      height="113"
      viewBox="0 0 113 113"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M61.4478 29.39C47.3429 26.6494 33.3204 35.2592 29.5445 49.3508C25.5985 64.0777 34.3381 79.2152 49.065 83.1613C60.8635 86.3227 72.928 81.3408 79.2867 71.6618C76.2837 72.0543 73.1554 71.877 70.0508 71.0451C57.3552 67.6433 49.821 54.5938 53.2228 41.8982C54.6017 36.7522 57.567 32.4545 61.4478 29.39ZM24.0276 47.8726C28.7901 30.0987 47.0594 19.5509 64.8332 24.3134C66.4869 24.7565 68.0797 25.3172 69.6046 25.9846C70.6594 26.4462 71.3338 27.4962 71.315 28.6474C71.2962 29.7987 70.5878 30.8261 69.5185 31.253C64.3935 33.2991 60.2751 37.6465 58.7398 43.3765C56.1544 53.0251 61.8804 62.9428 71.5291 65.5281C75.7008 66.6459 79.9152 66.2117 83.5723 64.579C84.6232 64.1099 85.853 64.3173 86.6918 65.1053C87.5306 65.8932 87.8145 67.1077 87.4119 68.1858C81.475 84.0843 64.3132 93.1601 47.5867 88.6782C29.8129 83.9157 19.2651 65.6464 24.0276 47.8726Z"
        fill="black"
      />
    </svg>
  );
};
