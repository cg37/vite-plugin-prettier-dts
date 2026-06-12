import type { Plugin, ViteDevServer } from "vite";
import { execSync } from "node:child_process";
import path from "node:path";

export interface PrettierDtsOptions {
  /**
   * 需要格式化的文件 glob 或路径数组
   * @default ["src/auto-imports.d.ts", "src/components.d.ts"]
   */
  files?: string | string[];

  /**
   * 防抖延迟（毫秒）
   * @default 200
   */
  debounce?: number;

  /**
   * Prettier 配置文件路径
   * @default 自动查找
   */
  prettierConfig?: string;

  /**
   * 是否在开发模式下启用
   * @default true
   */
  dev?: boolean;

  /**
   * 是否在生产构建时启用
   * @default true
   */
  build?: boolean;
}

const VIRTUAL_ID = "virtual:prettier-dts";

/**
 * 自动格式化生成的 .d.ts 文件的 Vite 插件
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import prettierDts from "vite-plugin-prettier-dts";
 *
 * export default defineConfig({
 *   plugins: [
 *     prettierDts({ files: "src/auto-imports.d.ts" })
 *   ]
 * });
 * ```
 */
export default function prettierDts(options: PrettierDtsOptions = {}): Plugin {
  const {
    files = ["src/auto-imports.d.ts", "src/components.d.ts"],
    debounce = 200,
    prettierConfig,
    dev = true,
    build = true,
  } = options;

  const fileList = Array.isArray(files) ? files : [files];
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const formatFile = (filePath: string, root: string) => {
    const configArg = prettierConfig ? ` --config "${prettierConfig}"` : "";
    try {
      execSync(`npx prettier --write${configArg} "${filePath}"`, {
        cwd: root,
        stdio: "pipe",
        timeout: 5000,
      });
    } catch {
      // 格式化失败时静默跳过
    }
  };

  const scheduleFormat = (filePath: string, root: string) => {
    if (timers.has(filePath)) clearTimeout(timers.get(filePath)!);
    timers.set(
      filePath,
      setTimeout(() => {
        timers.delete(filePath);
        formatFile(filePath, root);
      }, debounce),
    );
  };

  /** 格式化所有目标文件 */
  const formatAll = (root: string) => {
    for (const file of fileList) {
      const absPath = path.resolve(root, file);
      formatFile(absPath, root);
    }
  };

  return {
    name: "vite-plugin-prettier-dts",
    resolveId(id) {
      if (id === VIRTUAL_ID) return VIRTUAL_ID;
    },
    configureServer(server: ViteDevServer) {
      if (!dev) return;

      const root = server.config.root;
      const watchedFiles = fileList.map((f) => path.resolve(root, f));

      server.watcher.add(watchedFiles);
      server.watcher.on("change", (changedPath: string) => {
        const normalized = path.normalize(changedPath);
        if (watchedFiles.some((wf) => normalized === path.normalize(wf))) {
          scheduleFormat(changedPath, root);
        }
      });
    },
    writeBundle() {
      if (build) {
        formatAll(process.cwd());
      }
    },
  };
}
