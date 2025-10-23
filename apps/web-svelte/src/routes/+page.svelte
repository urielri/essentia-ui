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
      <button>Button</button>
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
