# TagEX — 发货标签

[English](README.md) · [Português (Brasil)](README.pt-BR.md) · [Español](README.es.md) · **简体中文**

TagEX 是开源发货标签应用，支持普通纸张和热敏标签卷。可以手动填写、导入巴西 NF-e XML，或通过可选本地服务搜索企业文件夹。

- 界面默认英语，可切换巴西葡萄牙语、西班牙语和简体中文。
- 支持编辑批次、包裹编号、企业资料以及浅色和深色主题。
- 手动填写、本地 XML 导入和打印均可离线使用。

**界面语言与文档支持相互独立。** 当前导入器仅支持巴西销项 NF-e，型号 55。切换语言并不会自动支持其他国家的发票。打印标签的标题仍为葡萄牙语；姓名、地址和税务数据不会被翻译。

## 开始使用

1. [下载 Windows 安装包](https://github.com/Gabs0078/etiquetas-expedicao-universal/releases/tag/v0.5.0)，不要选择 Source code。
2. 解压整个 ZIP，然后打开 **Instalar TagEX.exe**。
3. 安装并打开 TagEX，选择导入 XML、手动填写或设置文件夹。

支持 Windows 10/11 x64，安装包已包含 Node.js 和依赖组件。目前尚无数字签名和自动更新功能。Linux/macOS 安装包计划后续提供。

[网页应用](https://gabs0078.github.io/etiquetas-expedicao-universal/) · [安装指南](https://gabs0078.github.io/etiquetas-expedicao-universal/instalar.html) · [参与贡献](CONTRIBUTING.md)

共享文件夹需要企业网络或 VPN。网页与本地应用的数据相互独立。请勿公开真实 XML、客户信息或凭据。采用 [MIT 许可](LICENSE)。
