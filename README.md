# vite-plugin-prettier-dts

[![npm version](https://img.shields.io/npm/v/vite-plugin-prettier-dts)](https://www.npmjs.com/package/vite-plugin-prettier-dts)
[![GitHub](https://img.shields.io/badge/github-cg37%2Fvite--plugin--prettier--dts-blue?logo=github)](https://github.com/cg37/vite-plugin-prettier-dts)

自动格式化 Vite 项目中由其他插件生成的 `.d.ts` 声明文件（如 `unplugin-auto-import`、`unplugin-vue-components`），使其符合项目的 Prettier 配置。

## 为什么需要？

`unplugin-auto-import` / `unplugin-vue-components` 生成的 `.d.ts` 文件使用硬编码的 2 空格缩进，如果你的项目使用 4 空格（或其他配置），缩进会不一致。本插件在文件生成后自动运行 Prettier 统一格式。

## 安装

```bash
pnpm add -D vite-plugin-prettier-dts
```

## 使用

```ts
// vite.config.ts
import { defineConfig } from "vite";
import prettierDts from "vite-plugin-prettier-dts";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";

export default defineConfig({
  plugins: [
    AutoImport({
      imports: ["vue", "vue-router"],
      dts: "src/auto-imports.d.ts",
    }),
    Components({
      dts: "src/components.d.ts",
    }),
    // 放在其他插件之后
    prettierDts(),
  ],
});
```

## 配置

```ts
prettierDts({
  /** 需要格式化的文件 */
  files: ["src/auto-imports.d.ts", "src/components.d.ts"],

  /** 防抖延迟 (ms)，默认 200 */
  debounce: 200,

  /** 指定 Prettier 配置文件路径 */
  prettierConfig: ".prettierrc",

  /** 开发模式下启用，默认 true */
  dev: true,

  /** 生产构建时启用，默认 true */
  build: true,
});
```

## 原理

```
插件生成 .d.ts → Vite 文件监听触发 → 防抖等待 → npx prettier --write → 文件格式统一
```

- **开发模式**：通过 `configureServer` 监听文件变化，自动格式化
- **生产构建**：通过 `writeBundle` 钩子，构建完成后格式化

## License

MIT
