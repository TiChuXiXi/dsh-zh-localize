// dsh-zh-localize 主机端（Node）半身：本插件的工作全部在浏览器端完成，
// 这里只需提供一个可成功激活的空插件，使 loader 行成立（client-modules
// 只扫描 fiber 已激活且未禁用的 loader 条目）。
export const apply = () => {};
