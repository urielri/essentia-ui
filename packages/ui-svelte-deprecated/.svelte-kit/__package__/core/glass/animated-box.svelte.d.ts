import * as THREE from "three";
interface $$__sveltets_2_IsomorphicComponent<Props extends Record<string, any> = any, Events extends Record<string, any> = any, Slots extends Record<string, any> = any, Exports = {}, Bindings = string> {
    new (options: import('svelte').ComponentConstructorOptions<Props>): import('svelte').SvelteComponent<Props, Events, Slots> & {
        $$bindings?: Bindings;
    } & Exports;
    (internal: unknown, props: Props & {
        $$events?: Events;
        $$slots?: Slots;
    }): Exports & {
        $set?: any;
        $on?: any;
    };
    z_$$bindings?: Bindings;
}
declare const AnimatedBox: $$__sveltets_2_IsomorphicComponent<{
    meshReference?: THREE.Mesh | undefined;
    /**
       * Función de actualización que GlassPlane invocará en cada cuadro.
       */ update?: (elapsed: number) => void;
}, {
    [evt: string]: CustomEvent<any>;
}, {}, {
    /**
       * Función de actualización que GlassPlane invocará en cada cuadro.
       */ update: (elapsed: number) => void;
}, string>;
type AnimatedBox = InstanceType<typeof AnimatedBox>;
export default AnimatedBox;
//# sourceMappingURL=animated-box.svelte.d.ts.map