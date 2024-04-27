
export namespace SafeType {
    export type Source<TParent extends string, TChild extends string> = `${TParent}.${TChild}`;

    export namespace Source {
        export function from<TParent extends string, TChild extends string>(
            parent: TParent,
            child: TChild,
        ): Source<TParent, TChild> {
            return `${parent}.${child}` as const;
        }
    }
}