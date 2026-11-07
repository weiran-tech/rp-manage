import type { MenuNode } from '@/types/api';

export type Row = Record<string, unknown> & { id: number };
export const timestamp = '2026-11-07 09:00:00';
let menuId = 0;
function menu(title: string, path: string, component: string | null, icon = 'LayoutDashboard', children: MenuNode[] = []): MenuNode {
    const id = ++menuId;
    children.forEach((child) => { child.parentId = id; });
    return { id, parentId: 0, title, path, component, icon, type: children.length ? 'directory' : 'menu', permission: null,
        sort: id, visible: true, keepAlive: true, isExternal: false, status: 'enabled', children };
}

/** 新增原型页面时在这里登记；component 相对 src/pages，不含 .tsx。 */
export const menus = [
    menu('工作台', '/dashboard', 'dashboard/DashboardPage'),
    { ...menu('使用文档', 'http://localhost:4809', null, 'BookOpen'), isExternal: true },
    menu('系统管理', '/system', null, 'Settings', [
        menu('用户管理', '/system/users', 'system/users/UsersPage', 'UsersRound'),
        menu('角色管理', '/system/roles', 'system/roles/RolesPage', 'Shield'),
        menu('菜单管理', '/system/menus', 'system/menus/MenusPage', 'LayoutList'),
        menu('字典管理', '/system/dicts', 'system/dicts/DictsPage', 'BookOpen'),
        menu('系统配置', '/system/configs', 'system/configs/ConfigsPage', 'Settings'),
        menu('短信配置', '/system/sms', 'system/sms/SmsConfigsPage', 'MessageSquare'),
        menu('安全设置', '/system/security', 'system/security/SecuritySettingsPage', 'Shield'),
        menu('上传设置', '/system/upload-settings', 'system/upload-settings/UploadSettingsPage', 'Cloud'),
        menu('资源库', '/system/media-library', 'system/media-library', 'Image'),
        menu('行政区划', '/system/regions', 'system/regions/RegionsPage', 'MapPinned'),
    ]),
    menu('审计日志', '/logs', null, 'ScrollText', [
        menu('登录日志', '/logs/login', 'logs/LoginLogsPage'),
        menu('操作日志', '/logs/operation', 'logs/OperationLogsPage'),
    ]),
    menu('原型演示', '/demo', null, 'LayoutGrid', [
        menu('列表与表格', '/demo/list', 'demo/DemoListPage'),
        menu('表单与组件', '/demo/fields', 'demo/DemoFieldsPage'),
        menu('动态配置', '/demo/config', 'demo/DemoConfigPage'),
        menu('导航与布局', '/demo/navigation', 'demo/DemoNavigationPage'),
        menu('权限展示', '/demo/access', 'demo/DemoAccessPage'),
        menu('批处理工作台', '/demo/batch', 'demo/DemoBatchPage'),
        menu('自增序号', '/demo/sequence', 'demo/DemoSequencePage'),
    ]),
];

