# AI 代码审查规则

> 强制要求：所有代码在提交前必须通过 AI 代码审查
> 本规则基于 code-review-expert 和 frontend-code-review Skills

---

## 审查范围

### 必须审查的场景

1. **每次代码修改后** - 任何新增或修改的代码
2. **PR/MR 提交前** - 合并前必须完成审查
3. **功能完成时** - 每个功能开发完成后
4. **用户明确要求** - 用户要求审查特定代码

### 审查文件类型

- **前端代码**: `.tsx`, `.ts`, `.js` → 使用 `frontend-code-review` skill
- **后端/全栈代码**: `.ts`, `.js`, `.py` → 使用 `code-review-expert` skill

---

## 运行前检查流程 (强制)

**在运行 Web/移动端前，必须执行以下检查：**

### Step 1: TypeScript 类型检查

```bash
cd d:\Code\mono-app
npm run typecheck
```

**作用**: 检查编译错误、类型错误、语法错误

**通过标准**: 无错误输出

### Step 2: AI 代码审查

根据文件类型选择对应的 Skill：

```bash
# 前端文件 (.tsx/.ts/.js)
→ 调用 frontend-code-review Skill

# 后端/全栈文件
→ 调用 code-review-expert Skill
```

**作用**: 检查代码质量、潜在 bug、性能问题、安全问题

**通过标准**: P0/P1 问题必须解决

### Step 3: 确认无阻塞问题

| 检查项 | 工具 | 阻塞级别 |
|--------|------|----------|
| TypeScript 编译错误 | `tsc --noEmit` | 🔴 阻塞 |
| P0 严重问题 | AI 审查 | 🔴 阻塞 |
| P1 高优先级问题 | AI 审查 | 🟡 建议修复 |
| P2/P3 问题 | AI 审查 | 🟢 可选 |

---

## 审查流程 (强制)

### 调用 Skill

根据文件类型选择对应的 Skill：

```bash
# 前端文件 (.tsx/.ts/.js)
→ 调用 frontend-code-review Skill

# 后端/全栈文件
→ 调用 code-review-expert Skill
```

### 执行审查

使用对应 Skill 的工作流：

**frontend-code-review**:
- 检查 `references/code-quality.md`
- 检查 `references/performance.md`
- 检查 `references/business-logic.md`

**code-review-expert**:
- 检查 `references/solid-checklist.md`
- 检查 `references/security-checklist.md`
- 检查 `references/code-quality-checklist.md`

### 问题分类

| 等级 | 说明 | 行动 |
|------|------|------|
| **P0** | 严重：安全漏洞、数据丢失风险、正确性 bug | 必须阻止合并 |
| **P1** | 高：逻辑错误、重大 SOLID 违规、性能回归 | 合并前应修复 |
| **P2** | 中：代码异味、可维护性问题 | 本次 PR 或后续修复 |
| **P3** | 低：样式、命名、建议改进 | 可选改进 |

### 输出格式

必须按照 Skill 定义的模板输出审查结果。

### 用户确认

审查完成后，询问用户如何处理：

```
## Next Steps

我发现了 X 个问题 (P0: _, P1: _, P2: _, P3: _).

**你希望如何处理？**

1. 全部修复 - 我将实施所有建议的修复
2. 仅修复 P0/P1 - 解决严重和高优先级问题
3. 修复特定项 - 告诉我需要修复哪些问题
4. 不修改 - 审查完成，无需实施
```

---

## 禁止事项

- ❌ 未经审查直接提交代码
- ❌ TypeScript 编译错误未修复就运行
- ❌ 跳过 P0/P1 问题继续合并
- ❌ 忽略安全检查
- ❌ 不使用对应 Skill 进行审查

---

## 本地开发流程

1. **开发代码** → 完成功能开发
2. **类型检查** → 运行 `npm run typecheck` 确保无编译错误
3. **AI 审查** → 调用对应 Skill 审查代码
4. **修复问题** → 根据审查结果修复
5. **再次检查** → 运行 `npm run check` 确认无错误
6. **运行应用** → `npm run web` 或 `npm start`
7. **提交代码** → 审查通过后可提交

---

## 审查检查清单

### 代码质量 (Code Quality)
- [ ] 错误处理完整
- [ ] 无硬编码敏感信息
- [ ] 命名清晰一致
- [ ] 代码无重复 (DRY)
- [ ] 函数/组件职责单一

### 性能 (Performance)
- [ ] 无 N+1 查询问题
- [ ] 无内存泄漏风险
- [ ] 列表使用虚拟化 (如需)
- [ ] 资源懒加载 (如需)

### 安全 (Security)
- [ ] 无 XSS 漏洞
- [ ] 无注入风险
- [ ] 敏感数据不暴露
- [ ] 权限校验完整

### 业务逻辑 (Business Logic)
- [ ] 边界条件处理
- [ ] 空值/空集合处理
- [ ] 数值边界处理
- [ ] 状态管理正确

### TypeScript 检查
- [ ] 无编译错误
- [ ] 无类型错误
- [ ] 无隐式 any
- [ ] 严格模式启用
