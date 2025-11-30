<script>
  import { Layout, GlassBox } from "@repo/ui-svelte";
</script>

<Layout.Root style="grid-template-rows:80px 1fr 1fr 80px;">
  <Layout.Header></Layout.Header>
  <Layout.FullWidth>
    <div
      class="full-width"
      style="background:aliceblue;height:900px;width:100%;position:absolute;top:0px;left:0px;"
    >
      <div style="position: relative;   height: 900px;">
        <image
          src="/hero.jpg"
          alt="Logo"
          fill
          style="object-fit:cover; position: absolute;width: 100%;height: 100%;"
        />
        <div style="position:relative;width:100px;height:100px;">
          <GlassBox debug={false} captureStrategy="3d">
            <div
              style="width: 100px; height: 100px; background: transparent;"
            ></div>
            <h1>Hola</h1>
          </GlassBox>
        </div>
        <div
          style="display:none;position:absolute;top:200px;right:10px;width:300px;height:300px;"
        >
          <GlassBox style="height: 300px;" debug={false} captureStrategy="3d">
            <div
              style="width: 100px; height: 100px; background: transparent;"
            ></div>

            <h1>Hola</h1>
          </GlassBox>
        </div>
      </div>
      <div
        style="position:absolute;top:200px;left:50%;width:300px;height:300px;transform: translateX(-50%);"
      >
        <GlassBox style="height: 300px;" debug={false} captureStrategy="3d">
          <div
            style="width: 100px; height: 100px; background: transparent;"
          ></div>

          <h1>Hola</h1>
        </GlassBox>
      </div>
    </div>
    <div style="background:gainsboro;height:20px;"></div>
  </Layout.FullWidth>
  <div class="breakout" style="background:yellow;height:1000px;">
    <div style="background:green;">
      <button>Button</button>
      <button>Button</button>
      <button>Button</button>
      <button>Button</button>
      <GlassBox>
        <button>Button</button>
      </GlassBox>
      <GlassBox>
        <div
          style="width:100px;height:100px;background:red;border-radius:50%;"
        ></div>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
          elementum, nisi eu elementum tincidunt, ipsum nisl aliquet nisi, sit
          amet ullamcorper nisi nisl eu nisl. Donec elementum, nisi eu elementum
          tincidunt, ipsum nisl aliquet nisi, sit amet ullamcorper nisi nisl eu
          nisl. Donec elementum, nisi eu elementum tincidunt, ipsum nisl aliquet
          nisi, sit amet ullamcorper nisi nisl eu nisl. Donec elementum, nisi eu
          elementum tincidunt, ipsum nisl aliquet nisi, sit amet ullamcorper
          nisi nisl eu nisl. Donec elementum, nisi eu elementum tincidunt, ipsum
          nisl aliquet nisi, sit amet ullamcorper nisi nisl eu nisl. Donec
          elementum, nisi eu elementum tincidunt, ipsum nisl aliquet nisi, sit
          amet ullamcorper nisi nisl eu nisl. Donec elementum, nisi eu elementum
          tincidunt, ipsum nisl aliquet nisi, sit amet ullamcorper nisi nisl eu
          nisl. Donec elementum, nisi eu elementum tincidunt, ipsum nisl aliquet
          nisi, sit amet ullamcorper nisi nisl eu nisl.
        </p>
      </GlassBox>
      <div style="max-width: 60%">
        <GlassBox>
          <div
            style="width:100px;height:100px;background:red;border-radius:50%;"
          ></div>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
            elementum, nisi eu elementum tincidunt, ipsum nisl aliquet nisi, sit
          </p>
        </GlassBox>
      </div>
    </div>
    <div class="content-grid" style="background:antiquewhite;">
      <button>Button</button>
    </div>
  </div>

  <Layout.Footer>
    <div style="background:aliceblue;height:80px;">
      <h1>full WIDTH</h1>
    </div>
  </Layout.Footer>
</Layout.Root>
