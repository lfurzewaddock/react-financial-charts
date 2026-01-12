import * as React from "react";
import { AutoSizer, type AutoSizerProps } from "react-virtualized-auto-sizer";

export interface WithSizeProps {
    readonly width: number;
    readonly height: number;
}

export const withSize = (props?: Omit<AutoSizerProps, "Child" | "ChildComponent" | "renderProp">) => {
    return <TProps extends WithSizeProps>(OriginalComponent: React.ComponentClass<TProps>) => {
        return class WithSize extends React.Component<Omit<TProps, "width" | "height">> {
            public render() {
                return (
                    <AutoSizer
                        {...props}
                        ChildComponent={({ height = 0, width = 0 }) => {
                            // abort if no height yet
                            return height <= 0 ? null : (
                                <OriginalComponent {...(this.props as TProps)} height={height} width={width} />
                            );
                        }}
                    />
                );
            }
        };
    };
};
