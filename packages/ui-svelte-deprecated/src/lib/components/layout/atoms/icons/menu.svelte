<script lang="ts">
  export let color: string = "#F8F9FA";
  export let strokeWidth: number = 2;
  export let size: number | string = 24;
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M5 17H19M5 12H19M5 7H19"
    stroke={color}
    stroke-width={strokeWidth}
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
