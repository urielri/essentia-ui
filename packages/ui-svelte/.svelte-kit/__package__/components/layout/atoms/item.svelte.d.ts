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
declare const Item: $$__sveltets_2_IsomorphicComponent<{
    icon: any;
    label?: string | undefined;
    style?: string | undefined;
    ariaLabel: string;
    selected?: boolean;
    onClick?: ((e: MouseEvent) => void) | undefined;
}, {
    [evt: string]: CustomEvent<any>;
}, {}, {}, string>;
type Item = InstanceType<typeof Item>;
export default Item;
//# sourceMappingURL=item.svelte.d.ts.map