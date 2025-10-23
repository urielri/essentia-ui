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
declare const Home: $$__sveltets_2_IsomorphicComponent<{
    /** Color para el trazo del ícono. */ color?: string;
    /** Ancho del trazo. */ strokeWidth?: number;
    /** Tamaño del ícono. */ size?: number | string;
}, {
    [evt: string]: CustomEvent<any>;
}, {}, {}, string>;
type Home = InstanceType<typeof Home>;
export default Home;
//# sourceMappingURL=home.svelte.d.ts.map