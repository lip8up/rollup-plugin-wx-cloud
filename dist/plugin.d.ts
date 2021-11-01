import type { Plugin } from 'rollup';
import { TransformerOptions } from 'typescript-transform-wx-cloud';
import { Package } from './template';
export interface WxCloudOptions {
    /** 函数名前缀 */
    prefix?: string;
    /** 生成 package.json 的配置 */
    packageOptions?: Partial<Omit<Package, 'name' | 'dependencies'>>;
    /** 全部依赖 */
    allDependencies: {
        [name: string]: string;
    };
    /** 原函数客户端文件生成路径，若不传，则不生成 */
    clientFilePath?: string;
    /** 传递给 TypeScript 转换器的选项，一般不用传递该值 */
    transformerOptions?: Omit<TransformerOptions, 'wxCloudEmitParams'>;
}
export declare function createTransformerAndPlugin(options?: WxCloudOptions): {
    wxCloudTransformer: import("typescript").TransformerFactory<import("typescript").SourceFile>;
    wxCloudPlugin: Plugin;
    outputDirectory: (baseDir: string, fpath: string) => string;
};