function flatten(nodes: MenuNode[]): Row[] {
    return nodes.flatMap(({ children, ...node }) => [{ ...node }, ...flatten(children)]);
}
function config(id: number, configKey: string, configValue: string, groupKey: string, description: string, fieldType = 'input'): Row {
    return { id, configKey, configValue, groupKey, description, fieldType, configType: fieldType === 'switch' ? 'boolean' : 'string',
        fieldOptions: null, required: false, isBuiltin: true, createdAt: timestamp, updatedAt: timestamp };
}
export function createSeed(): Record<string, Row[]> {
    return {
        menu: flatten(menus),
        user: Array.from({ length: 28 }, (_, index) => ({ id: index + 1, username: index ? `user${index}` : 'admin',
            nickname: index ? ['林晓', '陈晨', '李明', '王悦'][index % 4] + String(index) : '原型管理员',
            phone: `138${String(index).padStart(8, '0')}`, avatar: null, gender: index % 2 ? 'female' : 'male',
            status: index === 8 ? 'disabled' : 'enabled', isBuiltin: index === 0, roleIds: [index ? 2 : 1],
            roleNames: [index ? '内容编辑' : '超级管理员'], lastLoginAt: timestamp, lastLoginIp: '127.0.0.1', createdAt: timestamp, updatedAt: timestamp })),
        role: [
            { id: 1, name: '超级管理员', code: 'super_admin', description: '原型全部操作', sort: 0, status: 'enabled', isBuiltin: true, userCount: 1, menuIds: flatten(menus).map((m) => m.id), createdAt: timestamp, updatedAt: timestamp },
            { id: 2, name: '内容编辑', code: 'editor', description: '用于演示角色维护', sort: 1, status: 'enabled', isBuiltin: false, userCount: 27, menuIds: [1], createdAt: timestamp, updatedAt: timestamp },
        ],
        dict: [
            { id: 1, name: '用户性别', code: 'sys_user_gender', status: 'enabled', isBuiltin: true, description: '用户性别选项', createdAt: timestamp, updatedAt: timestamp },
            { id: 2, name: '业务状态', code: 'business_status', status: 'enabled', isBuiltin: false, description: '原型自定义字典', createdAt: timestamp, updatedAt: timestamp },
        ],
        dictItem: [
            ...['male', 'female', 'unknown'].map((value, i) => ({ id: i + 1, dictId: 1, label: ['男', '女', '未知'][i], value, color: ['blue', 'pink', 'grey'][i], sort: i, status: 'enabled', remark: null })),
            { id: 4, dictId: 2, label: '进行中', value: 'active', color: 'green', sort: 0, status: 'enabled', remark: null },
        ],
        config: [
            config(1, 'system.general.title', 'Weiran Prototype', 'general', '原型名称'),
            config(2, 'system.general.description', '用于快速生成交互原型', 'general', '项目说明', 'textarea'),
            config(3, 'system.demo.samples', '{}', 'demo', '组件演示保存值', 'json'),
            ...['image', 'video', 'file'].flatMap((kind, i) => [
                config(10 + i * 2, `system.upload.${kind}_formats`, ['jpg,jpeg,png,webp', 'mp4,webm,mov', 'pdf,txt,zip,xlsx,docx'][i]!, 'upload', `${kind} 允许格式`),
                config(11 + i * 2, `system.upload.${kind}_max_size_mb`, '20', 'upload', `${kind} 大小上限（MB）`, 'number'),
            ]),
            config(20, 'system.sms.enabled', 'false', 'sms', '模拟短信开关', 'switch'),
        ],
        configGroup: ['general', 'upload', 'demo', 'sms'].map((key, i) => ({ id: i + 1, key, groupKey: key === 'sms' ? 'config_sms' : 'config_system',
            label: ['基础设置', '上传设置', '组件演示', '短信设置'][i], isBuiltin: i !== 2, canDelete: i === 2, createdAt: timestamp })),
        area: [
            { id: 1, code: '330000', name: '浙江省', level: 'province', parentCode: null, sort: 0, status: 'enabled', createdAt: timestamp, updatedAt: timestamp },
            { id: 2, code: '330100', name: '杭州市', level: 'city', parentCode: '330000', sort: 0, status: 'enabled', createdAt: timestamp, updatedAt: timestamp },
            { id: 3, code: '330106', name: '西湖区', level: 'county', parentCode: '330100', sort: 0, status: 'enabled', createdAt: timestamp, updatedAt: timestamp },
        ],
        loginLog: Array.from({ length: 16 }, (_, i) => ({ id: i + 1, userId: 1, username: 'admin', ip: '127.0.0.1', browser: 'Chrome', os: 'macOS', userAgent: 'Prototype', eventType: i % 3 ? 'login' : 'logout', status: i === 5 ? 'fail' : 'success', message: '模拟访问记录', createdAt: timestamp })),
        operationLog: Array.from({ length: 16 }, (_, i) => ({ id: i + 1, userId: 1, username: 'admin', module: 'system', description: ['新增用户', '更新配置', '分配角色'][i % 3], method: 'POST', path: '/prototype/action', requestBody: '{}', responseCode: 0, success: true, errorMessage: null, durationMs: 32 + i, ip: '127.0.0.1', userAgent: 'Prototype', createdAt: timestamp })),
        mediaLibrary: [], batchJob: [], identity: [],
    };
}
